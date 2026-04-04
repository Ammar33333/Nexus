'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Award, CheckCircle2 } from 'lucide-react';

interface Criterion {
  id: string;
  title: string;
  maxScore: number;
  score: number;
  feedback?: string;
}

interface Section {
  name: string;
  weight: string;
  criteria: Criterion[];
  total: number;
  maxTotal: number;
}

interface Evaluation {
  id: string;
  finalScore: number;
  maxScore: number;
  overallFeedback?: string;
  evaluator: { name: string };
  evaluatedAt: string;
  sections: Section[];
  completed: boolean;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EvaluationPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/workspaces/${workspaceId}/evaluations`)
      .then((res) => setEvaluation(res.data.data))
      .catch(() => toast.error('Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading evaluation...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="space-y-6">
        <div>
          <Link href={`/workspace/${workspaceId}`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back to Workspace
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Project Evaluation</h1>
          <Separator className="mt-2" />
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No evaluation yet</p>
            <p className="text-muted-foreground mt-1">
              Your project evaluation will appear here once completed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentage = Math.round((evaluation.finalScore / evaluation.maxScore) * 100);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/workspace/${workspaceId}`}>
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Workspace
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight font-mono">Project Evaluation</h1>
        <Separator className="mt-2" />
      </div>

      {evaluation.completed && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 mb-2" />
            <p className="text-lg font-semibold">Congratulations!</p>
            <p className="text-sm text-muted-foreground">
              Your project evaluation has been completed.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Final Grade</CardTitle>
            <Badge variant="secondary">{percentage}%</Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <p className="text-6xl font-bold font-mono">
              {evaluation.finalScore}
              <span className="text-2xl text-muted-foreground">/{evaluation.maxScore}</span>
            </p>
          </div>

          <div className="space-y-2">
            {evaluation.sections.map((section) => (
              <div key={section.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {section.name} ({section.weight})
                </span>
                <span className="font-medium">
                  {section.total}/{section.maxTotal}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Evaluator</span>
            <span className="font-medium">{evaluation.evaluator.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDate(evaluation.evaluatedAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evaluation Rubric</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-6">
          {evaluation.sections.map((section) => (
            <div key={section.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {section.name}{' '}
                  <span className="text-muted-foreground font-normal">({section.weight})</span>
                </h3>
                <span className="text-sm font-medium">
                  {section.total}/{section.maxTotal}
                </span>
              </div>

              <div className="space-y-3">
                {section.criteria.map((criterion) => {
                  const pct = criterion.maxScore > 0
                    ? Math.round((criterion.score / criterion.maxScore) * 100)
                    : 0;
                  return (
                    <div key={criterion.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>{criterion.title}</span>
                        <span className="font-medium">
                          {criterion.score}/{criterion.maxScore}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-foreground transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {criterion.feedback && (
                        <p className="text-xs text-muted-foreground">{criterion.feedback}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {evaluation.overallFeedback && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Feedback</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <p className="text-sm whitespace-pre-line">{evaluation.overallFeedback}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
