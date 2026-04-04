import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

export const scheduleMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const { date, time, agenda, mode, meetingLink, duration } = req.body;

    const workspace = await prisma.projectWorkspace.findUnique({
      where: { id: workspaceId },
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        supervisor: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    const meeting = await prisma.meeting.create({
      data: {
        workspaceId,
        date: new Date(date),
        time,
        agenda,
        mode,
        meetingLink: meetingLink || null,
        duration: duration || null,
      },
    });

    const schedulerIsStudent = req.user!.id === workspace.student.user.id;
    const recipientId = schedulerIsStudent
      ? workspace.supervisor.user.id
      : workspace.student.user.id;

    await createNotification(
      recipientId,
      'MEETING_SCHEDULED',
      'New Meeting Scheduled',
      `${req.user!.name} has scheduled a meeting on ${new Date(date).toLocaleDateString()} at ${time}. Agenda: ${agenda}`,
      { meetingId: meeting.id, workspaceId }
    );

    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

export const getMeetings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string;

    const workspace = await prisma.projectWorkspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    const meetings = await prisma.meeting.findMany({
      where: { workspaceId },
      include: { log: true },
      orderBy: { date: 'desc' },
    });

    const now = new Date();
    const upcoming = meetings.filter((m) => m.status === 'SCHEDULED' && new Date(m.date) >= now);
    const past = meetings.filter((m) => m.status !== 'SCHEDULED' || new Date(m.date) < now);

    res.json({ success: true, data: { upcoming, past } });
  } catch (error) {
    next(error);
  }
};

export const updateMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { date, time, agenda, mode, meetingLink, duration, status } = req.body;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            student: { include: { user: { select: { id: true, name: true } } } },
            supervisor: { include: { user: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(time !== undefined && { time }),
        ...(agenda !== undefined && { agenda }),
        ...(mode !== undefined && { mode }),
        ...(meetingLink !== undefined && { meetingLink }),
        ...(duration !== undefined && { duration }),
        ...(status !== undefined && { status }),
      },
      include: { log: true },
    });

    if (status === 'CANCELLED') {
      const recipientId =
        req.user!.id === meeting.workspace.student.user.id
          ? meeting.workspace.supervisor.user.id
          : meeting.workspace.student.user.id;

      await createNotification(
        recipientId,
        'MEETING_CANCELLED',
        'Meeting Cancelled',
        `${req.user!.name} has cancelled the meeting scheduled for ${meeting.date.toLocaleDateString()}.`,
        { meetingId: id }
      );
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const addMeetingLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const meetingId = req.params.id as string;
    const { attendance, summary, actionItems, nextMeetingDate } = req.body;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        log: true,
        workspace: {
          include: {
            student: { include: { user: { select: { id: true, name: true } } } },
            supervisor: true,
          },
        },
      },
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!supervisorProfile || meeting.workspace.supervisorId !== supervisorProfile.id) {
      throw new AppError('Only the supervisor can add meeting logs', 403);
    }

    if (meeting.log) {
      throw new AppError('Meeting log already exists', 400);
    }

    const log = await prisma.meetingLog.create({
      data: {
        meetingId,
        attendance,
        summary,
        actionItems,
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : null,
      },
    });

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'COMPLETED' },
    });

    await createNotification(
      meeting.workspace.student.user.id,
      'MEETING_LOG_ADDED',
      'Meeting Log Added',
      `Your supervisor has added a log for the meeting on ${meeting.date.toLocaleDateString()}. Action items: ${actionItems}`,
      { meetingId, logId: log.id }
    );

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};
