import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

export const getDashboard = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [studentCount, supervisorCount, workspaceCount] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'SUPERVISOR' } }),
      prisma.projectWorkspace.count(),
    ]);

    const workspacesWithMilestones = await prisma.projectWorkspace.findMany({
      include: {
        milestones: { select: { status: true, dueDate: true } },
      },
    });

    const now = new Date();
    let onTrack = 0;
    let atRisk = 0;
    let overdue = 0;

    for (const ws of workspacesWithMilestones) {
      const statuses = ws.milestones.map((m) => m.status);
      if (statuses.includes('OVERDUE')) {
        overdue++;
      } else if (statuses.includes('NEEDS_CHANGES') || ws.milestones.some((m) => m.status === 'NOT_SUBMITTED' && m.dueDate < now)) {
        atRisk++;
      } else {
        onTrack++;
      }
    }

    const supervisorWorkloads = await prisma.projectWorkspace.groupBy({
      by: ['supervisorId'],
      _count: { id: true },
    });

    const supervisorProfiles = await prisma.supervisorProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const supervisorWorkload = supervisorProfiles.map((sp) => {
      const workload = supervisorWorkloads.find((w) => w.supervisorId === sp.id);
      return {
        supervisorId: sp.id,
        name: sp.user.name,
        email: sp.user.email,
        workspaceCount: workload?._count.id ?? 0,
        totalSlots: sp.totalSlots,
        availableSlots: sp.availableSlots,
      };
    });

    const totalMilestones = await prisma.milestone.count();
    const evaluatedMilestones = await prisma.evaluation.count();

    const evaluations = await prisma.evaluation.findMany({
      where: { totalScore: { not: null } },
      select: { totalScore: true },
    });

    const gradeDistribution: Record<string, number> = {
      'A (90-100)': 0,
      'B (80-89)': 0,
      'C (70-79)': 0,
      'D (60-69)': 0,
      'F (0-59)': 0,
    };

    for (const e of evaluations) {
      const score = e.totalScore!;
      if (score >= 90) gradeDistribution['A (90-100)']++;
      else if (score >= 80) gradeDistribution['B (80-89)']++;
      else if (score >= 70) gradeDistribution['C (70-79)']++;
      else if (score >= 60) gradeDistribution['D (60-69)']++;
      else gradeDistribution['F (0-59)']++;
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents: studentCount,
          totalSupervisors: supervisorCount,
          activeProjects: workspaceCount,
        },
        projectStatus: { onTrack, atRisk, overdue },
        supervisorWorkload,
        evaluationCompletion: {
          evaluated: evaluatedMilestones,
          total: totalMilestones,
          percentage: totalMilestones > 0 ? Math.round((evaluatedMilestones / totalMilestones) * 100) : 0,
        },
        gradeDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const lockGrades = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;

    let workspaceFilter = {};
    if (sessionId) {
      const session = await prisma.academicSession.findUnique({ where: { id: sessionId } });
      if (!session) {
        throw new AppError('Session not found', 404);
      }
    }

    const workspaceIds = (
      await prisma.projectWorkspace.findMany({
        where: workspaceFilter,
        select: { id: true },
      })
    ).map((w) => w.id);

    const result = await prisma.evaluation.updateMany({
      where: {
        milestone: { workspaceId: { in: workspaceIds } },
        isLocked: false,
      },
      data: { isLocked: true },
    });

    res.json({
      success: true,
      message: `Locked ${result.count} evaluation(s)`,
      data: { lockedCount: result.count },
    });
  } catch (error) {
    next(error);
  }
};

export const requestJustification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const evaluationId = req.params.id as string;
    const { message } = req.body;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        milestone: {
          include: {
            workspace: {
              include: {
                student: { include: { user: { select: { id: true, name: true } } } },
                supervisor: { include: { user: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
    });

    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    const supervisorUserId = evaluation.milestone.workspace.supervisor.user.id;
    const studentName = evaluation.milestone.workspace.student.user.name;

    await createNotification(
      supervisorUserId,
      'GRADE_JUSTIFICATION_REQUEST',
      'Grade Justification Requested',
      `Admin has requested justification for your evaluation of "${evaluation.milestone.title}" (student: ${studentName}). ${message}`,
      { evaluationId }
    );

    res.json({
      success: true,
      message: 'Justification request sent to supervisor',
    });
  } catch (error) {
    next(error);
  }
};

export const generateReport = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaces = await prisma.projectWorkspace.findMany({
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
        supervisor: { include: { user: { select: { id: true, name: true, email: true } } } },
        projectProfile: { select: { title: true, domain: true } },
        milestones: {
          include: {
            evaluation: {
              include: { scores: { include: { criterion: true } } },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    const report = workspaces.map((ws) => {
      const evaluations = ws.milestones
        .filter((m) => m.evaluation)
        .map((m) => ({
          milestone: m.title,
          score: m.evaluation!.totalScore,
          isLocked: m.evaluation!.isLocked,
        }));

      const scores = evaluations.map((e) => e.score ?? 0);
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

      return {
        workspaceId: ws.id,
        student: ws.student.user,
        supervisor: ws.supervisor.user,
        project: ws.projectProfile.title,
        domain: ws.projectProfile.domain,
        milestoneCount: ws.milestones.length,
        evaluatedCount: evaluations.length,
        evaluations,
        averageScore: averageScore !== null ? Math.round(averageScore * 100) / 100 : null,
      };
    });

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const reassignSupervisor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.id as string;
    const { newSupervisorId } = req.body;

    const workspace = await prisma.projectWorkspace.findUnique({
      where: { id: workspaceId },
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        supervisor: { include: { user: { select: { id: true, name: true } } } },
        projectProfile: { select: { title: true } },
      },
    });

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    const newSupervisor = await prisma.supervisorProfile.findUnique({
      where: { id: newSupervisorId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!newSupervisor) {
      throw new AppError('New supervisor not found', 404);
    }

    if (newSupervisor.availableSlots <= 0) {
      throw new AppError('New supervisor has no available slots', 400);
    }

    const oldSupervisorId = workspace.supervisorId;
    const oldSupervisorUserId = workspace.supervisor.user.id;
    const oldSupervisorName = workspace.supervisor.user.name;

    await prisma.$transaction([
      prisma.projectWorkspace.update({
        where: { id: workspaceId },
        data: { supervisorId: newSupervisorId },
      }),
      prisma.supervisorProfile.update({
        where: { id: oldSupervisorId },
        data: { availableSlots: { increment: 1 } },
      }),
      prisma.supervisorProfile.update({
        where: { id: newSupervisorId },
        data: { availableSlots: { decrement: 1 } },
      }),
    ]);

    const projectTitle = workspace.projectProfile.title;
    const studentName = workspace.student.user.name;

    await createNotification(
      oldSupervisorUserId,
      'SUPERVISOR_REASSIGNED',
      'Workspace Reassigned',
      `You have been unassigned from the project "${projectTitle}" (student: ${studentName}). A new supervisor has been assigned.`,
      { workspaceId }
    );

    await createNotification(
      newSupervisor.user.id,
      'SUPERVISOR_ASSIGNED',
      'New Workspace Assigned',
      `You have been assigned to supervise the project "${projectTitle}" (student: ${studentName}), previously supervised by ${oldSupervisorName}.`,
      { workspaceId }
    );

    await createNotification(
      workspace.student.user.id,
      'SUPERVISOR_CHANGED',
      'Supervisor Changed',
      `Your supervisor for "${projectTitle}" has been changed from ${oldSupervisorName} to ${newSupervisor.user.name}.`,
      { workspaceId }
    );

    const updated = await prisma.projectWorkspace.findUnique({
      where: { id: workspaceId },
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
        supervisor: { include: { user: { select: { id: true, name: true, email: true } } } },
        projectProfile: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
