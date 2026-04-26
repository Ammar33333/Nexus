import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const workspace = await prisma.projectWorkspace.findUnique({
      where: { id },
      include: {
        projectProfile: true,
        student: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        supervisor: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        proposals: {
          include: {
            versions: {
              include: { comments: true },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
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

    res.json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};
