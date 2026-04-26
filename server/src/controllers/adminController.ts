import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getSession = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, name, year, semester, isActive } = req.body;

    let session;

    if (id) {
      if (isActive) {
        await prisma.$transaction([
          prisma.academicSession.updateMany({
            where: { isActive: true },
            data: { isActive: false },
          }),
          prisma.academicSession.update({
            where: { id },
            data: { name, year, semester, isActive },
          }),
        ]);
        session = await prisma.academicSession.findUnique({ where: { id } });
      } else {
        session = await prisma.academicSession.update({
          where: { id },
          data: { name, year, semester, isActive },
        });
      }
    } else {
      if (isActive) {
        await prisma.academicSession.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }
      session = await prisma.academicSession.create({
        data: {
          name: name || `${year} ${semester}`,
          year: year || new Date().getFullYear(),
          semester: semester || 'Fall',
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!session) {
      throw new AppError('No active academic session found', 404);
    }

    res.json({
      success: true,
      data: {
        maxRequests: session.maxRequests,
        requestTimeoutDays: session.requestTimeoutDays,
        reminderDays: session.reminderDays,
        maxRevisions: session.maxRevisions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { maxRequests, requestTimeoutDays, reminderDays, maxRevisions } = req.body;

    const session = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!session) {
      throw new AppError('No active academic session found', 404);
    }

    const updated = await prisma.academicSession.update({
      where: { id: session.id },
      data: {
        ...(maxRequests !== undefined && { maxRequests }),
        ...(requestTimeoutDays !== undefined && { requestTimeoutDays }),
        ...(reminderDays !== undefined && { reminderDays }),
        ...(maxRevisions !== undefined && { maxRevisions }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
