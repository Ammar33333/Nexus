'use client';

import Navbar from '@/components/navbar';
import AuthGuard from '@/components/auth-guard';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </AuthGuard>
  );
}
