import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

export const sendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!studentProfile) {
      throw new AppError('Student profile not found', 404);
    }

    const { projectProfileId, supervisorId, message } = req.body;

    const project = await prisma.projectProfile.findUnique({
      where: { id: projectProfileId },
    });

    if (!project || project.studentId !== studentProfile.id) {
      throw new AppError('Project profile not found or does not belong to you', 404);
    }

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { id: supervisorId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!supervisor) {
      throw new AppError('Supervisor not found', 404);
    }

    if (supervisor.availableSlots <= 0) {
      throw new AppError('Supervisor has no available slots', 400);
    }

    const session = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    const maxRequests = session?.maxRequests ?? 3;

    const activeCount = await prisma.supervisionRequest.count({
      where: {
        studentId: studentProfile.id,
        status: { in: ['PENDING', 'INFO_REQUESTED'] },
      },
    });

    if (activeCount >= maxRequests) {
      throw new AppError(`You can have at most ${maxRequests} active requests`, 400);
    }

    const existingRequest = await prisma.supervisionRequest.findFirst({
      where: {
        studentId: studentProfile.id,
        supervisorId,
        projectProfileId,
        status: { in: ['PENDING', 'INFO_REQUESTED'] },
      },
    });

    if (existingRequest) {
      throw new AppError('You already have an active request for this project with this supervisor', 400);
    }

    const request = await prisma.supervisionRequest.create({
      data: {
        studentId: studentProfile.id,
        supervisorId,
        projectProfileId,
        message,
      },
      include: {
        projectProfile: true,
        student: { include: { user: { select: { name: true } } } },
      },
    });

    await createNotification(
      supervisor.user.id,
      'NEW_REQUEST',
      'New Supervision Request',
      `${req.user!.name} has sent you a supervision request for "${project.title}".`,
      { requestId: request.id, projectId: projectProfileId }
    );

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

export const getStudentRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!studentProfile) {
      throw new AppError('Student profile not found', 404);
    }

    const requests = await prisma.supervisionRequest.findMany({
      where: { studentId: studentProfile.id },
      include: {
        supervisor: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        projectProfile: {
          select: { id: true, title: true, domain: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

export const getSupervisorRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!supervisorProfile) {
      throw new AppError('Supervisor profile not found', 404);
    }

    const requests = await prisma.supervisionRequest.findMany({
      where: {
        supervisorId: supervisorProfile.id,
        status: { in: ['PENDING', 'INFO_REQUESTED'] },
      },
      include: {
        student: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        projectProfile: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

export const respondToRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!supervisorProfile) {
      throw new AppError('Supervisor profile not found', 404);
    }

    const requestId = req.params.id as string;
    const { action, reason } = req.body;

    const request = await prisma.supervisionRequest.findUnique({
      where: { id: requestId },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        projectProfile: true,
      },
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.supervisorId !== supervisorProfile.id) {
      throw new AppError('This request is not assigned to you', 403);
    }

    if (!['PENDING', 'INFO_REQUESTED'].includes(request.status)) {
      throw new AppError('This request can no longer be responded to', 400);
    }

    if (action === 'ACCEPT') {
      await prisma.$transaction(async (tx) => {
        await tx.supervisionRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
        });

        await tx.supervisionRequest.updateMany({
          where: {
            studentId: request.studentId,
            id: { not: requestId },
            status: { in: ['PENDING', 'INFO_REQUESTED'] },
          },
          data: { status: 'WITHDRAWN', rejectionReason: 'Auto-withdrawn: another request accepted' },
        });

        await tx.supervisorProfile.update({
          where: { id: supervisorProfile.id },
          data: { availableSlots: { decrement: 1 } },
        });

        await tx.projectWorkspace.create({
          data: {
            studentId: request.studentId,
            supervisorId: supervisorProfile.id,
            projectProfileId: request.projectProfileId,
          },
        });
      });

      await createNotification(
        request.student.user.id,
        'REQUEST_ACCEPTED',
        'Supervision Request Accepted',
        `${request.supervisor.user.name} has accepted your request for "${request.projectProfile.title}". Your project workspace has been created.`,
        { requestId, workspaceCreated: true }
      );
    } else if (action === 'REJECT') {
      await prisma.supervisionRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', rejectionReason: reason || null },
      });

      await createNotification(
        request.student.user.id,
        'REQUEST_REJECTED',
        'Supervision Request Rejected',
        `${request.supervisor.user.name} has declined your request for "${request.projectProfile.title}".${reason ? ` Reason: ${reason}` : ''}`,
        { requestId }
      );
    } else if (action === 'REQUEST_INFO') {
      await prisma.supervisionRequest.update({
        where: { id: requestId },
        data: { status: 'INFO_REQUESTED' },
      });

      if (reason) {
        await prisma.requestMessage.create({
          data: {
            requestId,
            senderId: req.user!.id,
            message: reason,
          },
        });
      }

      await createNotification(
        request.student.user.id,
        'INFO_REQUESTED',
        'More Information Requested',
        `${request.supervisor.user.name} has requested more information about "${request.projectProfile.title}".${reason ? ` Message: ${reason}` : ''}`,
        { requestId }
      );
    }

    const updated = await prisma.supervisionRequest.findUnique({
      where: { id: requestId },
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        projectProfile: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requestId = req.params.id as string;
    const { message } = req.body;

    const request = await prisma.supervisionRequest.findUnique({
      where: { id: requestId },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
      },
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== 'INFO_REQUESTED') {
      throw new AppError('Messages can only be sent on requests with INFO_REQUESTED status', 400);
    }

    const isStudent = request.student.user.id === req.user!.id;
    const isSupervisor = request.supervisor.user.id === req.user!.id;

    if (!isStudent && !isSupervisor) {
      throw new AppError('You are not part of this request', 403);
    }

    const newMessage = await prisma.requestMessage.create({
      data: {
        requestId,
        senderId: req.user!.id,
        message,
      },
    });

    const recipientId = isStudent ? request.supervisor.user.id : request.student.user.id;
    await createNotification(
      recipientId,
      'REQUEST_MESSAGE',
      'New Message on Supervision Request',
      `${req.user!.name} sent a message regarding the supervision request.`,
      { requestId }
    );

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    next(error);
  }
};
