import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.supervisorProfile.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!profile) {
      throw new AppError('Supervisor profile not found', 404);
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      department,
      expertiseAreas,
      researchInterests,
      totalSlots,
      supervisionStyle,
      bio,
    } = req.body;

    const profile = await prisma.supervisorProfile.update({
      where: { userId: req.user!.id },
      data: {
        ...(department !== undefined && { department }),
        ...(expertiseAreas !== undefined && { expertiseAreas }),
        ...(researchInterests !== undefined && { researchInterests }),
        ...(totalSlots !== undefined && {
          totalSlots,
          availableSlots: totalSlots,
        }),
        ...(supervisionStyle !== undefined && { supervisionStyle }),
        ...(bio !== undefined && { bio }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const profile = await prisma.supervisorProfile.findFirst({
      where: { userId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!profile) {
      throw new AppError('Supervisor not found', 404);
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};
