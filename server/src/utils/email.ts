import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[email] Skipping email (SMTP not configured): ${options.subject} -> ${options.to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@nexus-fyp.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[email] Sent: ${options.subject} -> ${options.to}`);
  } catch (error) {
    console.error('[email] Failed to send:', error);
  }
};
