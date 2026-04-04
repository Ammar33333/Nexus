'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Save } from 'lucide-react';

interface AcademicSession {
  id?: string;
  name: string;
  year: string;
  semester: string;
  isActive: boolean;
}

interface SystemSettings {
  maxRequests: number;
  requestTimeoutDays: number;
  reminderDays: number;
  maxRevisions: number;
}

export default function AdminSettingsPage() {
  const [session, setSession] = useState<AcademicSession>({
    name: '',
    year: new Date().getFullYear().toString(),
    semester: 'FALL',
    isActive: true,
  });
  const [settings, setSettings] = useState<SystemSettings>({
    maxRequests: 3,
    requestTimeoutDays: 7,
    reminderDays: 3,
    maxRevisions: 3,
  });
  const [loading, setLoading] = useState(true);
  const [savingSession, setSavingSession] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/session').catch(() => ({ data: { data: null } })),
      api.get('/admin/settings').catch(() => ({ data: { data: null } })),
    ])
      .then(([sessionRes, settingsRes]) => {
        if (sessionRes.data.data) setSession(sessionRes.data.data);
        if (settingsRes.data.data) setSettings(settingsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSession = async () => {
    setSavingSession(true);
    try {
      await api.put('/admin/session', session);
      toast.success('Academic session updated');
    } catch {
      toast.error('Failed to update session');
    } finally {
      setSavingSession(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('System settings updated');
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['ADMIN']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Settings</h1>
          <Separator className="mt-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Academic Session</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Session Name</Label>
                <Input
                  value={session.name}
                  onChange={(e) => setSession((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Fall 2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  value={session.year}
                  onChange={(e) => setSession((s) => ({ ...s, year: e.target.value }))}
                  placeholder="2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={session.semester}
                  onValueChange={(val) => setSession((s) => ({ ...s, semester: val as string }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FALL">Fall</SelectItem>
                    <SelectItem value="SPRING">Spring</SelectItem>
                    <SelectItem value="SUMMER">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={session.isActive ? 'active' : 'inactive'}
                  onValueChange={(val) =>
                    setSession((s) => ({ ...s, isActive: val === 'active' }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveSession} disabled={savingSession}>
              <Save className="mr-1 h-3 w-3" />
              {savingSession ? 'Saving...' : 'Save Session'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Max Requests per Student</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.maxRequests}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, maxRequests: parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Request Timeout (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.requestTimeoutDays}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      requestTimeoutDays: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reminder Days Before Deadline</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.reminderDays}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, reminderDays: parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Revisions Allowed</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.maxRevisions}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, maxRevisions: parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
            </div>
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              <Save className="mr-1 h-3 w-3" />
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
