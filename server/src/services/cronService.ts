import cron from 'node-cron';
import prisma from '../utils/prisma';
import { createNotification } from './notificationService';

async function getActiveSession() {
  return prisma.academicSession.findFirst({ where: { isActive: true } });
}

async function processReminders() {
  const session = await getActiveSession();
  if (!session) return;

  const reminderCutoff = new Date();
  reminderCutoff.setDate(reminderCutoff.getDate() - session.reminderDays);

  const staleRequests = await prisma.supervisionRequest.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lte: reminderCutoff },
    },
    include: {
      supervisor: { include: { user: true } },
      student: { include: { user: true } },
      projectProfile: true,
    },
  });

  for (const req of staleRequests) {
    await createNotification(
      req.supervisor.user.id,
      'REQUEST_REMINDER',
      'Pending Supervision Request Reminder',
      `You have a pending request from ${req.student.user.name} for "${req.projectProfile.title}" that has been waiting for ${session.reminderDays}+ days.`,
      { requestId: req.id }
    );
  }

  if (staleRequests.length > 0) {
    console.log(`[cron] Sent ${staleRequests.length} reminder(s)`);
  }
}

async function processExpirations() {
  const session = await getActiveSession();
  if (!session) return;

  const expirationCutoff = new Date();
  expirationCutoff.setDate(expirationCutoff.getDate() - session.requestTimeoutDays);

  const expiredRequests = await prisma.supervisionRequest.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lte: expirationCutoff },
    },
    include: {
      supervisor: { include: { user: true } },
      student: { include: { user: true } },
      projectProfile: true,
    },
  });

  for (const req of expiredRequests) {
    await prisma.supervisionRequest.update({
      where: { id: req.id },
      data: { status: 'EXPIRED' },
    });

    await createNotification(
      req.student.user.id,
      'REQUEST_EXPIRED',
      'Supervision Request Expired',
      `Your request to ${req.supervisor.user.name} for "${req.projectProfile.title}" has expired after ${session.requestTimeoutDays} days without a response.`,
      { requestId: req.id }
    );
  }

  if (expiredRequests.length > 0) {
    console.log(`[cron] Expired ${expiredRequests.length} request(s)`);
  }
}

async function processFullSupervisors() {
  const fullSupervisors = await prisma.supervisorProfile.findMany({
    where: { availableSlots: { lte: 0 } },
  });

  for (const sup of fullSupervisors) {
    const pendingRequests = await prisma.supervisionRequest.findMany({
      where: {
        supervisorId: sup.id,
        status: 'PENDING',
      },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        projectProfile: true,
      },
    });

    for (const req of pendingRequests) {
      await prisma.supervisionRequest.update({
        where: { id: req.id },
        data: { status: 'WITHDRAWN', rejectionReason: 'Supervisor has no available slots' },
      });

      await createNotification(
        req.student.user.id,
        'REQUEST_AUTO_WITHDRAWN',
        'Request Auto-Withdrawn',
        `Your request to ${req.supervisor.user.name} for "${req.projectProfile.title}" was withdrawn because the supervisor has no available slots.`,
        { requestId: req.id }
      );
    }

    if (pendingRequests.length > 0) {
      console.log(`[cron] Auto-withdrew ${pendingRequests.length} request(s) for full supervisor ${sup.id}`);
    }
  }
}

async function processOverdueMilestones() {
  const now = new Date();

  const overdueMilestones = await prisma.milestone.findMany({
    where: {
      status: 'NOT_SUBMITTED',
      dueDate: { lt: now },
    },
    include: {
      workspace: {
        include: {
          student: { include: { user: true } },
          supervisor: { include: { user: true } },
        },
      },
    },
  });

  for (const milestone of overdueMilestones) {
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: 'OVERDUE' },
    });

    await createNotification(
      milestone.workspace.student.user.id,
      'MILESTONE_OVERDUE',
      'Milestone Overdue',
      `Your milestone "${milestone.title}" is overdue. The due date was ${milestone.dueDate.toLocaleDateString()}.`,
      { milestoneId: milestone.id }
    );

    await createNotification(
      milestone.workspace.supervisor.user.id,
      'MILESTONE_OVERDUE',
      'Student Milestone Overdue',
      `${milestone.workspace.student.user.name}'s milestone "${milestone.title}" is overdue.`,
      { milestoneId: milestone.id }
    );
  }

  if (overdueMilestones.length > 0) {
    console.log(`[cron] Flagged ${overdueMilestones.length} milestone(s) as overdue`);
  }
}

export function startCronJobs() {
  cron.schedule('0 2 * * *', async () => {
    console.log('[cron] Running daily maintenance tasks...');
    try {
      await processReminders();
      await processExpirations();
      await processFullSupervisors();
      await processOverdueMilestones();
      console.log('[cron] Daily maintenance complete');
    } catch (error) {
      console.error('[cron] Error during maintenance:', error);
    }
  });

  console.log('[cron] Scheduled daily maintenance at 2:00 AM');
}
