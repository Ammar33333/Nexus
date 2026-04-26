'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Users, BookOpen, FolderOpen, FileText, Lock, Download } from 'lucide-react';

interface DashboardData {
  totalStudents: number;
  totalSupervisors: number;
  activeProjects: number;
  pendingProposals: number;
  projectProgress: {
    onTrack: number;
    atRisk: number;
    overdue: number;
  };
  supervisorWorkload: {
    supervisorId: string;
    name: string;
    workspaceCount: number;
    availableSlots: number;
  }[];
  evaluationCompletion: {
    completed: number;
    total: number;
  };
  gradeDistribution: Record<string, number> | { range: string; count: number }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockingGrades, setLockingGrades] = useState(false);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleLockGrades = async () => {
    setLockingGrades(true);
    try {
      await api.post('/admin/grades/lock');
      toast.success('Grades locked successfully');
    } catch {
      toast.error('Failed to lock grades');
    } finally {
      setLockingGrades(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await api.get('/admin/reports/generate', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project-report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report generated');
    } catch {
      toast.error('Failed to generate report');
    }
  };

  const stats = {
    totalStudents: data?.totalStudents ?? 0,
    totalSupervisors: data?.totalSupervisors ?? 0,
    activeProjects: data?.activeProjects ?? 0,
    pendingProposals: data?.pendingProposals ?? 0,
    projectProgress: data?.projectProgress ?? { onTrack: 0, atRisk: 0, overdue: 0 },
    supervisorWorkload: Array.isArray(data?.supervisorWorkload) ? data.supervisorWorkload : [],
    evaluationCompletion: data?.evaluationCompletion ?? { completed: 0, total: 0 },
    gradeDistribution: (() => {
      const gd = data?.gradeDistribution;
      if (Array.isArray(gd)) return gd;
      if (gd && typeof gd === 'object') {
        return Object.entries(gd).map(([range, count]) => ({ range, count: count as number }));
      }
      return [];
    })(),
  };

  const maxGradeCount = Math.max(...stats.gradeDistribution.map((g) => g.count), 1);

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Administration</p>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <Separator className="mt-3" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLockGrades}
              disabled={lockingGrades}
            >
              <Lock className="mr-1 h-3 w-3" />
              {lockingGrades ? 'Locking...' : 'Lock Grades'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateReport}>
              <Download className="mr-1 h-3 w-3" />
              Generate Report
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" /> Total Students
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold tabular-nums">{stats.totalStudents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4" /> Total Supervisors
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold tabular-nums">{stats.totalSupervisors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4" /> Active Projects
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold tabular-nums">{stats.activeProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" /> Pending Proposals
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold tabular-nums">{stats.pendingProposals}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">On Track</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {stats.projectProgress.onTrack}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">At Risk</span>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                      {stats.projectProgress.atRisk}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overdue</span>
                    <Badge variant="destructive">
                      {stats.projectProgress.overdue}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluation Completion</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-4xl font-bold tabular-nums">
                      {stats.evaluationCompletion.completed}
                      <span className="text-lg text-muted-foreground">
                        /{stats.evaluationCompletion.total}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Milestones evaluated</p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{
                        width: `${stats.evaluationCompletion.total > 0 ? Math.round((stats.evaluationCompletion.completed / stats.evaluationCompletion.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {stats.supervisorWorkload.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Supervisor Workload</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Current Students</TableHead>
                    <TableHead>Available Slots</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.supervisorWorkload.map((supervisor) => (
                    <TableRow key={supervisor.supervisorId}>
                      <TableCell className="font-medium">{supervisor.name}</TableCell>
                      <TableCell>{supervisor.workspaceCount}</TableCell>
                      <TableCell>
                        <Badge variant={supervisor.availableSlots > 0 ? 'secondary' : 'outline'}>
                          {supervisor.availableSlots}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {stats.gradeDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <div className="flex items-end gap-2 h-40">
                {stats.gradeDistribution.map((grade) => (
                  <div key={grade.range} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium tabular-nums">{grade.count}</span>
                    <div
                      className="w-full bg-gradient-to-t from-primary to-emerald-400 rounded-t"
                      style={{
                        height: `${Math.max((grade.count / maxGradeCount) * 100, 4)}%`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{grade.range}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
}
