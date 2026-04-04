'use client';

import { useEffect, useState } from 'react';
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
  CheckCircle,
  XCircle,
  MessageSquare,
  Inbox,
} from 'lucide-react';

interface SupervisorRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'INFO_REQUESTED' | 'WITHDRAWN' | 'EXPIRED';
  message: string;
  createdAt: string;
  student: {
    id: string;
    program: string;
    user: { id: string; name: string; email: string };
  };
  projectProfile: {
    id: string;
    title: string;
    domain: string;
    skills: string[];
    description: string;
  };
  matchScore?: number;
  messages: Array<{
    id: string;
    senderId: string;
    message: string;
    createdAt: string;
  }>;
}

type DialogMode = 'reject' | 'info' | null;

export default function SupervisorRequestsPage() {
  const [requests, setRequests] = useState<SupervisorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedRequest, setSelectedRequest] = useState<SupervisorRequest | null>(null);
  const [dialogMessage, setDialogMessage] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests/supervisor');
      setRequests(data.data || []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await api.put(`/requests/${requestId}/respond`, { action: 'ACCEPT' });
      toast.success('Request accepted');
      fetchRequests();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setProcessing(null);
    }
  };

  const openDialog = (request: SupervisorRequest, mode: DialogMode) => {
    setSelectedRequest(request);
    setDialogMode(mode);
    setDialogMessage('');
  };

  const handleDialogSubmit = async () => {
    if (!selectedRequest || !dialogMode) return;

    const action = dialogMode === 'reject' ? 'REJECT' : 'REQUEST_INFO';

    setProcessing(selectedRequest.id);
    try {
      await api.put(`/requests/${selectedRequest.id}/respond`, {
        action,
        reason: dialogMessage || undefined,
      });
      toast.success(
        dialogMode === 'reject'
          ? 'Request rejected'
          : 'Information requested from student'
      );
      setDialogMode(null);
      fetchRequests();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const pendingRequests = requests.filter((r) => r.status === 'PENDING' || r.status === 'INFO_REQUESTED');
  const pastRequests = requests.filter((r) => r.status !== 'PENDING' && r.status !== 'INFO_REQUESTED');

  if (loading) {
    return (
      <AuthGuard allowedRoles={['SUPERVISOR']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['SUPERVISOR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Supervision Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and respond to student supervision requests.
          </p>
          <Separator className="mt-2" />
        </div>

        {pendingRequests.length === 0 && pastRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No requests yet</p>
              <p className="text-muted-foreground mt-1">
                When students request your supervision, they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                  Pending ({pendingRequests.length})
                </h2>
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.student.user.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {request.student.program}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {request.matchScore !== undefined && (
                              <Badge variant="outline">
                                {Math.round(request.matchScore)}% match
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {request.status === 'INFO_REQUESTED'
                                ? 'Info Requested'
                                : 'Pending'}
                            </Badge>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Project
                          </p>
                          <p className="font-medium">
                            {request.projectProfile.title}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline">
                              {request.projectProfile.domain}
                            </Badge>
                            {request.projectProfile.skills.map((skill) => (
                              <Badge key={skill} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Student&apos;s Message
                          </p>
                          <p className="text-sm bg-muted/30 rounded p-3 border">
                            {request.message}
                          </p>
                        </div>

                        {request.messages.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Conversation
                            </p>
                            <div className="space-y-2">
                              {request.messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className="text-sm bg-muted/20 rounded p-2 border"
                                >
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {msg.senderId === request.student.user.id
                                      ? request.student.user.name
                                      : 'You'}{' '}
                                    &middot;{' '}
                                    {formatDate(msg.createdAt)}
                                  </p>
                                  <p>{msg.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Received {formatDate(request.createdAt)}
                        </p>

                        <Separator />

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(request, 'info')}
                            disabled={processing === request.id}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Request Info
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(request, 'reject')}
                            disabled={processing === request.id}
                            className="text-destructive hover:text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(request.id)}
                            disabled={processing === request.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {processing === request.id
                              ? 'Processing...'
                              : 'Accept'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {pastRequests.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground">
                  Past Requests ({pastRequests.length})
                </h2>
                {pastRequests.map((request) => (
                  <Card key={request.id} className="opacity-75">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {request.student.user.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.projectProfile.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(request.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'ACCEPTED'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        <Dialog
          open={dialogMode !== null}
          onOpenChange={(open) => {
            if (!open) setDialogMode(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'reject'
                  ? 'Reject Request'
                  : 'Request More Information'}
              </DialogTitle>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="rounded border p-3 bg-muted/30">
                  <p className="text-sm">
                    <span className="font-medium">Student:</span>{' '}
                    {selectedRequest.student.user.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Project:</span>{' '}
                    {selectedRequest.projectProfile.title}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    {dialogMode === 'reject'
                      ? 'Reason for Rejection (optional)'
                      : 'What information do you need?'}
                  </Label>
                  <Textarea
                    placeholder={
                      dialogMode === 'reject'
                        ? 'Provide a brief reason...'
                        : 'Ask the student for more details...'
                    }
                    value={dialogMessage}
                    onChange={(e) => setDialogMessage(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                onClick={handleDialogSubmit}
                disabled={
                  processing !== null ||
                  (dialogMode === 'info' && !dialogMessage.trim())
                }
                variant={dialogMode === 'reject' ? 'destructive' : 'default'}
              >
                {processing
                  ? 'Processing...'
                  : dialogMode === 'reject'
                    ? 'Reject Request'
                    : 'Send Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
