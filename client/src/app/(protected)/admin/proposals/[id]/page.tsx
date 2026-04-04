'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  getStatusConfig,
  formatDate,
  PROPOSAL_SECTIONS,
} from '@/lib/proposal-utils';
import {
  ArrowLeft,
  CheckCircle,
  RotateCcw,
  XCircle,
  MessageSquare,
  History,
} from 'lucide-react';
import Link from 'next/link';

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
  workspace: {
    student: { user: { name: string } };
    supervisor: { user: { name: string } };
    projectProfile: { title: string };
  };
  versions: ProposalVersion[];
}

type AdminAction = 'approve' | 'revisions' | 'reject';

export default function AdminProposalReviewPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmAction, setConfirmAction] = useState<AdminAction | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api
      .get(`/proposals/${proposalId}`)
      .then((res) => setProposal(res.data.data))
      .catch(() => toast.error('Failed to load proposal'))
      .finally(() => setLoading(false));
  }, [proposalId]);

  const handleReviewAction = async () => {
    if (!confirmAction) return;
    setProcessing(true);
    try {
      await api.post(`/proposals/${proposalId}/admin-review`, {
        action: confirmAction,
        reason: actionReason || undefined,
      });
      const messages: Record<AdminAction, string> = {
        approve: 'Proposal approved',
        revisions: 'Admin revisions requested',
        reject: 'Proposal rejected',
      };
      toast.success(messages[confirmAction]);
      setConfirmAction(null);
      setActionReason('');
      router.push('/admin/proposals');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['ADMIN']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </AuthGuard>
    );
  }

  if (!proposal) {
    return (
      <AuthGuard allowedRoles={['ADMIN']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Proposal not found</p>
        </div>
      </AuthGuard>
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

  const canReview =
    proposal.status === 'SUPERVISOR_APPROVED' ||
    proposal.status === 'ADMIN_REVISIONS_REQUESTED';

  const actionLabels: Record<AdminAction, string> = {
    approve: 'Final Approve',
    revisions: 'Request Admin Revisions',
    reject: 'Reject Proposal',
  };

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div>
          <Link href="/admin/proposals">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Queue
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight font-mono">
              {latestVersion.title}
            </h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {proposal.workspace.student.user.name} &middot; Supervisor:{' '}
            {proposal.workspace.supervisor.user.name} &middot; Version{' '}
            {latestVersion.versionNumber}
          </p>
          <Separator className="mt-2" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
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
                    <p className="text-sm whitespace-pre-wrap">
                      {value || '—'}
                    </p>
                    {sectionComments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Supervisor Comments ({sectionComments.length})
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
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                {proposal.versions
                  .slice()
                  .reverse()
                  .map((version) => {
                    return (
                      <div key={version.id} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            v{version.versionNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(version.createdAt)}
                          </p>
                        </div>
                        {version.changeSummary && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {version.changeSummary}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            {canReview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Actions</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => setConfirmAction('approve')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Final Approve
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setConfirmAction('revisions')}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Request Admin Revisions
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => setConfirmAction('reject')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setActionReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction && actionLabels[confirmAction]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {confirmAction === 'approve' &&
                'This will give final approval to the proposal. The student can proceed with their project.'}
              {confirmAction === 'revisions' &&
                'The student will be asked to make additional revisions.'}
              {confirmAction === 'reject' &&
                'This will permanently reject the proposal.'}
            </p>
            {(confirmAction === 'revisions' || confirmAction === 'reject') && (
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Provide a reason..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleReviewAction}
              disabled={processing}
              variant={confirmAction === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
