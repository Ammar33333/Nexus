import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

export const createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, items } = req.body;

    const template = await prisma.milestoneTemplate.create({
      data: {
        name,
        items: {
          create: items.map((item: { title: string; description: string; orderIndex: number; submissionType: string; daysFromStart: number }) => ({
            title: item.title,
            description: item.description,
            orderIndex: item.orderIndex,
            submissionType: item.submissionType,
            daysFromStart: item.daysFromStart,
          })),
        },
      },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const getTemplates = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.milestoneTemplate.findMany({
      include: { items: { orderBy: { orderIndex: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const getMilestones = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string;

    const workspace = await prisma.projectWorkspace.findUnique({
      where: { id: workspaceId },
      include: {
        student: { include: { user: { select: { id: true } } } },
        supervisor: { include: { user: { select: { id: true } } } },
      },
    });
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    const isStudent = workspace.student.user.id === req.user!.id;
    const isSupervisor = workspace.supervisor.user.id === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isStudent && !isSupervisor && !isAdmin) {
      throw new AppError('You do not have access to this workspace', 403);
    }

    const milestones = await prisma.milestone.findMany({
      where: { workspaceId },
      include: {
        submissions: { orderBy: { submittedAt: 'desc' } },
        evaluation: {
          include: { scores: { include: { criterion: true } } },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    res.json({ success: true, data: milestones });
  } catch (error) {
    next(error);
  }
};

export const createMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const { title, description, dueDate, submissionType, orderIndex, rubricId } = req.body;

    const workspace = await prisma.projectWorkspace.findUnique({
      where: { id: workspaceId },
      include: { supervisor: { include: { user: { select: { id: true } } } } },
    });
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (req.user!.role !== 'ADMIN' && workspace.supervisor.user.id !== req.user!.id) {
      throw new AppError('Only the assigned supervisor or an admin can create milestones', 403);
    }

    const milestone = await prisma.milestone.create({
      data: {
        workspaceId,
        title,
        description,
        dueDate: new Date(dueDate),
        submissionType: submissionType || 'FILE',
        orderIndex,
        rubricId: rubricId || null,
      },
    });

    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

export const applyTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const { templateId } = req.body;

    const workspace = await prisma.projectWorkspace.findUnique({
      where: { id: workspaceId },
      include: { supervisor: { include: { user: { select: { id: true } } } } },
    });
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (req.user!.role !== 'ADMIN' && workspace.supervisor.user.id !== req.user!.id) {
      throw new AppError('Only the assigned supervisor or an admin can apply templates', 403);
    }

    const template = await prisma.milestoneTemplate.findUnique({
      where: { id: templateId },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    const now = new Date();
    const milestones = await prisma.$transaction(
      template.items.map((item) => {
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + item.daysFromStart);

        return prisma.milestone.create({
          data: {
            workspaceId,
            title: item.title,
            description: item.description,
            dueDate,
            submissionType: item.submissionType,
            orderIndex: item.orderIndex,
          },
        });
      })
    );

    res.status(201).json({ success: true, data: milestones });
  } catch (error) {
    next(error);
  }
};

export const updateMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { title, description, dueDate, submissionType, orderIndex, rubricId, status } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        workspace: {
          include: { supervisor: { include: { user: { select: { id: true } } } } },
        },
      },
    });
    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    if (req.user!.role !== 'ADMIN' && milestone.workspace.supervisor.user.id !== req.user!.id) {
      throw new AppError('Only the assigned supervisor or an admin can update milestones', 403);
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(submissionType !== undefined && { submissionType }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(rubricId !== undefined && { rubricId }),
        ...(status !== undefined && { status }),
      },
      include: { submissions: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const submitDeliverable = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const milestoneId = req.params.id as string;
    const { repoLink, notes } = req.body;
    const file = req.file;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        workspace: {
          include: {
            student: { include: { user: { select: { id: true, name: true } } } },
            supervisor: { include: { user: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!studentProfile || milestone.workspace.studentId !== studentProfile.id) {
      throw new AppError('You can only submit deliverables for your own milestones', 403);
    }

    if (milestone.status === 'ACCEPTED') {
      throw new AppError('Milestone has already been accepted', 400);
    }

    const fileUrl = file ? `/uploads/${file.filename}` : undefined;

    const submission = await prisma.milestoneSubmission.create({
      data: {
        milestoneId,
        fileUrl: fileUrl || null,
        repoLink: repoLink || null,
        notes: notes || null,
      },
    });

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'SUBMITTED' },
    });

    await createNotification(
      milestone.workspace.supervisor.user.id,
      'MILESTONE_SUBMITTED',
      'Milestone Deliverable Submitted',
      `${milestone.workspace.student.user.name} has submitted a deliverable for milestone "${milestone.title}".`,
      { milestoneId, submissionId: submission.id }
    );

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
};

export const reviewSubmission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const submissionId = req.params.id as string;
    const { action, feedback } = req.body;

    const submission = await prisma.milestoneSubmission.findUnique({
      where: { id: submissionId },
      include: {
        milestone: {
          include: {
            workspace: {
              include: {
                student: { include: { user: { select: { id: true, name: true } } } },
                supervisor: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!supervisorProfile || submission.milestone.workspace.supervisorId !== supervisorProfile.id) {
      throw new AppError('You are not the supervisor for this workspace', 403);
    }

    await prisma.milestoneSubmission.update({
      where: { id: submissionId },
      data: { feedback: feedback || null },
    });

    const newStatus = action as 'ACCEPTED' | 'NEEDS_CHANGES';

    await prisma.milestone.update({
      where: { id: submission.milestoneId },
      data: { status: newStatus },
    });

    const studentUserId = submission.milestone.workspace.student.user.id;
    const milestoneTitle = submission.milestone.title;

    if (newStatus === 'ACCEPTED') {
      await createNotification(
        studentUserId,
        'MILESTONE_ACCEPTED',
        'Milestone Accepted',
        `Your submission for "${milestoneTitle}" has been accepted.`,
        { milestoneId: submission.milestoneId }
      );
    } else {
      await createNotification(
        studentUserId,
        'MILESTONE_NEEDS_CHANGES',
        'Milestone Needs Changes',
        `Your submission for "${milestoneTitle}" requires changes.${feedback ? ` Feedback: ${feedback}` : ''}`,
        { milestoneId: submission.milestoneId }
      );
    }

    const updated = await prisma.milestoneSubmission.findUnique({
      where: { id: submissionId },
      include: { milestone: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
