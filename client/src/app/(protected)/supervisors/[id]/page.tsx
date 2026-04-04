'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import RequestDialog from '@/components/request-dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface SupervisorProfile {
  id: string;
  userId: string;
  department: string;
  expertiseAreas: string[];
  researchInterests: string[];
  totalSlots: number;
  availableSlots: number;
  supervisionStyle: string;
  bio: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ProjectInfo {
  id: string;
  title: string;
  domain: string;
  skills: string[];
}

export default function SupervisorProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const supervisorUserId = params.id as string;
  const projectIdParam = searchParams.get('projectId');

  const [profile, setProfile] = useState<SupervisorProfile | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api
      .get(`/supervisors/profile/${supervisorUserId}`)
      .then((res) => setProfile(res.data.data))
      .catch(() => toast.error('Failed to load supervisor profile'))
      .finally(() => setLoading(false));
  }, [supervisorUserId]);

  useEffect(() => {
    if (projectIdParam) {
      api
        .get(`/projects/${projectIdParam}`)
        .then((res) => setProject(res.data.data))
        .catch(() => {});
    } else {
      api
        .get('/projects')
        .then((res) => {
          const projects = res.data.data;
          if (Array.isArray(projects) && projects.length > 0) {
            setProject(projects[projects.length - 1]);
          }
        })
        .catch(() => {});
    }
  }, [projectIdParam]);

  if (loading) {
    return (
      <AuthGuard allowedRoles={['STUDENT']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </AuthGuard>
    );
  }

  if (!profile) {
    return (
      <AuthGuard allowedRoles={['STUDENT']}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">Supervisor not found</p>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          {projectIdParam && (
            <Link
              href={`/matching/${projectIdParam}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Recommendations
            </Link>
          )}
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Supervisor Profile
          </h1>
          <Separator className="mt-2" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{profile.user.name}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  {profile.department}
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                <Users className="h-3 w-3 mr-1" />
                {profile.availableSlots} / {profile.totalSlots} slots
              </Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {profile.user.email}
            </div>

            {profile.bio && (
              <div>
                <h3 className="text-sm font-medium mb-2">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Research Interests</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.researchInterests.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
                {profile.researchInterests.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No research interests listed
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Expertise Areas</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.expertiseAreas.map((area) => (
                  <Badge key={area} variant="secondary">
                    {area}
                  </Badge>
                ))}
                {profile.expertiseAreas.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No expertise areas listed
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Supervision Style</h3>
              <Badge variant="outline">{profile.supervisionStyle}</Badge>
            </div>

            <Separator />

            {project ? (
              <Button
                className="w-full"
                size="lg"
                onClick={() => setDialogOpen(true)}
                disabled={profile.availableSlots === 0}
              >
                {profile.availableSlots === 0
                  ? 'No Available Slots'
                  : 'Request Supervisor'}
              </Button>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Create a project first to request this supervisor.
                </p>
                <Link href="/projects/new">
                  <Button variant="outline">Start New Project</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {project && profile && (
          <RequestDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            supervisorId={profile.id}
            supervisorName={profile.user.name}
            projectId={project.id}
            projectTitle={project.title}
            projectDomain={project.domain}
            projectSkills={project.skills}
          />
        )}
      </div>
    </AuthGuard>
  );
}
