'use client';

import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, Eye } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function StudentDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    api.get('/notifications').then((res) => {
      setNotifications(res.data.data.notifications.slice(0, 5));
    }).catch(() => {});
  }, []);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Student Dashboard</h1>
          <Separator className="mt-2" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Project Status</CardTitle></CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span>Supervisor Status:</span>
                  <Badge variant="outline">Not Assigned</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Requests:</span>
                  <Badge variant="secondary">0 of 3 used</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Start New Project</CardTitle></CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <p className="text-muted-foreground mb-4">
                  Begin your final year project by filling out your project interests and finding a suitable supervisor.
                </p>
                <Link href="/projects/new">
                  <Button><Plus className="mr-2 h-4 w-4" />Start New Project</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <p className="text-muted-foreground">No pending requests yet.</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="border rounded p-3">
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
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
