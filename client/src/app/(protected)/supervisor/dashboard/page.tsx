'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Send, ClipboardList, Users, FolderOpen, ArrowRight } from 'lucide-react';

interface StudentWorkspace {
  id: string;
  student: { user: { name: string; email: string } };
  projectProfile: { title: string; domain: string };
}

interface DashboardData {
  pendingRequests: number;
  currentStudents: number;
  availableSlots: number;
  workspaces: StudentWorkspace[];
}

export default function SupervisorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/supervisor/dashboard')
      .then((res) => setData(res.data.data))
      .catch(() => {
        setData({
          pendingRequests: 0,
          currentStudents: 0,
          availableSlots: 5,
          workspaces: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = data || {
    pendingRequests: 0,
    currentStudents: 0,
    availableSlots: 5,
    workspaces: [],
  };

  return (
    <AuthGuard allowedRoles={['SUPERVISOR']}>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight">Supervisor Dashboard</h1>
          <Separator className="mt-3" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Send className="h-4 w-4" /> Pending Requests
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold tabular-nums">{stats.pendingRequests}</p>
              <p className="text-muted-foreground text-sm">Awaiting your response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" /> Current Students
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold tabular-nums">{stats.currentStudents}</p>
              <p className="text-muted-foreground text-sm">Active supervisees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4" /> Available Slots
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold tabular-nums">{stats.availableSlots}</p>
              <p className="text-muted-foreground text-sm">Open for new students</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Link href="/supervisor/requests">
            <Button variant="outline" size="sm">
              <Send className="mr-1 h-3 w-3" />
              Pending Requests
            </Button>
          </Link>
          <Link href="/supervisor/proposals">
            <Button variant="outline" size="sm">
              <ClipboardList className="mr-1 h-3 w-3" />
              Proposals to Review
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Students</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : stats.workspaces.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No active students yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="flex items-center justify-between border border-border/50 rounded-lg p-3 transition-all duration-200 hover:border-primary/20 hover:shadow-lg hover:shadow-black/10"
                  >
                    <div>
                      <p className="text-sm font-medium">{ws.student.user.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ws.projectProfile.title}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {ws.projectProfile.domain}
                      </Badge>
                    </div>
                    <Link href={`/workspace/${ws.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
