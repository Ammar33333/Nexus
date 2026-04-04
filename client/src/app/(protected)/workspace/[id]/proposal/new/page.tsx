'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';

export default function NewProposalPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [form, setForm] = useState({
    title: '',
    abstract: '',
    problemStatement: '',
    objectives: '',
    methodology: '',
    techStack: '',
    timeline: '',
    references: '',
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/workspaces/${workspaceId}/proposals`, {
        ...form,
        isDraft: true,
      });
      toast.success('Draft saved successfully');
      router.push(`/workspace/${workspaceId}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const required = ['title', 'abstract', 'problemStatement', 'objectives', 'methodology', 'techStack', 'timeline'] as const;
    const missing = required.filter((k) => !form[k].trim());
    if (missing.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/workspaces/${workspaceId}/proposals`, {
        ...form,
        isDraft: false,
      });
      toast.success('Proposal submitted to supervisor');
      router.push(`/workspace/${workspaceId}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { key: 'title', label: 'Title', type: 'input' as const },
    { key: 'abstract', label: 'Abstract', type: 'textarea' as const, rows: 4 },
    { key: 'problemStatement', label: 'Problem Statement', type: 'textarea' as const, rows: 4 },
    { key: 'objectives', label: 'Objectives', type: 'textarea' as const, rows: 4 },
    { key: 'methodology', label: 'Methodology', type: 'textarea' as const, rows: 4 },
    { key: 'techStack', label: 'Tools / Tech Stack', type: 'textarea' as const, rows: 3 },
    { key: 'timeline', label: 'Timeline', type: 'textarea' as const, rows: 3 },
    { key: 'references', label: 'References', type: 'textarea' as const, rows: 3 },
  ];

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="space-y-6">
        <div>
          <Link href={`/workspace/${workspaceId}`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Workspace
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            New Proposal
          </h1>
          <p className="text-muted-foreground mt-1">
            Fill in the sections below to create your project proposal.
          </p>
          <Separator className="mt-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Proposal Details</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-6">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === 'input' ? (
                  <Input
                    id={field.key}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                ) : (
                  <Textarea
                    id={field.key}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    rows={field.rows}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || submitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || submitting}>
            <Send className="mr-2 h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit to Supervisor'}
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}
