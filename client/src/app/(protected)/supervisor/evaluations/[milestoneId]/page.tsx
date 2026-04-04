'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import AuthGuard from '@/components/auth-guard';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';

interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxScore: number;
  section: string;
}

interface RubricSection {
  name: string;
  criteria: RubricCriterion[];
}

export default function SupervisorEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const milestoneId = params.milestoneId as string;

  const [sections, setSections] = useState<RubricSection[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/admin/rubrics')
      .then((res) => {
        const criteria: RubricCriterion[] = res.data.data || [];
        const grouped: Record<string, RubricCriterion[]> = {};
        criteria.forEach((c) => {
          if (!grouped[c.section]) grouped[c.section] = [];
          grouped[c.section].push(c);
        });
        setSections(
          Object.entries(grouped).map(([name, items]) => ({
            name,
            criteria: items,
          }))
        );
      })
      .catch(() => toast.error('Failed to load rubric'))
      .finally(() => setLoading(false));
  }, []);

  const sectionTotals = useMemo(() => {
    const totals: Record<string, { score: number; max: number }> = {};
    sections.forEach((section) => {
      let score = 0;
      let max = 0;
      section.criteria.forEach((c) => {
        score += scores[c.id] || 0;
        max += c.maxScore;
      });
      totals[section.name] = { score, max };
    });
    return totals;
  }, [sections, scores]);

  const grandTotal = useMemo(() => {
    let score = 0;
    let max = 0;
    Object.values(sectionTotals).forEach((t) => {
      score += t.score;
      max += t.max;
    });
    return { score, max };
  }, [sectionTotals]);

  const handleScoreChange = (criterionId: string, value: string, maxScore: number) => {
    const num = parseInt(value) || 0;
    setScores((prev) => ({
      ...prev,
      [criterionId]: Math.min(Math.max(num, 0), maxScore),
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const evaluations = sections.flatMap((section) =>
        section.criteria.map((c) => ({
          criterionId: c.id,
          score: scores[c.id] || 0,
          comment: comments[c.id] || '',
        }))
      );

      await api.post(`/milestones/${milestoneId}/evaluate`, {
        evaluations,
        overallFeedback,
      });
      toast.success('Evaluation submitted successfully');
      router.push('/supervisor/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['SUPERVISOR']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading evaluation form...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['SUPERVISOR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Project Evaluation</h1>
          <p className="text-muted-foreground mt-1">
            Score each criterion and provide feedback.
          </p>
          <Separator className="mt-2" />
        </div>

        {sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No rubric available</p>
              <p className="text-muted-foreground mt-1">
                The evaluation rubric has not been configured yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {sections.map((section) => (
              <Card key={section.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{section.name}</CardTitle>
                    <span className="text-sm font-medium">
                      {sectionTotals[section.name]?.score || 0}/
                      {sectionTotals[section.name]?.max || 0}
                    </span>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-6">
                  {section.criteria.map((criterion) => (
                    <div key={criterion.id} className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">{criterion.title}</p>
                        {criterion.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {criterion.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          Score (max {criterion.maxScore})
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={criterion.maxScore}
                          value={scores[criterion.id] ?? ''}
                          onChange={(e) =>
                            handleScoreChange(criterion.id, e.target.value, criterion.maxScore)
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Comment</Label>
                        <Textarea
                          placeholder="Feedback for this criterion..."
                          value={comments[criterion.id] || ''}
                          onChange={(e) =>
                            setComments((prev) => ({
                              ...prev,
                              [criterion.id]: e.target.value,
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <Separator />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Total Score</CardTitle>
                  <span className="text-2xl font-bold font-mono">
                    {grandTotal.score}/{grandTotal.max}
                  </span>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Overall Feedback</Label>
                  <Textarea
                    placeholder="Provide overall feedback for the student..."
                    value={overallFeedback}
                    onChange={(e) => setOverallFeedback(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
