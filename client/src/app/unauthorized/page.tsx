'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">403</h1>
      <p className="text-muted-foreground">You do not have permission to access this page.</p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
