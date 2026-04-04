'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    api.get('/notifications').then((res) => {
      setNotifications(res.data.data.notifications);
    }).catch(() => {});
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-mono">Notifications</h1>
        <Button variant="outline" onClick={markAllRead}>Mark all as read</Button>
      </div>
      <Separator />
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-muted-foreground">No notifications</p>
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer ${!n.read ? 'border-black' : ''}`}
              onClick={() => !n.read && markRead(n.id)}
            >
              <CardContent className="flex items-start justify-between py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.read && <Badge>New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
