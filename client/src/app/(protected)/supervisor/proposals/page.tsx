'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getStatusConfig, formatDate } from '@/lib/proposal-utils';
import { FileText, Eye } from 'lucide-react';

interface QueueProposal {
  id: string;
  status: string;
  updatedAt: string;
  workspace: {
    student: {
      user: { name: string };
    };
    projectProfile: {
      title: string;
    };
  };
  versions: {
    id: string;
    versionNumber: string;
  }[];
}

export default function SupervisorProposalsPage() {
  const [proposals, setProposals] = useState<QueueProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/supervisor/proposals')
      .then((res) => setProposals(res.data.data || []))
      .catch(() => toast.error('Failed to load proposals'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AuthGuard allowedRoles={['SUPERVISOR']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading proposals...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['SUPERVISOR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Proposal Review Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and provide feedback on student proposals.
          </p>
          <Separator className="mt-2" />
        </div>

        {proposals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No proposals to review</p>
              <p className="text-muted-foreground mt-1">
                You&apos;ll see proposals here when students submit them.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const config = getStatusConfig(proposal.status);
              return (
                <Card key={proposal.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            {proposal.workspace.projectProfile.title}
                          </h3>
                          <Badge variant={config.variant}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {proposal.workspace.student.user.name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>
                            {proposal.versions.length} version
                            {proposal.versions.length !== 1 ? 's' : ''}
                          </span>
                          <span>
                            Submitted {formatDate(proposal.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <Link href={`/supervisor/proposals/${proposal.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="mr-1 h-3 w-3" />
                          Review
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
