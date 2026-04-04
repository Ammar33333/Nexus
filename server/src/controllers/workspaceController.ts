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

    res.json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};
