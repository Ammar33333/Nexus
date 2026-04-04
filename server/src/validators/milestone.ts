import { z } from 'zod';

// ─── Milestone Templates ─────────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z.string().min(2, 'Template name must be at least 2 characters'),
  items: z
    .array(
      z.object({
        title: z.string().min(2, 'Item title must be at least 2 characters'),
        description: z.string().min(5, 'Description must be at least 5 characters'),
        orderIndex: z.number().int().min(0),
        submissionType: z.enum(['FILE', 'LINK', 'BOTH']).default('FILE'),
        daysFromStart: z.number().int().min(1, 'Days from start must be at least 1'),
      })
    )
    .min(1, 'Template must have at least one item'),
});

// ─── Milestones ──────────────────────────────────────────────────────────────

export const createMilestoneSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  submissionType: z.enum(['FILE', 'LINK', 'BOTH']).default('FILE'),
  orderIndex: z.number().int().min(0),
  rubricId: z.string().optional(),
});

export const applyTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  submissionType: z.enum(['FILE', 'LINK', 'BOTH']).optional(),
  orderIndex: z.number().int().min(0).optional(),
  rubricId: z.string().nullable().optional(),
  status: z.enum(['NOT_SUBMITTED', 'SUBMITTED', 'NEEDS_CHANGES', 'ACCEPTED', 'OVERDUE']).optional(),
});

// ─── Submissions ─────────────────────────────────────────────────────────────

export const submitDeliverableSchema = z.object({
  repoLink: z.string().url('Must be a valid URL').optional(),
  notes: z.string().optional(),
});

export const reviewSubmissionSchema = z.object({
  action: z.enum(['ACCEPTED', 'NEEDS_CHANGES'], {
    errorMap: () => ({ message: 'Action must be ACCEPTED or NEEDS_CHANGES' }),
  }),
  feedback: z.string().optional(),
});

// ─── Meetings ────────────────────────────────────────────────────────────────

export const scheduleMeetingSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  time: z.string().min(1, 'Time is required'),
  agenda: z.string().min(3, 'Agenda must be at least 3 characters'),
  mode: z.enum(['ONLINE', 'IN_PERSON']),
  meetingLink: z.string().url('Must be a valid URL').optional(),
  duration: z.number().int().positive().optional(),
});

export const updateMeetingSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  time: z.string().optional(),
  agenda: z.string().min(3).optional(),
  mode: z.enum(['ONLINE', 'IN_PERSON']).optional(),
  meetingLink: z.string().url().nullable().optional(),
  duration: z.number().int().positive().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const meetingLogSchema = z.object({
  attendance: z.array(z.string()).min(1, 'At least one attendee required'),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  actionItems: z.string().min(1, 'Action items are required'),
  nextMeetingDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
    .optional(),
});

// ─── Evaluation & Rubrics ────────────────────────────────────────────────────

export const createRubricSchema = z.object({
  name: z.string().min(2, 'Rubric name must be at least 2 characters'),
  criteria: z
    .array(
      z.object({
        title: z.string().min(2),
        description: z.string().min(5),
        maxScore: z.number().int().positive(),
        weight: z.number().positive(),
        section: z.string().min(1),
      })
    )
    .min(1, 'Rubric must have at least one criterion'),
});

export const submitEvaluationSchema = z.object({
  rubricId: z.string().min(1, 'Rubric ID is required'),
  scores: z
    .array(
      z.object({
        criterionId: z.string().min(1),
        score: z.number().min(0),
        comment: z.string().optional(),
      })
    )
    .min(1, 'At least one score is required'),
  feedback: z.string().optional(),
});

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export const lockGradesSchema = z.object({
  sessionId: z.string().optional(),
});

export const justifyGradeSchema = z.object({
  message: z.string().min(10, 'Justification request must be at least 10 characters'),
});

export const reassignSupervisorSchema = z.object({
  newSupervisorId: z.string().min(1, 'New supervisor ID is required'),
});
