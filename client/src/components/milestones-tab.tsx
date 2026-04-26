'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface Submission {
  id: string;
  fileUrl?: string;
  repoLink?: string;
  notes?: string;
  submittedAt: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  submission?: Submission;
  feedback?: string;
}

interface MilestonesTabProps {
  workspaceId: string;
  milestones: Milestone[];
  onRefresh?: () => void;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'ACCEPTED':
      return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    case 'SUBMITTED':
      return <Clock className="h-5 w-5 text-sky-400" />;
    case 'OVERDUE':
      return <AlertTriangle className="h-5 w-5 text-red-400" />;
    case 'NEEDS_CHANGES':
      return <RefreshCw className="h-5 w-5 text-amber-400" />;
    default:
      return <Upload className="h-5 w-5 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACCEPTED':
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Accepted</Badge>;
    case 'NEEDS_CHANGES':
      return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Needs Changes</Badge>;
    case 'SUBMITTED':
      return <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20">Submitted</Badge>;
    case 'OVERDUE':
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge variant="outline">Not Submitted</Badge>;
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MilestonesTab({
  workspaceId,
  milestones,
  onRefresh,
}: MilestonesTabProps) {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [repoLink, setRepoLink] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openSubmitDialog = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setFile(null);
    setRepoLink('');
    setNotes('');
    setSubmitDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedMilestone) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (repoLink) formData.append('repoLink', repoLink);
      if (notes) formData.append('notes', notes);

      await api.post(`/milestones/${selectedMilestone.id}/submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Deliverable submitted successfully');
      setSubmitDialogOpen(false);
      onRefresh?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to submit deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">No milestones yet</p>
          <p className="text-muted-foreground mt-1">
            Milestones will appear here once your project is set up.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Project Milestones</h2>

      <div className="space-y-4">
        {milestones.map((milestone) => (
          <Card key={milestone.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(milestone.status)}
                  <div>
                    <CardTitle className="text-base">{milestone.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {milestone.description}
                    </p>
                  </div>
                </div>
                {getStatusBadge(milestone.status)}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium">{formatDate(milestone.dueDate)}</span>
              </div>

              {milestone.submission && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{formatDate(milestone.submission.submittedAt)}</span>
                  </div>

                  {milestone.feedback && (
                    <div className="rounded border p-3 bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Feedback
                      </p>
                      <p className="text-sm">{milestone.feedback}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {milestone.status === 'NEEDS_CHANGES' && (
                      <Button
                        size="sm"
                        onClick={() => openSubmitDialog(milestone)}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Resubmit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (milestone.submission?.fileUrl) {
                          window.open(milestone.submission.fileUrl, '_blank');
                        }
                      }}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View Submission
                    </Button>
                  </div>
                </>
              )}

              {!milestone.submission && milestone.status !== 'ACCEPTED' && (
                <Button size="sm" onClick={() => openSubmitDialog(milestone)}>
                  <Upload className="mr-1 h-3 w-3" />
                  Submit Deliverable
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-xs font-medium text-muted-foreground mb-3">STATUS LABELS</p>
          <div className="flex flex-wrap gap-2">
            <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Accepted</Badge>
            <Badge className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">Needs Changes</Badge>
            <Badge className="text-xs bg-sky-500/10 text-sky-400 border-sky-500/20">Submitted</Badge>
            <Badge variant="outline" className="text-xs">Not Submitted</Badge>
            <Badge variant="destructive" className="text-xs">Overdue</Badge>
          </div>
        </CardContent>
      </Card>

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Deliverable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMilestone && (
              <p className="text-sm text-muted-foreground">
                Submitting for: <span className="font-medium text-foreground">{selectedMilestone.title}</span>
              </p>
            )}
            <div className="space-y-2">
              <Label>File Upload</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Repository Link</Label>
              <Input
                placeholder="https://github.com/..."
                value={repoLink}
                onChange={(e) => setRepoLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any additional notes about your submission..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Deliverable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
