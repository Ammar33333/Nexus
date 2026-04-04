import { z } from 'zod';

export const createProposalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  abstract: z.string().min(20, 'Abstract must be at least 20 characters'),
  problemStatement: z.string().min(20, 'Problem statement must be at least 20 characters'),
  objectives: z.string().min(10, 'Objectives must be at least 10 characters'),
  methodology: z.string().min(10, 'Methodology must be at least 10 characters'),
  techStack: z.string().min(3, 'Tech stack must be at least 3 characters'),
  timeline: z.string().min(10, 'Timeline must be at least 10 characters'),
  references: z.string().min(3, 'References must be at least 3 characters'),
});

export const updateProposalSchema = z.object({
  title: z.string().min(3).optional(),
  abstract: z.string().min(20).optional(),
  problemStatement: z.string().min(20).optional(),
  objectives: z.string().min(10).optional(),
  methodology: z.string().min(10).optional(),
  techStack: z.string().min(3).optional(),
  timeline: z.string().min(10).optional(),
  references: z.string().min(3).optional(),
});

export const submitProposalSchema = z.object({
  changeSummary: z.string().min(5, 'Change summary must be at least 5 characters').optional(),
});

export const reviewProposalSchema = z.object({
  action: z.enum(['APPROVE', 'REQUEST_REVISIONS', 'REJECT'], {
    errorMap: () => ({ message: 'Action must be APPROVE, REQUEST_REVISIONS, or REJECT' }),
  }),
  feedback: z.string().optional(),
  deadline: z.string().optional(),
});

export const adminReviewProposalSchema = z.object({
  action: z.enum(['APPROVE', 'REQUEST_REVISIONS', 'REJECT'], {
    errorMap: () => ({ message: 'Action must be APPROVE, REQUEST_REVISIONS, or REJECT' }),
  }),
  feedback: z.string().optional(),
});

export const proposalCommentSchema = z.object({
  section: z.string().min(1, 'Section is required'),
  content: z.string().min(1, 'Content is required'),
});
