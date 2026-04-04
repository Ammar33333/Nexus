'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getStatusConfig, formatDate } from '@/lib/proposal-utils';
import { Plus, Eye, Edit, Clock, FileText } from 'lucide-react';

interface ProposalVersion {
  id: string;
  versionNumber: string;
  title: string;
  changeSummary: string | null;
  createdAt: string;
}

interface Proposal {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  versions: ProposalVersion[];
}

interface Workspace {
  id: string;
  projectProfile: {
    id: string;
    title: string;
    domain: string;
  };
  supervisor: {
    id: string;
    user: { name: string; email: string };
  };
  student: {
    id: string;
    user: { name: string; email: string };
  };
  proposals: Proposal[];
}

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/workspaces/${workspaceId}`)
      .then((res) => setWorkspace(res.data.data))
      .catch(() => toast.error('Failed to load workspace'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  const proposal = workspace.proposals[0];
  const statusConfig = proposal ? getStatusConfig(proposal.status) : null;
  const latestVersion = proposal?.versions[proposal.versions.length - 1];
  const needsRevision =
    proposal?.status === 'REVISIONS_REQUESTED' ||
    proposal?.status === 'ADMIN_REVISIONS_REQUESTED';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-mono">
          {workspace.projectProfile.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          Supervisor: {workspace.supervisor.user.name}
        </p>
        <Separator className="mt-2" />
      </div>

      <Tabs defaultValue={0}>
        <TabsList>
          <TabsTrigger value={0}>Proposal</TabsTrigger>
          <TabsTrigger value={1}>Milestones</TabsTrigger>
          <TabsTrigger value={2}>Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value={0}>
          <div className="space-y-6 mt-4">
            {!proposal ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">No proposal yet</p>
                  <p className="text-muted-foreground mt-1">
                    Create your first proposal to get started.
                  </p>
                  <Link
                    href={`/workspace/${workspaceId}/proposal/new`}
                    className="inline-block mt-4"
                  >
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Proposal
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Proposal Status</CardTitle>
                      <Badge variant={statusConfig!.variant}>
                        {statusConfig!.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-4 space-y-2">
                    {latestVersion && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Current Version
                          </span>
                          <span className="font-medium">
                            v{latestVersion.versionNumber}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Last Updated
                          </span>
                          <span>{formatDate(proposal.updatedAt)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/workspace/${workspaceId}/proposal/${proposal.id}`}
                      >
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-3 w-3" />
                          View Proposal
                        </Button>
                      </Link>
                      {needsRevision && (
                        <Link
                          href={`/workspace/${workspaceId}/proposal/${proposal.id}/revise`}
                        >
                          <Button size="sm">
                            <Edit className="mr-1 h-3 w-3" />
                            Start Revisions
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {needsRevision && (
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Revisions Requested
                      </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        Your supervisor has requested revisions. Please review
                        the feedback on your proposal and make the necessary
                        changes.
                      </p>
                      <Link
                        href={`/workspace/${workspaceId}/proposal/${proposal.id}/revise`}
                        className="inline-block mt-3"
                      >
                        <Button size="sm" variant="outline">
                          <Edit className="mr-2 h-4 w-4" />
                          Start Revisions
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Proposal History</CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-4 space-y-3">
                    {proposal.versions
                      .slice()
                      .reverse()
                      .map((version, index) => {
                        const isLatest = index === 0;
                        return (
                          <div
                            key={version.id}
                            className="flex items-center justify-between border rounded p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                Version {version.versionNumber}
                                {version.changeSummary && (
                                  <span className="text-muted-foreground font-normal">
                                    {' '}
                                    &mdash; {version.changeSummary}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(version.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isLatest && needsRevision ? (
                                <Link
                                  href={`/workspace/${workspaceId}/proposal/${proposal.id}/revise`}
                                >
                                  <Button size="sm" variant="outline">
                                    <Edit className="mr-1 h-3 w-3" />
                                    Revise
                                  </Button>
                                </Link>
                              ) : (
                                <Link
                                  href={`/workspace/${workspaceId}/proposal/${proposal.id}`}
                                >
                                  <Button size="sm" variant="ghost">
                                    <Eye className="mr-1 h-3 w-3" />
                                    View
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      STATUS LABELS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { status: 'DRAFT', label: 'Draft' },
                        { status: 'SUBMITTED', label: 'Submitted' },
                        {
                          status: 'REVISIONS_REQUESTED',
                          label: 'Revisions Requested',
                        },
                        {
                          status: 'SUPERVISOR_APPROVED',
                          label: 'Supervisor Approved',
                        },
                        { status: 'ADMIN_APPROVED', label: 'Approved' },
                        { status: 'REJECTED', label: 'Rejected' },
                      ].map(({ status, label }) => {
                        const config = getStatusConfig(status);
                        return (
                          <Badge
                            key={status}
                            variant={config.variant}
                            className="text-xs"
                          >
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value={1}>
          <div className="mt-4">
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Milestones</p>
                <p className="text-muted-foreground mt-1">Coming soon</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value={2}>
          <div className="mt-4">
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Meetings</p>
                <p className="text-muted-foreground mt-1">Coming soon</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
