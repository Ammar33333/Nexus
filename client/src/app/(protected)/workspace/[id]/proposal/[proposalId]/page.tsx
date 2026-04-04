'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getStatusConfig, formatDate, PROPOSAL_SECTIONS } from '@/lib/proposal-utils';
import { ArrowLeft, MessageSquare } from 'lucide-react';

interface ProposalComment {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
  versions: ProposalVersion[];
}

export default function ViewProposalPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const proposalId = params.proposalId as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/proposals/${proposalId}`)
      .then((res) => setProposal(res.data.data))
      .catch(() => toast.error('Failed to load proposal'))
      .finally(() => setLoading(false));
  }, [proposalId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading proposal...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Proposal not found</p>
      </div>
    );
  }

  const latestVersion = proposal.versions[proposal.versions.length - 1];
  const statusConfig = getStatusConfig(proposal.status);
  const commentsBySection = latestVersion.comments.reduce(
    (acc, c) => {
      if (!acc[c.section]) acc[c.section] = [];
      acc[c.section].push(c);
      return acc;
    },
    {} as Record<string, ProposalComment[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/workspace/${workspaceId}`}>
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Workspace
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            {latestVersion.title}
          </h1>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          Version {latestVersion.versionNumber} &middot;{' '}
          {formatDate(latestVersion.createdAt)}
        </p>
        <Separator className="mt-2" />
      </div>

      {PROPOSAL_SECTIONS.map(({ key, label }) => {
        const value = latestVersion[key as keyof ProposalVersion] as string;
        const sectionComments = commentsBySection[key] || [];
        if (key === 'title') return null;

        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-sm whitespace-pre-wrap">{value || '—'}</p>
              {sectionComments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Comments
                  </p>
                  {sectionComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border rounded p-3 bg-muted/30"
                    >
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {latestVersion.changeSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Summary</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <p className="text-sm">{latestVersion.changeSummary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
