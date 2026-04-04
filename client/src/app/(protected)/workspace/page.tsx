'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth-guard';
import api from '@/lib/api';

export default function WorkspaceRedirect() {
  const router = useRouter();

  useEffect(() => {
    api
      .get('/projects/me')
      .then((res) => {
        const projects = res.data.data || [];
        const withWorkspace = projects.find(
          (p: { workspace?: { id: string } }) => p.workspace
        );
        if (withWorkspace) {
          router.replace(`/workspace/${withWorkspace.workspace.id}`);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        router.replace('/dashboard');
      });
  }, [router]);

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading workspace...</p>
      </div>
    </AuthGuard>
  );
}
