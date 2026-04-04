'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';
import { PROPOSAL_SECTIONS, formatDate } from '@/lib/proposal-utils';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';

interface ProposalComment {
  id: string;
  section: string;
  content: string;
  createdAt: string;
}

interface ProposalVersion {
  id: string;
  versionNumber: string;
  title: string;
  abstract: string;
  problemStatement: string;
  objectives: string;
  methodology: string;
  techStack: string;
  timeline: string;
  references: string;
  changeSummary: string | null;
  createdAt: string;
  comments: ProposalComment[];
}

interface Proposal {
  id: string;
  status: string;
  versions: ProposalVersion[];
}

type FormFields = {
  title: string;
  abstract: string;
  problemStatement: string;
  objectives: string;
  methodology: string;
  techStack: string;
  timeline: string;
  references: string;
};

export default function ReviseProposalPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const proposalId = params.proposalId as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormFields>({
    title: '',
    abstract: '',
    problemStatement: '',
    objectives: '',
    methodology: '',
    techStack: '',
    timeline: '',
    references: '',
  });
  const [changeSummary, setChangeSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/proposals/${proposalId}`)
      .then((res) => {
        const data: Proposal = res.data.data;
        setProposal(data);
        const latest = data.versions[data.versions.length - 1];
        if (latest) {
          setForm({
            title: latest.title,
            abstract: latest.abstract,
            problemStatement: latest.problemStatement,
            objectives: latest.objectives,
            methodology: latest.methodology,
            techStack: latest.techStack,
            timeline: latest.timeline,
            references: latest.references,
          });
        }
      })
      .catch(() => toast.error('Failed to load proposal'))
      .finally(() => setLoading(false));
  }, [proposalId]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleResubmit = async () => {
    if (!changeSummary.trim()) {
      toast.error('Please provide a change summary');
      return;
    }
    const required = ['title', 'abstract', 'problemStatement', 'objectives', 'methodology', 'techStack', 'timeline'] as const;
    const missing = required.filter((k) => !form[k].trim());
    if (missing.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/proposals/${proposalId}/resubmit`, {
        ...form,
        changeSummary,
      });
      toast.success('Proposal resubmitted to supervisor');
      router.push(`/workspace/${workspaceId}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(
        error.response?.data?.message || 'Failed to resubmit proposal'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['STUDENT']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </AuthGuard>
    );
  }

  if (!proposal) {
    return (
      <AuthGuard allowedRoles={['STUDENT']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Proposal not found</p>
        </div>
      </AuthGuard>
    );
  }

  const latestVersion = proposal.versions[proposal.versions.length - 1];
  const commentsBySection = latestVersion?.comments.reduce(
    (acc, c) => {
      if (!acc[c.section]) acc[c.section] = [];
      acc[c.section].push(c);
      return acc;
    },
    {} as Record<string, ProposalComment[]>
  ) || {};

  const sectionsWithFeedback = new Set(Object.keys(commentsBySection));

  const fields: { key: keyof FormFields; label: string; type: 'input' | 'textarea'; rows?: number }[] = [
    { key: 'title', label: 'Title', type: 'input' },
    { key: 'abstract', label: 'Abstract', type: 'textarea', rows: 4 },
    { key: 'problemStatement', label: 'Problem Statement', type: 'textarea', rows: 4 },
    { key: 'objectives', label: 'Objectives', type: 'textarea', rows: 4 },
    { key: 'methodology', label: 'Methodology', type: 'textarea', rows: 4 },
    { key: 'techStack', label: 'Tools / Tech Stack', type: 'textarea', rows: 3 },
    { key: 'timeline', label: 'Timeline', type: 'textarea', rows: 3 },
    { key: 'references', label: 'References', type: 'textarea', rows: 3 },
  ];

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="space-y-6">
        <div>
          <Link href={`/workspace/${workspaceId}`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Workspace
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Revise Proposal
          </h1>
          <p className="text-muted-foreground mt-1">
            Address the feedback and resubmit your proposal.
          </p>
          <Separator className="mt-2" />
        </div>

        {Object.keys(commentsBySection).length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Supervisor Feedback
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              {Object.entries(commentsBySection).map(([section, comments]) => {
                const sectionLabel =
                  PROPOSAL_SECTIONS.find((s) => s.key === section)?.label ||
                  section;
                return (
                  <div key={section}>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {sectionLabel}
                    </p>
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className="border rounded p-3 bg-white text-sm"
                      >
                        <p>{c.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(c.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Proposal Details</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-6">
            {fields.map((field) => {
              const hasFeedback = sectionsWithFeedback.has(field.key);
              return (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="flex items-center gap-2">
                    {field.label}
                    {hasFeedback && (
                      <span className="text-xs text-orange-600 font-normal">
                        Has feedback
                      </span>
                    )}
                  </Label>
                  {field.type === 'input' ? (
                    <Input
                      id={field.key}
                      value={form[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className={hasFeedback ? 'border-orange-300 focus-visible:ring-orange-200' : ''}
                    />
                  ) : (
                    <Textarea
                      id={field.key}
                      value={form[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      rows={field.rows}
                      className={hasFeedback ? 'border-orange-300 focus-visible:ring-orange-200' : ''}
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Summary</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <Label htmlFor="changeSummary">
              What did you improve? (required)
            </Label>
            <Textarea
              id="changeSummary"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="Describe the changes you made in this revision..."
              rows={3}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end">
          <Button onClick={handleResubmit} disabled={submitting}>
            <Send className="mr-2 h-4 w-4" />
            {submitting ? 'Resubmitting...' : 'Resubmit to Supervisor'}
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}
