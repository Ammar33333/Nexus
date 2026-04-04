'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { X, Search } from 'lucide-react';

const DOMAINS = [
  'AI/ML',
  'Web Development',
  'Cybersecurity',
  'Data Science',
  'IoT',
  'Mobile Development',
  'Cloud Computing',
  'Blockchain',
  'Other',
];

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [description, setDescription] = useState('');
  const [supervisionStyle, setSupervisionStyle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const skill = skillInput.trim();
      if (skill && !skills.includes(skill)) {
        setSkills([...skills, skill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async () => {
    if (!title || title.length < 3) {
      toast.error('Title must be at least 3 characters');
      return;
    }
    if (!domain) {
      toast.error('Please select a project domain');
      return;
    }
    if (skills.length === 0) {
      toast.error('Add at least one required skill');
      return;
    }
    if (description.length < 50) {
      toast.error('Description must be at least 50 characters');
      return;
    }
    if (!supervisionStyle) {
      toast.error('Please select a supervision style');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/projects', {
        title,
        domain,
        skills,
        description,
        supervisionStyle,
      });
      toast.success('Project created! Finding recommended supervisors...');
      router.push(`/matching/${data.data.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Start New Project
          </h1>
          <p className="text-muted-foreground mt-1">
            Fill out your project details to find recommended supervisors.
          </p>
          <Separator className="mt-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Interest Form</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                placeholder="Enter your working project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Project Domain</Label>
              <Select value={domain} onValueChange={(v) => setDomain(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Required Skills</Label>
              <Input
                placeholder="Type a skill and press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={addSkill}
              />
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="cursor-pointer gap-1"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project idea in detail (min 50 characters)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length} characters (min 50)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preferred Supervision Style</Label>
              <div className="flex gap-2">
                {(
                  [
                    { value: 'WEEKLY', label: 'Weekly' },
                    { value: 'BIWEEKLY', label: 'Bi-weekly' },
                    { value: 'FLEXIBLE', label: 'Flexible' },
                  ] as const
                ).map((style) => (
                  <Button
                    key={style.value}
                    type="button"
                    variant={
                      supervisionStyle === style.value ? 'default' : 'outline'
                    }
                    onClick={() => setSupervisionStyle(style.value)}
                    className="flex-1"
                  >
                    {style.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              <Search className="mr-2 h-4 w-4" />
              {submitting
                ? 'Creating Project...'
                : 'Find Recommended Supervisors'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
