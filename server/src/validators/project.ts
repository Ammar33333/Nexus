import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  domain: z.string().min(1, 'Domain is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  supervisionStyle: z.enum(['WEEKLY', 'BIWEEKLY', 'FLEXIBLE'], {
    errorMap: () => ({ message: 'Supervision style must be WEEKLY, BIWEEKLY, or FLEXIBLE' }),
  }),
});

export const sendRequestSchema = z.object({
  projectProfileId: z.string().min(1, 'Project profile ID is required'),
  supervisorId: z.string().min(1, 'Supervisor ID is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const respondRequestSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT', 'REQUEST_INFO'], {
    errorMap: () => ({ message: 'Action must be ACCEPT, REJECT, or REQUEST_INFO' }),
  }),
  reason: z.string().optional(),
});

export const requestMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});
