import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { runMatching } from '../services/matchingService';
import prisma from '../utils/prisma';

export const getMatches = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;

    const project = await prisma.projectProfile.findUnique({
      where: { id: projectId },
      include: { student: true },
    });

    if (!project) {
      throw new AppError('Project profile not found', 404);
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!studentProfile || project.studentId !== studentProfile.id) {
      throw new AppError('You can only run matching for your own projects', 403);
    }

    const matches = await runMatching(projectId);

    res.json({ success: true, data: matches });
  } catch (error) {
    next(error);
  }
};
