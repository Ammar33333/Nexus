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
import { useAuthStore } from '@/lib/store';
import { Clock, CheckCircle, XCircle, MessageSquare, AlertCircle, Send } from 'lucide-react';
import Link from 'next/link';

interface RequestMessage {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
}

interface StudentRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'INFO_REQUESTED' | 'WITHDRAWN' | 'EXPIRED';
  message: string;
  rejectionReason?: string;
  createdAt: string;
  supervisor: {
    id: string;
    department: string;
    user: { id: string; name: string; email: string };
  };
  projectProfile: {
    id: string;
    title: string;
    domain: string;
    skills: string[];
  };
  messages: RequestMessage[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  PENDING: { label: 'Pending', icon: <Clock className="h-3 w-3" />, variant: 'secondary' },
  ACCEPTED: { label: 'Accepted', icon: <CheckCircle className="h-3 w-3" />, variant: 'default' },
  REJECTED: { label: 'Rejected', icon: <XCircle className="h-3 w-3" />, variant: 'destructive' },
  INFO_REQUESTED: { label: 'Info Requested', icon: <MessageSquare className="h-3 w-3" />, variant: 'outline' },
  WITHDRAWN: { label: 'Withdrawn', icon: <AlertCircle className="h-3 w-3" />, variant: 'secondary' },
  EXPIRED: { label: 'Expired', icon: <Clock className="h-3 w-3" />, variant: 'secondary' },
};

export default function StudentRequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyRequest, setReplyRequest] = useState<StudentRequest | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests/student');
      setRequests(data.data || []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const countByStatus = (status: string) =>
    requests.filter((r) => r.status === status).length;

  const openReplyDialog = (request: StudentRequest) => {
    setReplyRequest(request);
    setReplyMessage('');
    setReplyDialogOpen(true);
  };

  const handleReply = async () => {
    if (!replyRequest || !replyMessage.trim()) return;

    setSending(true);
    try {
      await api.post(`/requests/${replyRequest.id}/messages`, {
        message: replyMessage,
      });
      toast.success('Reply sent successfully');
      setReplyDialogOpen(false);
      fetchRequests();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getLastSupervisorMessage = (request: StudentRequest) => {
    const supervisorMessages = request.messages.filter(
      (m) => m.senderId !== user?.id
    );
    return supervisorMessages[supervisorMessages.length - 1];
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['STUDENT']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Supervisor Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Track the status of your supervision requests.
          </p>
          <Separator className="mt-2" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'] as const).map(
            (status) => {
              const config = STATUS_CONFIG[status];
              return (
                <Card key={status}>
                  <CardContent className="py-3 px-4 text-center">
                    <p className="text-2xl font-bold">{countByStatus(status)}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Send className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No requests yet</p>
              <p className="text-muted-foreground mt-1">
                Start a project and request a supervisor to get going.
              </p>
              <Link href="/projects/new" className="inline-block mt-4">
                <Button>Start New Project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const config = STATUS_CONFIG[request.status];
              const lastMessage = getLastSupervisorMessage(request);

              return (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            {request.supervisor.user.name}
                          </h3>
                          <Badge variant={config.variant} className="gap-1">
                            {config.icon}
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.projectProfile.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sent {formatDate(request.createdAt)}
                        </p>

                        {request.status === 'REJECTED' &&
                          request.rejectionReason && (
                            <div className="mt-2 rounded border border-destructive/20 bg-destructive/5 p-3">
                              <p className="text-sm">
                                <span className="font-medium">Reason:</span>{' '}
                                {request.rejectionReason}
                              </p>
                            </div>
                          )}

                        {request.status === 'INFO_REQUESTED' && lastMessage && (
                          <div className="mt-2 rounded border p-3 bg-muted/30">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Supervisor&apos;s message:
                            </p>
                            <p className="text-sm">{lastMessage.message}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 sm:flex-col sm:items-end">
                        {request.status === 'INFO_REQUESTED' && (
                          <Button
                            size="sm"
                            onClick={() => openReplyDialog(request)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Reply
                          </Button>
                        )}
                        {request.status === 'ACCEPTED' && (
                          <Link href={`/workspace`}>
                            <Button size="sm">Go to Workspace</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Reply to {replyRequest?.supervisor.user.name}
              </DialogTitle>
            </DialogHeader>

            {replyRequest && (
              <div className="space-y-4">
                {(() => {
                  const lastMsg = getLastSupervisorMessage(replyRequest);
                  return lastMsg ? (
                    <div className="rounded border p-3 bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Supervisor&apos;s message:
                      </p>
                      <p className="text-sm">{lastMsg.message}</p>
                    </div>
                  ) : null;
                })()}

                <div className="space-y-2">
                  <Label>Your Reply</Label>
                  <Textarea
                    placeholder="Type your response..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
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
                onClick={handleReply}
                disabled={sending || !replyMessage.trim()}
              >
                {sending ? 'Sending...' : 'Send Reply'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
