'use client';

import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Admin Dashboard</h1>
          <Separator className="mt-2" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader><CardTitle>Total Students</CardTitle></CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Supervisors</CardTitle></CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Active Projects</CardTitle></CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pending Proposals</CardTitle></CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
