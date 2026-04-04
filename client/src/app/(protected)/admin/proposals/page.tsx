'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getStatusConfig, formatDate } from '@/lib/proposal-utils';
import { FileText, Eye } from 'lucide-react';

interface AdminProposal {
  id: string;
  status: string;
  updatedAt: string;
  workspace: {
    student: { user: { name: string } };
    supervisor: { user: { name: string } };
    projectProfile: { title: string };
  };
  versions: { id: string; versionNumber: string }[];
}

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<AdminProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/proposals')
      .then((res) => setProposals(res.data.data || []))
      .catch(() => toast.error('Failed to load proposals'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AuthGuard allowedRoles={['ADMIN']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading proposals...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Proposal Review
          </h1>
          <p className="text-muted-foreground mt-1">
            Final review and approval of student proposals.
          </p>
          <Separator className="mt-2" />
        </div>

        {proposals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No proposals to review</p>
              <p className="text-muted-foreground mt-1">
                Proposals approved by supervisors will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => {
                  const config = getStatusConfig(proposal.status);
                  return (
                    <TableRow key={proposal.id}>
                      <TableCell className="font-medium">
                        {proposal.workspace.student.user.name}
                      </TableCell>
                      <TableCell>
                        {proposal.workspace.projectProfile.title}
                      </TableCell>
                      <TableCell>
                        {proposal.workspace.supervisor.user.name}
                      </TableCell>
                      <TableCell>{proposal.versions.length}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(proposal.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/proposals/${proposal.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1 h-3 w-3" />
                            Review
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
