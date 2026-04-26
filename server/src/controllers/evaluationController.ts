import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const createRubric = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, criteria } = req.body;

    const rubric = await prisma.evaluationRubric.create({
      data: {
        name,
        criteria: {
          create: criteria.map((c: { title: string; description: string; maxScore: number; weight: number; section: string }) => ({
            title: c.title,
            description: c.description,
            maxScore: c.maxScore,
            weight: c.weight,
            section: c.section,
          })),
        },
      },
      include: { criteria: true },
    });

    res.status(201).json({ success: true, data: rubric });
  } catch (error) {
    next(error);
  }
};

export const getRubrics = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rubrics = await prisma.evaluationRubric.findMany({
      include: { criteria: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: rubrics });
  } catch (error) {
    next(error);
  }
};

export const submitEvaluation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const milestoneId = req.params.id as string;
    const { rubricId, scores, feedback } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { evaluation: true, workspace: { include: { supervisor: true } } },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!supervisorProfile || milestone.workspace.supervisorId !== supervisorProfile.id) {
      throw new AppError('You are not the supervisor for this workspace', 403);
    }

    if (milestone.evaluation) {
      throw new AppError('Evaluation already exists for this milestone', 400);
    }

    const rubric = await prisma.evaluationRubric.findUnique({
      where: { id: rubricId },
      include: { criteria: true },
    });

    if (!rubric) {
      throw new AppError('Rubric not found', 404);
    }

    const criteriaMap = new Map(rubric.criteria.map((c) => [c.id, c]));

    let weightedScoreSum = 0;
    let weightedMaxSum = 0;

    for (const s of scores as { criterionId: string; score: number; comment?: string }[]) {
      const criterion = criteriaMap.get(s.criterionId);
      if (!criterion) {
        throw new AppError(`Criterion ${s.criterionId} not found in rubric`, 400);
      }
      if (s.score > criterion.maxScore) {
        throw new AppError(`Score for "${criterion.title}" exceeds max score of ${criterion.maxScore}`, 400);
      }
      weightedScoreSum += s.score * criterion.weight;
      weightedMaxSum += criterion.maxScore * criterion.weight;
    }

    const totalScore = weightedMaxSum > 0 ? (weightedScoreSum / weightedMaxSum) * 100 : 0;

    const evaluation = await prisma.evaluation.create({
      data: {
        milestoneId,
        rubricId,
        evaluatorId: req.user!.id,
        totalScore: Math.round(totalScore * 100) / 100,
        feedback: feedback || null,
        scores: {
          create: (scores as { criterionId: string; score: number; comment?: string }[]).map((s) => ({
            criterionId: s.criterionId,
            score: s.score,
            comment: s.comment || null,
          })),
        },
      },
      include: {
        scores: { include: { criterion: true } },
        rubric: true,
      },
    });

    res.status(201).json({ success: true, data: evaluation });
  } catch (error) {
    next(error);
  }
};

export const getEvaluation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        scores: { include: { criterion: true } },
        rubric: { include: { criteria: true } },
        milestone: {
          include: {
            workspace: {
              include: {
                student: { include: { user: { select: { id: true, name: true, email: true } } } },
                supervisor: { include: { user: { select: { id: true, name: true, email: true } } } },
                projectProfile: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    const ws = evaluation.milestone.workspace;
    const isStudent = ws.student.user.id === req.user!.id;
    const isSupervisor = ws.supervisor.user.id === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isStudent && !isSupervisor && !isAdmin) {
      throw new AppError('You do not have access to this evaluation', 403);
    }

    res.json({ success: true, data: evaluation });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceEvaluations = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
        evaluation: {
          include: {
            scores: { include: { criterion: true } },
            rubric: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    const evaluations = milestones
      .filter((m) => m.evaluation)
      .map((m) => m.evaluation!);

    const totalScores = evaluations.map((e) => e.totalScore ?? 0);
    const runningTotal = totalScores.length > 0
      ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length
      : 0;

    res.json({
      success: true,
      data: {
        milestones,
        summary: {
          totalEvaluations: evaluations.length,
          averageScore: Math.round(runningTotal * 100) / 100,
          evaluations,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
