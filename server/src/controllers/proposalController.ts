import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

function incrementVersion(version: string): string {
  const match = version.match(/^v(\d+)\.(\d+)$/);
  if (!match) return 'v0.2';
  return `v${match[1]}.${parseInt(match[2]) + 1}`;
}

export const createProposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string;

    const workspace = await prisma.projectWorkspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!studentProfile || workspace.studentId !== studentProfile.id) {
      throw new AppError('You can only create proposals in your own workspace', 403);
    }

    const { title, abstract, problemStatement, objectives, methodology, techStack, timeline, references } = req.body;

    const proposal = await prisma.proposal.create({
      data: {
        workspaceId,
        status: 'DRAFT',
        versions: {
          create: {
            versionNumber: 'v0.1',
            title,
            abstract,
            problemStatement,
            objectives,
            methodology,
            techStack,
            timeline,
            references,
          },
        },
      },
      include: { versions: true },
    });

    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

export const getProposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const proposalId = req.params.id as string;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        workspace: {
          include: {
            student: { include: { user: { select: { id: true, name: true, email: true } } } },
            supervisor: { include: { user: { select: { id: true, name: true, email: true } } } },
            projectProfile: { select: { id: true, title: true, domain: true } },
          },
        },
        versions: {
          orderBy: { createdAt: 'asc' },
          include: {
            comments: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    const isStudent = proposal.workspace.student.user.id === req.user!.id;
    const isSupervisor = proposal.workspace.supervisor.user.id === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isStudent && !isSupervisor && !isAdmin) {
      throw new AppError('You do not have access to this proposal', 403);
    }

    res.json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

export const updateProposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const proposalId = req.params.id as string;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        workspace: true,
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!studentProfile || proposal.workspace.studentId !== studentProfile.id) {
      throw new AppError('You can only update your own proposals', 403);
    }

    if (!['DRAFT', 'REVISIONS_REQUESTED', 'ADMIN_REVISIONS_REQUESTED'].includes(proposal.status)) {
      throw new AppError('Proposal cannot be updated in its current status', 400);
    }

    let latestVersion = proposal.versions[0];

    if (latestVersion.isLocked) {
      const newVersionNumber = incrementVersion(latestVersion.versionNumber);
      latestVersion = await prisma.proposalVersion.create({
        data: {
          proposalId,
          versionNumber: newVersionNumber,
          title: latestVersion.title,
          abstract: latestVersion.abstract,
          problemStatement: latestVersion.problemStatement,
          objectives: latestVersion.objectives,
          methodology: latestVersion.methodology,
          techStack: latestVersion.techStack,
          timeline: latestVersion.timeline,
          references: latestVersion.references,
        },
      });
    }

    const { title, abstract, problemStatement, objectives, methodology, techStack, timeline, references } = req.body;

    const updated = await prisma.proposalVersion.update({
      where: { id: latestVersion.id },
      data: {
        ...(title !== undefined && { title }),
        ...(abstract !== undefined && { abstract }),
        ...(problemStatement !== undefined && { problemStatement }),
        ...(objectives !== undefined && { objectives }),
        ...(methodology !== undefined && { methodology }),
        ...(techStack !== undefined && { techStack }),
        ...(timeline !== undefined && { timeline }),
        ...(references !== undefined && { references }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const submitProposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const proposalId = req.params.id as string;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        workspace: {
          include: {
            student: true,
            supervisor: { include: { user: { select: { id: true, name: true } } } },
          },
        },
        versions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!studentProfile || proposal.workspace.studentId !== studentProfile.id) {
      throw new AppError('You can only submit your own proposals', 403);
    }

    if (!['DRAFT', 'REVISIONS_REQUESTED', 'ADMIN_REVISIONS_REQUESTED'].includes(proposal.status)) {
      throw new AppError('Proposal cannot be submitted in its current status', 400);
    }

    const { changeSummary } = req.body;
    const latestVersion = proposal.versions[0];

    if (changeSummary) {
      if (latestVersion.isLocked) {
        // Student submitted directly without calling update first — create a new locked version
        const newVersionNumber = incrementVersion(latestVersion.versionNumber);
        await prisma.proposalVersion.create({
          data: {
            proposalId,
            versionNumber: newVersionNumber,
            title: latestVersion.title,
            abstract: latestVersion.abstract,
            problemStatement: latestVersion.problemStatement,
            objectives: latestVersion.objectives,
            methodology: latestVersion.methodology,
            techStack: latestVersion.techStack,
            timeline: latestVersion.timeline,
            references: latestVersion.references,
            changeSummary,
            isLocked: true,
          },
        });
      } else {
        await prisma.proposalVersion.update({
          where: { id: latestVersion.id },
          data: { changeSummary, isLocked: true },
        });
      }
    } else {
      if (latestVersion.isLocked) {
        throw new AppError('Latest version is already locked', 400);
      }
      await prisma.proposalVersion.update({
        where: { id: latestVersion.id },
        data: { isLocked: true },
      });
    }

    const updated = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'SUBMITTED' },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    await createNotification(
      proposal.workspace.supervisor.user.id,
      'PROPOSAL_SUBMITTED',
      'Proposal Submitted for Review',
      `${req.user!.name} has submitted a proposal for review.`,
      { proposalId }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const supervisorReviewProposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const proposalId = req.params.id as string;
    const { action, feedback, deadline } = req.body;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        workspace: {
          include: {
            student: { include: { user: { select: { id: true, name: true } } } },
            supervisor: true,
          },
        },
        versions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!supervisorProfile || proposal.workspace.supervisorId !== supervisorProfile.id) {
      throw new AppError('You are not the supervisor for this proposal', 403);
    }

    if (proposal.status !== 'SUBMITTED') {
      throw new AppError('Proposal is not in SUBMITTED status', 400);
    }

    const latestVersion = proposal.versions[0];
    const studentUserId = proposal.workspace.student.user.id;

    if (action === 'APPROVE') {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'SUPERVISOR_APPROVED' },
      });

      await createNotification(
        studentUserId,
        'PROPOSAL_APPROVED',
        'Proposal Approved by Supervisor',
        'Your proposal has been approved by your supervisor and is now pending admin review.',
        { proposalId }
      );
    } else if (action === 'REQUEST_REVISIONS') {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'REVISIONS_REQUESTED' },
      });

      if (feedback) {
        await prisma.proposalComment.create({
          data: {
            versionId: latestVersion.id,
            userId: req.user!.id,
            section: 'general',
            content: feedback,
          },
        });
      }

      await createNotification(
        studentUserId,
        'PROPOSAL_REVISIONS',
        'Proposal Revisions Requested',
        `Your supervisor has requested revisions on your proposal.${feedback ? ` Feedback: ${feedback}` : ''}${deadline ? ` Deadline: ${deadline}` : ''}`,
        { proposalId }
      );

      // Flag excessive revisions to admin
      const versionCount = proposal.versions.length;
      const session = await prisma.academicSession.findFirst({
        where: { isActive: true },
      });

      if (session && versionCount >= session.maxRevisions) {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });

        for (const admin of admins) {
          await createNotification(
            admin.id,
            'EXCESSIVE_REVISIONS',
            'Excessive Proposal Revisions',
            `Proposal by ${proposal.workspace.student.user.name} has reached ${versionCount} revisions (limit: ${session.maxRevisions}).`,
            { proposalId }
          );
        }
      }
    } else if (action === 'REJECT') {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'REJECTED' },
      });

      if (feedback) {
        await prisma.proposalComment.create({
          data: {
            versionId: latestVersion.id,
            userId: req.user!.id,
            section: 'general',
            content: feedback,
          },
        });
      }

      await createNotification(
        studentUserId,
        'PROPOSAL_REJECTED',
        'Proposal Rejected',
        `Your proposal has been rejected by your supervisor.${feedback ? ` Reason: ${feedback}` : ''}`,
        { proposalId }
      );
    }

    const updated = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { comments: { orderBy: { createdAt: 'asc' } } },
        },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const versionId = req.params.versionId as string;
    const { section, content } = req.body;

    const version = await prisma.proposalVersion.findUnique({
      where: { id: versionId },
      include: {
        proposal: {
          include: {
            workspace: {
              include: {
                student: { include: { user: { select: { id: true } } } },
                supervisor: { include: { user: { select: { id: true } } } },
              },
            },
          },
        },
      },
    });

    if (!version) {
      throw new AppError('Proposal version not found', 404);
    }

    const ws = version.proposal.workspace;
    const isStudent = ws.student.user.id === req.user!.id;
    const isSupervisor = ws.supervisor.user.id === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isStudent && !isSupervisor && !isAdmin) {
      throw new AppError('You do not have access to comment on this proposal', 403);
    }

    const comment = await prisma.proposalComment.create({
      data: {
        versionId,
        userId: req.user!.id,
        section,
        content,
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

export const getSupervisorProposals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!supervisorProfile) {
      throw new AppError('Supervisor profile not found', 404);
    }

    const proposals = await prisma.proposal.findMany({
      where: {
        status: 'SUBMITTED',
        workspace: { supervisorId: supervisorProfile.id },
      },
      include: {
        workspace: {
          include: {
            student: { include: { user: { select: { id: true, name: true, email: true } } } },
            projectProfile: { select: { id: true, title: true, domain: true } },
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { comments: { orderBy: { createdAt: 'asc' } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
};

export const getAdminProposals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { status: 'SUPERVISOR_APPROVED' },
      include: {
        workspace: {
          include: {
            student: { include: { user: { select: { id: true, name: true, email: true } } } },
            supervisor: { include: { user: { select: { id: true, name: true, email: true } } } },
            projectProfile: { select: { id: true, title: true, domain: true } },
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { comments: { orderBy: { createdAt: 'asc' } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
};

export const adminReviewProposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const proposalId = req.params.id as string;
    const { action, feedback } = req.body;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        workspace: {
          include: {
            student: { include: { user: { select: { id: true, name: true } } } },
            supervisor: { include: { user: { select: { id: true, name: true } } } },
          },
        },
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    if (proposal.status !== 'SUPERVISOR_APPROVED') {
      throw new AppError('Proposal is not in SUPERVISOR_APPROVED status', 400);
    }

    const latestVersion = proposal.versions[0];
    const studentUserId = proposal.workspace.student.user.id;
    const supervisorUserId = proposal.workspace.supervisor.user.id;

    if (action === 'APPROVE') {
      await prisma.proposalVersion.update({
        where: { id: latestVersion.id },
        data: {
          isLocked: true,
          pdfUrl: `/uploads/proposals/${proposalId}/proposal-${latestVersion.versionNumber}.pdf`,
        },
      });

      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'ADMIN_APPROVED' },
      });

      await createNotification(
        studentUserId,
        'PROPOSAL_FINAL_APPROVED',
        'Proposal Approved',
        'Your proposal has been approved by the admin. You may now proceed with your project.',
        { proposalId }
      );

      await createNotification(
        supervisorUserId,
        'PROPOSAL_FINAL_APPROVED',
        'Proposal Approved',
        `The proposal by ${proposal.workspace.student.user.name} has been approved by admin.`,
        { proposalId }
      );
    } else if (action === 'REQUEST_REVISIONS') {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'ADMIN_REVISIONS_REQUESTED' },
      });

      if (feedback) {
        await prisma.proposalComment.create({
          data: {
            versionId: latestVersion.id,
            userId: req.user!.id,
            section: 'admin-review',
            content: feedback,
          },
        });
      }

      await createNotification(
        studentUserId,
        'ADMIN_REVISIONS',
        'Admin Revisions Requested',
        `The admin has requested revisions on your proposal.${feedback ? ` Feedback: ${feedback}` : ''}`,
        { proposalId }
      );

      await createNotification(
        supervisorUserId,
        'ADMIN_REVISIONS',
        'Admin Revisions Requested',
        `The admin has requested revisions on the proposal by ${proposal.workspace.student.user.name}.`,
        { proposalId }
      );
    } else if (action === 'REJECT') {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'REJECTED' },
      });

      if (feedback) {
        await prisma.proposalComment.create({
          data: {
            versionId: latestVersion.id,
            userId: req.user!.id,
            section: 'admin-review',
            content: feedback,
          },
        });
      }

      await createNotification(
        studentUserId,
        'PROPOSAL_REJECTED',
        'Proposal Rejected',
        `Your proposal has been rejected by admin.${feedback ? ` Reason: ${feedback}` : ''}`,
        { proposalId }
      );

      await createNotification(
        supervisorUserId,
        'PROPOSAL_REJECTED',
        'Proposal Rejected',
        `The proposal by ${proposal.workspace.student.user.name} has been rejected by admin.`,
        { proposalId }
      );
    }

    const updated = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { comments: { orderBy: { createdAt: 'asc' } } },
        },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
