import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!studentProfile) {
      throw new AppError('Student profile not found', 404);
    }

    const { title, domain, skills, description, supervisionStyle } = req.body;

    const project = await prisma.projectProfile.create({
      data: {
        studentId: studentProfile.id,
        title,
        domain,
        skills,
        description,
        supervisionStyle,
      },
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const getMyProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!studentProfile) {
      throw new AppError('Student profile not found', 404);
    }

    const projects = await prisma.projectProfile.findMany({
      where: { studentId: studentProfile.id },
      include: {
        supervisionRequests: {
          select: { id: true, status: true, supervisorId: true },
        },
        workspace: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.projectProfile.findUnique({
      where: { id: req.params.id as string },
      include: {
        student: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        supervisionRequests: {
          select: { id: true, status: true, supervisorId: true },
        },
        workspace: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const isOwner = project.student.user.id === req.user!.id;
    const isSupervisorOfProject = project.workspace?.id
      ? await prisma.projectWorkspace.findFirst({
          where: { projectProfileId: project.id, supervisor: { userId: req.user!.id } },
        })
      : null;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isSupervisorOfProject && !isAdmin) {
      throw new AppError('You do not have access to this project', 403);
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};
