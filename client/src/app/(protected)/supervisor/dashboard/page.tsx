'use client';

import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function SupervisorDashboard() {
  return (
    <AuthGuard allowedRoles={['SUPERVISOR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Supervisor Dashboard</h1>
          <Separator className="mt-2" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold">0</p>
              <p className="text-muted-foreground text-sm">Awaiting your response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Current Students</CardTitle></CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold">0</p>
              <p className="text-muted-foreground text-sm">Active supervisees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Available Slots</CardTitle></CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold">5</p>
              <p className="text-muted-foreground text-sm">Open for new students</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
