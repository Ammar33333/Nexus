'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';

interface RequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisorId: string;
  supervisorName: string;
  projectId: string;
  projectTitle: string;
  projectDomain: string;
  projectSkills: string[];
  onSuccess?: () => void;
}

export default function RequestDialog({
  open,
  onOpenChange,
  supervisorId,
  supervisorName,
  projectId,
  projectTitle,
  projectDomain,
  projectSkills,
  onSuccess,
}: RequestDialogProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (message.length < 50) {
      toast.error('Message must be at least 50 characters');
      return;
    }
    if (message.length > 300) {
      toast.error('Message must not exceed 300 characters');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/requests', {
        projectProfileId: projectId,
        supervisorId,
        message,
      });
      toast.success('Supervision request sent successfully');
      setMessage('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Supervision from {supervisorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Project Summary
            </p>
            <div className="rounded border p-3 space-y-2 bg-muted/30">
              <p className="text-sm font-medium">{projectTitle}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{projectDomain}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {projectSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Message to Supervisor</Label>
            <Textarea
              placeholder="Explain why you'd like this supervisor and how your project aligns with their research..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/300 characters (min 50)
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={submitting || message.length < 50}
          >
            {submitting ? 'Sending...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
