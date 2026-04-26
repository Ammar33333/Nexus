import prisma from '../utils/prisma';

interface MatchScore {
  supervisorId: string;
  supervisorProfileId: string;
  name: string;
  department: string;
  expertiseAreas: string[];
  researchInterests: string[];
  supervisionStyle: string;
  availableSlots: number;
  totalSlots: number;
  isAvailable: boolean;
  totalScore: number;
  breakdown: {
    domainAlignment: number;
    skillOverlap: number;
    availability: number;
    workloadBalance: number;
    supervisionStyleMatch: number;
  };
}

function keywordMatch(source: string, targets: string[]): number {
  const sourceWords = source.toLowerCase().split(/[\s,;/&+\-]+/).filter(Boolean);
  if (sourceWords.length === 0 || targets.length === 0) return 0;

  const targetWords = targets.flatMap((t) =>
    t.toLowerCase().split(/[\s,;/&+\-]+/).filter(Boolean)
  );
  if (targetWords.length === 0) return 0;

  let matches = 0;
  for (const sw of sourceWords) {
    if (targetWords.some((tw) => tw.includes(sw) || sw.includes(tw))) {
      matches++;
    }
  }
  return matches / sourceWords.length;
}

function arrayOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  const normalize = (arr: string[]) =>
    arr.map((s) => s.toLowerCase().trim()).filter(Boolean);

  const normA = normalize(a);
  const normB = normalize(b);

  let matches = 0;
  for (const skill of normA) {
    if (normB.some((e) => e.includes(skill) || skill.includes(e))) {
      matches++;
    }
  }
  return matches / normA.length;
}

function styleScore(projectStyle: string, supervisorStyle: string): number {
  const ps = projectStyle.toUpperCase();
  const ss = supervisorStyle.toUpperCase();
  if (ps === ss) return 1;
  if (ss === 'FLEXIBLE' || ps === 'FLEXIBLE') return 0.5;
  return 0;
}

export async function runMatching(projectProfileId: string): Promise<MatchScore[]> {
  const project = await prisma.projectProfile.findUnique({
    where: { id: projectProfileId },
  });

  if (!project) {
    throw new Error('Project profile not found');
  }

  const supervisors = await prisma.supervisorProfile.findMany({
    include: { user: { select: { id: true, name: true } } },
  });

  const results: MatchScore[] = [];

  for (const sup of supervisors) {
    const workspaceCount = await prisma.projectWorkspace.count({
      where: { supervisorId: sup.id },
    });

    const domainAlignment = keywordMatch(project.domain, sup.researchInterests) * 100;
    const skillOverlap = arrayOverlap(project.skills, sup.expertiseAreas) * 100;
    const availability = sup.totalSlots > 0
      ? (sup.availableSlots / sup.totalSlots) * 100
      : 0;
    const maxStudents = sup.totalSlots;
    const workloadBalance = maxStudents > 0
      ? (Math.max(0, maxStudents - workspaceCount) / maxStudents) * 100
      : 0;
    const supervisionStyleMatch = styleScore(project.supervisionStyle, sup.supervisionStyle) * 100;

    const totalScore =
      domainAlignment * 0.35 +
      skillOverlap * 0.25 +
      availability * 0.15 +
      workloadBalance * 0.15 +
      supervisionStyleMatch * 0.10;

    results.push({
      supervisorId: sup.user.id,
      supervisorProfileId: sup.id,
      name: sup.user.name,
      department: sup.department,
      expertiseAreas: sup.expertiseAreas,
      researchInterests: sup.researchInterests,
      supervisionStyle: sup.supervisionStyle,
      availableSlots: sup.availableSlots,
      totalSlots: sup.totalSlots,
      isAvailable: sup.availableSlots > 0,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        domainAlignment: Math.round(domainAlignment * 100) / 100,
        skillOverlap: Math.round(skillOverlap * 100) / 100,
        availability: Math.round(availability * 100) / 100,
        workloadBalance: Math.round(workloadBalance * 100) / 100,
        supervisionStyleMatch: Math.round(supervisionStyleMatch * 100) / 100,
      },
    });
  }

  results.sort((a, b) => b.totalScore - a.totalScore);
  return results;
}
