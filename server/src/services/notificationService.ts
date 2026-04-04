import prisma from '../utils/prisma';
import { sendEmail } from '../utils/email';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (user) {
    await sendEmail({
      to: user.email,
      subject: title,
      html: `<p>Hi ${user.name},</p><p>${message}</p>`,
    });
  }
}
