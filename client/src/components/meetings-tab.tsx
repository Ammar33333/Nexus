'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Plus,
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  History,
} from 'lucide-react';

interface Meeting {
  id: string;
  date: string;
  time?: string;
  agenda: string;
  mode: string;
  meetingLink?: string;
  notes?: string;
  actionItems?: string;
  status: string;
}

interface MeetingsTabProps {
  workspaceId: string;
  meetings: Meeting[];
  onRefresh?: () => void;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(time: string) {
  if (!time) return '';
  try {
    const [h, m] = time.split(':');
    const d = new Date();
    d.setHours(parseInt(h), parseInt(m));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return time;
  }
}

export default function MeetingsTab({
  workspaceId,
  meetings,
  onRefresh,
}: MeetingsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [agenda, setAgenda] = useState('');
  const [mode, setMode] = useState('ONLINE');
  const [meetingLink, setMeetingLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const safeMeetings = Array.isArray(meetings) ? meetings : [];
  const upcoming = safeMeetings.filter((m) => m.status === 'UPCOMING' || m.status === 'SCHEDULED');
  const past = safeMeetings.filter((m) => m.status === 'COMPLETED' || m.status === 'PAST');

  const today = new Date().toISOString().split('T')[0];

  const handleSchedule = async () => {
    if (!date || !agenda) {
      toast.error('Please fill in the date and agenda');
      return;
    }

    const selectedDateTime = new Date(`${date}T${time || '23:59'}`);
    if (selectedDateTime <= new Date()) {
      toast.error('Meeting must be scheduled in the future');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/workspaces/${workspaceId}/meetings`, {
        date,
        time,
        agenda,
        mode,
        meetingLink: mode === 'ONLINE' ? meetingLink : undefined,
      });
      toast.success('Meeting scheduled successfully');
      setDialogOpen(false);
      setDate('');
      setTime('');
      setAgenda('');
      setMode('ONLINE');
      setMeetingLink('');
      onRefresh?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Meetings</h2>
        <div className="flex gap-2">
          <Link href={`/workspace/${workspaceId}/meetings/history`}>
            <Button variant="outline" size="sm">
              <History className="mr-1 h-3 w-3" />
              View History
            </Button>
          </Link>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No meetings scheduled</p>
            <p className="text-muted-foreground mt-1">
              Schedule your first meeting to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Upcoming Meetings
              </p>
              {upcoming.map((meeting) => (
                <Card key={meeting.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {formatDate(meeting.date)}
                            {meeting.time && (
                              <span className="text-muted-foreground font-normal">
                                {' '}at {formatTime(meeting.time)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge variant={meeting.mode === 'ONLINE' ? 'default' : 'secondary'}>
                        {meeting.mode === 'ONLINE' ? (
                          <><Video className="mr-1 h-3 w-3" /> Online</>
                        ) : (
                          <><MapPin className="mr-1 h-3 w-3" /> In-person</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm">{meeting.agenda}</p>
                    {meeting.meetingLink && (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Join Meeting
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Past Meetings
              </p>
              {past.map((meeting) => (
                <Card key={meeting.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{formatDate(meeting.date)}</p>
                    </div>
                    {meeting.notes && (
                      <div className="rounded border p-3 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Notes
                        </p>
                        <p className="text-sm">{meeting.notes}</p>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Agenda</Label>
              <Textarea
                placeholder="What will be discussed in this meeting..."
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v ?? 'ONLINE')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="IN_PERSON">In-person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === 'ONLINE' && (
              <div className="space-y-2">
                <Label>Meeting Link</Label>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleSchedule} disabled={submitting || !date || !agenda}>
              {submitting ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
