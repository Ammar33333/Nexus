'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RequestDialog from '@/components/request-dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Search, Users, AlertCircle } from 'lucide-react';

interface MatchBreakdown {
  domainAlignment: number;
  skillOverlap: number;
  availability: number;
  workloadBalance: number;
  supervisionStyleMatch: number;
}

interface MatchResult {
  supervisorId: string;
  supervisorProfileId: string;
  name: string;
  department: string;
  expertiseAreas: string[];
  researchInterests: string[];
  availableSlots: number;
  totalSlots: number;
  totalScore: number;
  breakdown: MatchBreakdown;
}

interface ProjectInfo {
  id: string;
  title: string;
  domain: string;
  skills: string[];
}

export default function MatchingPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] =
    useState<MatchResult | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [projectId]);

  const fetchMatches = async () => {
    try {
      const { data } = await api.get(`/matching/${projectId}`);
      setMatches(data.data.matches || data.data || []);
      if (data.data.project) {
        setProject(data.data.project);
      }
    } catch {
      setError('Failed to load supervisor recommendations.');
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = useMemo(() => {
    const query = search.toLowerCase();
    let results = matches.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.department.toLowerCase().includes(query) ||
        m.expertiseAreas.some((e) => e.toLowerCase().includes(query)) ||
        m.researchInterests.some((r) => r.toLowerCase().includes(query))
    );

    switch (sortBy) {
      case 'score':
        results.sort((a, b) => b.totalScore - a.totalScore);
        break;
      case 'domain':
        results.sort(
          (a, b) => b.breakdown.domainAlignment - a.breakdown.domainAlignment
        );
        break;
      case 'slots':
        results.sort((a, b) => b.availableSlots - a.availableSlots);
        break;
      case 'department':
        results.sort((a, b) => a.department.localeCompare(b.department));
        break;
    }

    return results;
  }, [matches, search, sortBy]);

  const openRequestDialog = (supervisor: MatchResult) => {
    setSelectedSupervisor(supervisor);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['STUDENT']}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">
            Finding recommended supervisors...
          </p>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard allowedRoles={['STUDENT']}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Recommended Supervisors
          </h1>
          {project && (
            <p className="text-muted-foreground mt-1">
              Based on your project: <span className="font-medium text-foreground">{project.title}</span>
            </p>
          )}
          <Separator className="mt-2" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, department, or expertise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? 'score')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Match Score</SelectItem>
              <SelectItem value="domain">Domain Match</SelectItem>
              <SelectItem value="slots">Available Slots</SelectItem>
              <SelectItem value="department">Department</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No strong matches found</p>
              <p className="text-muted-foreground mt-1">
                Try broadening your project domain or adjusting required skills.
              </p>
              <Link href="/projects/new" className="inline-block mt-4">
                <Button variant="outline">Edit Project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMatches.map((match) => (
              <Card key={match.supervisorProfileId}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{match.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {match.department}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Research Interests
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {match.researchInterests.map((r) => (
                            <Badge key={r} variant="outline">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Expertise Areas
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {match.expertiseAreas.map((e) => (
                            <Badge key={e} variant="secondary">
                              {e}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {match.availableSlots} slot
                        {match.availableSlots !== 1 ? 's' : ''} available
                      </Badge>
                    </div>

                    <div className="md:text-right space-y-3 md:min-w-[160px]">
                      <div>
                        <p className="text-3xl font-bold">
                          {Math.round(match.totalScore)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Match Score
                        </p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Domain</span>
                          <span className="font-medium">
                            {Math.round(match.breakdown.domainAlignment)}%
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Skills</span>
                          <span className="font-medium">
                            {Math.round(match.breakdown.skillOverlap)}%
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            Availability
                          </span>
                          <span className="font-medium">
                            {Math.round(match.breakdown.availability)}%
                          </span>
                        </div>
                      </div>
                      <Separator className="md:hidden" />
                      <div className="flex gap-2 md:justify-end">
                        <Link
                          href={`/supervisors/${match.supervisorId}?projectId=${projectId}`}
                        >
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => openRequestDialog(match)}
                        >
                          Request Supervisor
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedSupervisor && project && (
          <RequestDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            supervisorId={selectedSupervisor.supervisorProfileId}
            supervisorName={selectedSupervisor.name}
            projectId={project.id}
            projectTitle={project.title}
            projectDomain={project.domain}
            projectSkills={project.skills}
            onSuccess={fetchMatches}
          />
        )}
      </div>
    </AuthGuard>
  );
}
