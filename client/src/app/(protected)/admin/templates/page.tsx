'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Layout } from 'lucide-react';

interface TemplateItem {
  id?: string;
  title: string;
  description: string;
  order: number;
  submissionType: string;
  daysFromStart: number;
}

interface Template {
  id: string;
  name: string;
  items: TemplateItem[];
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newItems, setNewItems] = useState<TemplateItem[]>([
    { title: '', description: '', order: 1, submissionType: 'FILE', daysFromStart: 30 },
  ]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    api
      .get('/admin/milestone-templates')
      .then((res) => setTemplates(res.data.data || []))
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  };

  const addItem = () => {
    setNewItems((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        order: prev.length + 1,
        submissionType: 'FILE',
        daysFromStart: 30,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TemplateItem, value: string | number) => {
    setNewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (newItems.some((item) => !item.title.trim())) {
      toast.error('All milestone items must have a title');
      return;
    }

    setCreating(true);
    try {
      await api.post('/admin/milestone-templates', {
        name: newName,
        items: newItems,
      });
      toast.success('Template created successfully');
      setNewName('');
      setNewItems([
        { title: '', description: '', order: 1, submissionType: 'FILE', daysFromStart: 30 },
      ]);
      fetchTemplates();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['ADMIN']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Milestone Templates</h1>
          <Separator className="mt-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. FYP Standard Template"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Milestone Items</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>

              {newItems.map((item, index) => (
                <div key={index} className="rounded border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Milestone {index + 1}
                    </span>
                    {newItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                        placeholder="Milestone title"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Brief description"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Submission Type</Label>
                      <Select
                        value={item.submissionType}
                        onValueChange={(val) => updateItem(index, 'submissionType', val as string)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FILE">File Upload</SelectItem>
                          <SelectItem value="LINK">Repository Link</SelectItem>
                          <SelectItem value="BOTH">File + Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Days from Start</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.daysFromStart}
                        onChange={(e) =>
                          updateItem(index, 'daysFromStart', parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Template'}
            </Button>
          </CardContent>
        </Card>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Layout className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No templates yet</p>
              <p className="text-muted-foreground mt-1">
                Create your first milestone template above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-2">
                  {template.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex items-center justify-between border rounded p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {index + 1}. {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.submissionType}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Day {item.daysFromStart}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
