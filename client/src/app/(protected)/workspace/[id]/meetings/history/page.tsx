'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Clock, Users } from 'lucide-react';

interface Meeting {
  id: string;
  date: string;
  time?: string;
  agenda: string;
  mode: string;
  meetingLink?: string;
  notes?: string;
  actionItems?: string;
  duration?: number;
  attendees?: { user: { name: string } }[];
  status: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MeetingHistoryPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/workspaces/${workspaceId}/meetings`)
      .then((res) => {
        const all = res.data.data || [];
        setMeetings(all.filter((m: Meeting) => m.status === 'COMPLETED' || m.status === 'PAST'));
      })
      .catch(() => toast.error('Failed to load meetings'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const totalMeetings = meetings.length;
  const thisMonth = meetings.filter((m) => {
    const d = new Date(m.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalMinutes = meetings.reduce((sum, m) => sum + (m.duration || 30), 0);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading meeting history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/workspace/${workspaceId}`}>
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Workspace
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight font-mono">Meeting History</h1>
        <Separator className="mt-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Meetings</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p className="text-3xl font-bold">{totalMeetings}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">This Month</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p className="text-3xl font-bold">{thisMonth}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Minutes</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="text-3xl font-bold">{totalMinutes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No past meetings</p>
            <p className="text-muted-foreground mt-1">
              Completed meetings will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader>
                <CardTitle className="text-base">{formatDate(meeting.date)}</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Agenda
                  </p>
                  <p className="text-sm">{meeting.agenda}</p>
                </div>

                {meeting.notes && (
                  <div className="rounded border p-3 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Notes
                    </p>
                    <p className="text-sm whitespace-pre-line">{meeting.notes}</p>
                  </div>
                )}

                {meeting.actionItems && (
                  <div className="rounded border p-3 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Action Items
                    </p>
                    <p className="text-sm whitespace-pre-line">{meeting.actionItems}</p>
                  </div>
                )}

                {meeting.attendees && meeting.attendees.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {meeting.attendees.map((a) => a.user.name).join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
