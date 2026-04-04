'use client';

import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, Eye, CheckCircle, Clock, Send } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface DashboardRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'INFO_REQUESTED' | 'WITHDRAWN' | 'EXPIRED';
  supervisor: {
    id: string;
    user: { id: string; name: string };
  };
  projectProfile: {
    id: string;
    title: string;
  };
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
  INFO_REQUESTED: 'outline',
  WITHDRAWN: 'secondary',
  EXPIRED: 'secondary',
};

export default function StudentDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<DashboardRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    api
      .get('/notifications')
      .then((res) => {
        setNotifications(res.data.data.notifications.slice(0, 5));
      })
      .catch(() => {});

    api
      .get('/requests/student')
      .then((res) => {
        setRequests(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingRequests(false));
  }, []);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const acceptedRequest = requests.find((r) => r.status === 'ACCEPTED');
  const activeRequests = requests.filter(
    (r) => r.status === 'PENDING' || r.status === 'INFO_REQUESTED'
  );
  const activeCount = activeRequests.length + (acceptedRequest ? 1 : 0);

  const supervisorStatus = acceptedRequest
    ? acceptedRequest.supervisor.user.name
    : activeRequests.length > 0
      ? 'Pending'
      : 'Not Assigned';

  const pendingRequests = requests.filter(
    (r) => r.status !== 'WITHDRAWN' && r.status !== 'EXPIRED'
  );

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Student Dashboard
          </h1>
          <Separator className="mt-2" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span>Supervisor Status:</span>
                  {acceptedRequest ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {supervisorStatus}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      {activeRequests.length > 0 ? (
                        <Clock className="h-3 w-3" />
                      ) : null}
                      {supervisorStatus}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Requests:</span>
                  <Badge variant="secondary">
                    {activeCount} of 3 used
                  </Badge>
                </div>
                {acceptedRequest && (
                  <div className="pt-2">
                    <Link href="/workspace">
                      <Button variant="outline" size="sm" className="w-full">
                        Go to Project Workspace
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Start New Project</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <p className="text-muted-foreground mb-4">
                  Begin your final year project by filling out your project
                  interests and finding a suitable supervisor.
                </p>
                <Link href="/projects/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Project
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Requests</CardTitle>
                {pendingRequests.length > 0 && (
                  <Link href="/requests">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                {loadingRequests ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : pendingRequests.length === 0 ? (
                  <p className="text-muted-foreground">
                    No pending requests yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 5).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between border rounded p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {req.supervisor.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {req.projectProfile.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={STATUS_VARIANTS[req.status] || 'secondary'}>
                            {req.status === 'INFO_REQUESTED'
                              ? 'Info Requested'
                              : req.status.charAt(0) +
                                req.status.slice(1).toLowerCase()}
                          </Badge>
                          <Link href="/requests">
                            <Button variant="ghost" size="icon-sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="border rounded p-3">
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
