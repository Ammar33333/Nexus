export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVISIONS_REQUESTED'
  | 'SUPERVISOR_APPROVED'
  | 'ADMIN_REVISIONS_REQUESTED'
  | 'ADMIN_APPROVED'
  | 'REJECTED';

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

const STATUS_MAP: Record<ProposalStatus, StatusConfig> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  SUBMITTED: { label: 'Submitted', variant: 'default' },
  REVISIONS_REQUESTED: { label: 'Revisions Requested', variant: 'destructive' },
  SUPERVISOR_APPROVED: { label: 'Supervisor Approved', variant: 'secondary' },
  ADMIN_REVISIONS_REQUESTED: { label: 'Admin Revisions', variant: 'destructive' },
  ADMIN_APPROVED: { label: 'Approved', variant: 'secondary' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
};

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_MAP[status as ProposalStatus] || { label: status, variant: 'outline' };
}

export const PROPOSAL_SECTIONS = [
  { key: 'title', label: 'Title' },
  { key: 'abstract', label: 'Abstract' },
  { key: 'problemStatement', label: 'Problem Statement' },
  { key: 'objectives', label: 'Objectives' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'techStack', label: 'Tools / Tech Stack' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'references', label: 'References' },
] as const;

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
