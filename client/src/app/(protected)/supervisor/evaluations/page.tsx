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
import { Star, ArrowRight } from 'lucide-react';

interface MilestoneEval {
  id: string;
  title: string;
  workspace: {
    id: string;
    student: { user: { name: string } };
    projectProfile: { title: string };
  };
  status: string;
  evaluated: boolean;
}

export default function SupervisorEvaluationsPage() {
  const [milestones, setMilestones] = useState<MilestoneEval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/supervisor/evaluations')
      .then((res) => setMilestones(res.data.data || []))
      .catch(() => toast.error('Failed to load evaluations'))
      .finally(() => setLoading(false));
  }, []);

  const pending = milestones.filter((m) => !m.evaluated);
  const completed = milestones.filter((m) => m.evaluated);

  if (loading) {
    return (
      <AuthGuard allowedRoles={['SUPERVISOR']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading evaluations...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['SUPERVISOR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Evaluations</h1>
          <Separator className="mt-2" />
        </div>

        {milestones.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No evaluations</p>
              <p className="text-muted-foreground mt-1">
                Milestone evaluations will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pending Evaluation
                </p>
                {pending.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{milestone.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {milestone.workspace.student.user.name} &mdash;{' '}
                            {milestone.workspace.projectProfile.title}
                          </p>
                        </div>
                        <Link href={`/supervisor/evaluations/${milestone.id}`}>
                          <Button size="sm">
                            Evaluate
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {completed.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Completed
                </p>
                {completed.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{milestone.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {milestone.workspace.student.user.name} &mdash;{' '}
                            {milestone.workspace.projectProfile.title}
                          </p>
                        </div>
                        <Badge variant="secondary">Evaluated</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AuthGuard>
  );
}
