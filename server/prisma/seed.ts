import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Idempotent demo data for presentations: WF1 live path + WF2/WF3 pre-baked hero workspace. */
async function seedDemoScenarios(hashedPassword: string) {
  const sarahSup = await prisma.supervisorProfile.findFirst({
    where: { user: { email: 'sarah.johnson@university.edu' } },
    include: { user: true },
  });
  const michaelSup = await prisma.supervisorProfile.findFirst({
    where: { user: { email: 'michael.chen@university.edu' } },
  });
  if (!sarahSup || !michaelSup) {
    console.warn('Demo seed skipped: supervisors not found');
    return;
  }

  const msg50 =
    'I am keen to pursue this project under your guidance and believe my skills align well with your research group and supervision style. ';

  // ─── WF1: Alex Chen — one project, one pending + one rejected request (no workspace) ───
  await prisma.user.upsert({
    where: { email: 'demo.wf1@nexus.edu' },
    update: { name: 'Alex Chen', password: hashedPassword },
    create: {
      name: 'Alex Chen',
      email: 'demo.wf1@nexus.edu',
      password: hashedPassword,
      role: 'STUDENT',
      studentProfile: { create: { program: 'BS Computer Science', enrollmentYear: 2023 } },
    },
  });
  const wf1User = await prisma.user.findUnique({
    where: { email: 'demo.wf1@nexus.edu' },
    include: { studentProfile: true },
  });
  if (!wf1User?.studentProfile) throw new Error('demo.wf1 student profile missing');

  await prisma.supervisionRequest.deleteMany({ where: { studentId: wf1User.studentProfile.id } });
  await prisma.projectProfile.deleteMany({ where: { studentId: wf1User.studentProfile.id } });

  const wf1Project = await prisma.projectProfile.create({
    data: {
      studentId: wf1User.studentProfile.id,
      title: 'Explainable AI for Medical Diagnosis',
      domain: 'Artificial Intelligence',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Computer Vision'],
      description:
        'This project develops interpretable deep learning models for chest X-ray classification with attention-based saliency maps so clinicians can understand model decisions. It includes dataset curation, model training, and a web-based review interface for radiologists. The work aligns with trustworthy AI requirements in clinical deployment settings.',
      supervisionStyle: 'WEEKLY',
    },
  });

  await prisma.supervisionRequest.create({
    data: {
      studentId: wf1User.studentProfile.id,
      supervisorId: sarahSup.id,
      projectProfileId: wf1Project.id,
      message: msg50 + 'Your work on computer vision and deep learning is an ideal fit for my X-ray interpretability goals.',
      status: 'PENDING',
    },
  });
  await prisma.supervisionRequest.create({
    data: {
      studentId: wf1User.studentProfile.id,
      supervisorId: michaelSup.id,
      projectProfileId: wf1Project.id,
      message: msg50 + 'I would also value feedback on the deployment pipeline and observability for the clinical prototype.',
      status: 'REJECTED',
      rejectionReason:
        'Thank you for your interest. This semester I am prioritising web and cloud-native capstone projects over pure ML research.',
    },
  });

  await prisma.notification.deleteMany({ where: { userId: wf1User.id } });

  await prisma.notification.createMany({
    data: [
      {
        userId: wf1User.id,
        type: 'NEW_REQUEST',
        title: 'Request pending',
        message: 'Your supervision request to Dr. Sarah Johnson is pending review.',
        metadata: JSON.stringify({ projectId: wf1Project.id }),
      },
      {
        userId: wf1User.id,
        type: 'REQUEST_REJECTED',
        title: 'Request not accepted',
        message:
          'Prof. Michael Chen declined your request for Explainable AI for Medical Diagnosis. You can send new requests to other supervisors.',
        metadata: JSON.stringify({ projectId: wf1Project.id }),
      },
    ],
  });

  // ─── WF2+3: Jordan Rivera — matched workspace, approved proposal, milestones, meetings, evaluation ───
  await prisma.user.upsert({
    where: { email: 'demo.wf23@nexus.edu' },
    update: { name: 'Jordan Rivera', password: hashedPassword },
    create: {
      name: 'Jordan Rivera',
      email: 'demo.wf23@nexus.edu',
      password: hashedPassword,
      role: 'STUDENT',
      studentProfile: { create: { program: 'BS Computer Science', enrollmentYear: 2022 } },
    },
  });
  const wf23User = await prisma.user.findUnique({
    where: { email: 'demo.wf23@nexus.edu' },
    include: { studentProfile: true },
  });
  if (!wf23User?.studentProfile) throw new Error('demo.wf23 student profile missing');

  await prisma.projectWorkspace.deleteMany({ where: { studentId: wf23User.studentProfile.id } });
  await prisma.supervisionRequest.deleteMany({ where: { studentId: wf23User.studentProfile.id } });
  await prisma.projectProfile.deleteMany({ where: { studentId: wf23User.studentProfile.id } });

  await prisma.supervisorProfile.update({
    where: { id: sarahSup.id },
    data: { availableSlots: 2 },
  });

  const wf23Project = await prisma.projectProfile.create({
    data: {
      studentId: wf23User.studentProfile.id,
      title: 'Federated Learning for Hospital Data Sharing',
      domain: 'Machine Learning',
      skills: ['Python', 'PyTorch', 'Differential Privacy', 'Kubernetes'],
      description:
        'A federated learning framework that lets multiple hospitals collaboratively train diagnostic models without centralising patient data, using secure aggregation and differential privacy. Includes benchmarking on public medical imaging datasets and a reference Kubernetes deployment.',
      supervisionStyle: 'WEEKLY',
    },
  });

  await prisma.supervisionRequest.create({
    data: {
      studentId: wf23User.studentProfile.id,
      supervisorId: sarahSup.id,
      projectProfileId: wf23Project.id,
      message: msg50 + 'This topic builds directly on your federated and privacy-preserving ML interests.',
      status: 'ACCEPTED',
    },
  });

  const workspace = await prisma.projectWorkspace.create({
    data: {
      studentId: wf23User.studentProfile.id,
      supervisorId: sarahSup.id,
      projectProfileId: wf23Project.id,
    },
  });

  await prisma.supervisorProfile.update({
    where: { id: sarahSup.id },
    data: { availableSlots: 1 },
  });

  const proposalBody = {
    title: 'Federated Learning for Hospital Data Sharing',
    abstract:
      'We propose a federated learning system enabling hospitals to jointly improve diagnostic models while keeping patient records local. We evaluate convergence, privacy budgets, and clinical utility metrics.',
    problemStatement:
      'Centralised training of medical models raises privacy and regulatory barriers. Hospitals need collaboration without raw data pooling.',
    objectives:
      '1) Implement secure aggregation FL. 2) Integrate DP-SGD with tunable epsilon. 3) Benchmark on CheXpert-style tasks. 4) Ship a Helm chart for pilot deployment.',
    methodology:
      'Simulation with Flower/PySyft-style orchestration; ablation on client sampling; threat model for honest-but-curious server.',
    techStack: 'Python 3.11, PyTorch 2.x, gRPC, Kubernetes, Prometheus, PostgreSQL',
    timeline: 'Months 1-2 literature and ethics; 3-5 implementation; 6 evaluation and thesis write-up.',
    references: 'McMahan et al., FedAvg; Li et al., Fair Resource Allocation in FL; HIPAA guidance documents.',
  };

  const proposal = await prisma.proposal.create({
    data: {
      workspaceId: workspace.id,
      status: 'ADMIN_APPROVED',
    },
  });

  const v1 = await prisma.proposalVersion.create({
    data: {
      proposalId: proposal.id,
      versionNumber: 'v1.0',
      ...proposalBody,
      methodology:
        'Simulation with Flower-style orchestration; initial baseline without differential privacy (supervisor requested DP additions).',
      changeSummary: null,
      isLocked: true,
      pdfUrl: `/uploads/proposals/${proposal.id}/proposal-v1.0.pdf`,
    },
  });

  const v2 = await prisma.proposalVersion.create({
    data: {
      proposalId: proposal.id,
      versionNumber: 'v1.1',
      ...proposalBody,
      methodology:
        'Simulation with Flower/PySyft-style orchestration; ablation on client sampling; DP-SGD with accountant; threat model for honest-but-curious server.',
      changeSummary:
        'Expanded methodology with differential privacy (DP-SGD), privacy accountant, and explicit threat model per supervisor feedback.',
      isLocked: true,
      pdfUrl: `/uploads/proposals/${proposal.id}/proposal-v1.1.pdf`,
    },
  });

  await prisma.proposalComment.create({
    data: {
      versionId: v1.id,
      userId: sarahSup.userId,
      section: 'methodology',
      content: 'Please add a formal privacy budget and clarify the trust assumptions for the aggregation server.',
    },
  });

  const now = new Date();
  const addDays = (d: number) => new Date(now.getTime() + d * 86400000);

  const m1 = await prisma.milestone.create({
    data: {
      workspaceId: workspace.id,
      title: 'Literature Review & Ethics',
      description: 'Survey FL in healthcare, GDPR/HIPAA constraints, and submit annotated bibliography.',
      dueDate: addDays(-14),
      submissionType: 'FILE',
      orderIndex: 1,
      status: 'ACCEPTED',
    },
  });

  await prisma.milestoneSubmission.create({
    data: {
      milestoneId: m1.id,
      repoLink: 'https://github.com/demo-nexus/fl-hospital-litreview',
      notes: 'Submitted literature matrix and ethics checklist signed by advisor.',
      feedback: 'Excellent coverage of recent FL-in-health surveys. Approved.',
    },
  });

  const m2 = await prisma.milestone.create({
    data: {
      workspaceId: workspace.id,
      title: 'Core FL Prototype',
      description: 'Working vertical slice: 3 clients, non-IID split, secure aggregation path.',
      dueDate: addDays(7),
      submissionType: 'LINK',
      orderIndex: 2,
      status: 'SUBMITTED',
    },
  });

  await prisma.milestoneSubmission.create({
    data: {
      milestoneId: m2.id,
      repoLink: 'https://github.com/demo-nexus/fl-hospital-core',
      notes: 'Initial Flower coordinator + PyTorch model; README documents how to run locally.',
    },
  });

  await prisma.milestone.create({
    data: {
      workspaceId: workspace.id,
      title: 'Privacy Evaluation',
      description: 'Empirical privacy–utility trade-offs; epsilon sweep and attack surface notes.',
      dueDate: addDays(21),
      submissionType: 'FILE',
      orderIndex: 3,
      status: 'NOT_SUBMITTED',
    },
  });

  await prisma.milestone.create({
    data: {
      workspaceId: workspace.id,
      title: 'Pilot Deployment',
      description: 'Helm chart + runbook for department test cluster.',
      dueDate: addDays(-3),
      submissionType: 'LINK',
      orderIndex: 4,
      status: 'OVERDUE',
    },
  });

  const meetDone = await prisma.meeting.create({
    data: {
      workspaceId: workspace.id,
      date: addDays(-10),
      time: '14:00',
      agenda: 'Kickoff: scope confirmation, risk register, and milestone dates.',
      mode: 'ONLINE',
      meetingLink: 'https://meet.example.com/nexus-kickoff',
      duration: 45,
      status: 'COMPLETED',
    },
  });

  await prisma.meetingLog.create({
    data: {
      meetingId: meetDone.id,
      attendance: ['Jordan Rivera', 'Dr. Sarah Johnson'],
      summary: 'Aligned on federated baseline architecture and weekly sync cadence.',
      actionItems: 'Student to share repo access; supervisor to review ethics appendix draft.',
      nextMeetingDate: addDays(-3),
    },
  });

  await prisma.meeting.create({
    data: {
      workspaceId: workspace.id,
      date: addDays(5),
      time: '10:30',
      agenda: 'Mid-point demo: training curves + first DP experiment results.',
      mode: 'IN_PERSON',
      status: 'SCHEDULED',
    },
  });

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { rubricId: 'default-rubric' },
    orderBy: { title: 'asc' },
    take: 6,
  });

  if (rubricCriteria.length > 0) {
    const scoresPayload = rubricCriteria.map((c, i) => ({
      criterionId: c.id,
      score: Math.min(c.maxScore, 7 + (i % 3)),
      comment: i === 0 ? 'Strong problem framing.' : undefined,
    }));

    let weightedScoreSum = 0;
    let weightedMaxSum = 0;
    for (const s of scoresPayload) {
      const c = rubricCriteria.find((x) => x.id === s.criterionId)!;
      weightedScoreSum += s.score * c.weight;
      weightedMaxSum += c.maxScore * c.weight;
    }
    const totalScore = weightedMaxSum > 0 ? Math.round((weightedScoreSum / weightedMaxSum) * 10000) / 100 : 0;

    await prisma.evaluation.create({
      data: {
        milestoneId: m1.id,
        rubricId: 'default-rubric',
        evaluatorId: sarahSup.userId,
        totalScore,
        feedback:
          'Solid milestone. Next focus on reproducibility of privacy metrics and clearer assumptions in the threat model.',
        isLocked: false,
        scores: {
          create: scoresPayload.map((s) => ({
            criterionId: s.criterionId,
            score: s.score,
            comment: s.comment ?? null,
          })),
        },
      },
    });
  }

  await prisma.notification.deleteMany({ where: { userId: wf23User.id } });
  await prisma.notification.deleteMany({
    where: { userId: sarahSup.userId, type: 'PROPOSAL_FINAL_APPROVED' },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: wf23User.id,
        type: 'PROPOSAL_FINAL_APPROVED',
        title: 'Proposal approved',
        message: 'Your proposal has received final admin approval. Milestone tracking is now active.',
        metadata: JSON.stringify({ proposalId: proposal.id, workspaceId: workspace.id }),
      },
      {
        userId: sarahSup.userId,
        type: 'PROPOSAL_FINAL_APPROVED',
        title: 'Student proposal approved',
        message: 'Jordan Rivera\'s proposal was final-approved by admin.',
        metadata: JSON.stringify({ proposalId: proposal.id }),
      },
    ],
  });

  console.log('Demo scenarios seeded (demo.wf1@nexus.edu, demo.wf23@nexus.edu)');
}

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexus.edu' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@nexus.edu',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Supervisors
  const supervisors = [
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      department: 'Computer Science',
      expertiseAreas: ['Neural Networks', 'TensorFlow', 'PyTorch', 'Python', 'R', 'Statistical Analysis'],
      researchInterests: ['Machine Learning', 'Artificial Intelligence', 'Data Mining', 'Deep Learning', 'Natural Language Processing', 'Computer Vision'],
      bio: 'Dr. Sarah Johnson is an Associate Professor in Computer Science with over 15 years of experience in Machine Learning and Artificial Intelligence. Her research focuses on deep learning applications, natural language processing, and computer vision. She has published over 50 papers in top-tier conferences and journals.',
      supervisionStyle: 'WEEKLY',
      totalSlots: 5,
      availableSlots: 2,
    },
    {
      name: 'Prof. Michael Chen',
      email: 'michael.chen@university.edu',
      department: 'Computer Science',
      expertiseAreas: ['React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL'],
      researchInterests: ['Web Development', 'Cloud Computing', 'Distributed Systems', 'Software Engineering', 'DevOps'],
      bio: 'Prof. Michael Chen specializes in modern web technologies and cloud computing. He has extensive industry experience and has supervised over 30 FYP students.',
      supervisionStyle: 'BIWEEKLY',
      totalSlots: 6,
      availableSlots: 3,
    },
    {
      name: 'Dr. Emily Martinez',
      email: 'emily.martinez@university.edu',
      department: 'Information Security',
      expertiseAreas: ['Penetration Testing', 'Cryptography', 'Network Security', 'Python', 'Wireshark'],
      researchInterests: ['Cybersecurity', 'Blockchain', 'Network Security', 'Digital Forensics', 'Privacy-Preserving Systems'],
      bio: 'Dr. Emily Martinez is an expert in cybersecurity with a focus on blockchain and privacy-preserving systems. She consults for several Fortune 500 companies on security architecture.',
      supervisionStyle: 'FLEXIBLE',
      totalSlots: 4,
      availableSlots: 2,
    },
    {
      name: 'Dr. James Wilson',
      email: 'james.wilson@university.edu',
      department: 'Data Science',
      expertiseAreas: ['Python', 'Pandas', 'Spark', 'Tableau', 'SQL', 'Machine Learning'],
      researchInterests: ['Data Science', 'Big Data Analytics', 'Business Intelligence', 'IoT', 'Predictive Modeling'],
      bio: 'Dr. James Wilson has a dual background in data science and business analytics. His research focuses on applying big data techniques to real-world problems.',
      supervisionStyle: 'WEEKLY',
      totalSlots: 5,
      availableSlots: 4,
    },
    {
      name: 'Dr. Lisa Park',
      email: 'lisa.park@university.edu',
      department: 'Software Engineering',
      expertiseAreas: ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Firebase', 'UI/UX Design'],
      researchInterests: ['Mobile Development', 'Human-Computer Interaction', 'Accessibility', 'Cross-Platform Development'],
      bio: 'Dr. Lisa Park is a specialist in mobile development and HCI. She has published extensively on accessibility in mobile applications.',
      supervisionStyle: 'BIWEEKLY',
      totalSlots: 5,
      availableSlots: 3,
    },
  ];

  for (const sup of supervisors) {
    await prisma.user.upsert({
      where: { email: sup.email },
      update: {},
      create: {
        name: sup.name,
        email: sup.email,
        password: hashedPassword,
        role: 'SUPERVISOR',
        supervisorProfile: {
          create: {
            department: sup.department,
            expertiseAreas: sup.expertiseAreas,
            researchInterests: sup.researchInterests,
            bio: sup.bio,
            supervisionStyle: sup.supervisionStyle,
            totalSlots: sup.totalSlots,
            availableSlots: sup.availableSlots,
          },
        },
      },
    });
  }

  // Student
  await prisma.user.upsert({
    where: { email: 'student@university.edu' },
    update: {},
    create: {
      name: 'John Smith',
      email: 'student@university.edu',
      password: hashedPassword,
      role: 'STUDENT',
      studentProfile: {
        create: {
          program: 'BS Computer Science',
          enrollmentYear: 2022,
        },
      },
    },
  });

  // Academic Session
  await prisma.academicSession.upsert({
    where: { id: 'default-session' },
    update: {},
    create: {
      id: 'default-session',
      name: 'Fall 2026',
      year: 2026,
      semester: 'Fall',
      isActive: true,
      maxRequests: 3,
      requestTimeoutDays: 10,
      reminderDays: 7,
      maxRevisions: 5,
    },
  });

  // Default Evaluation Rubric
  const rubric = await prisma.evaluationRubric.upsert({
    where: { id: 'default-rubric' },
    update: {},
    create: {
      id: 'default-rubric',
      name: 'FYP Final Evaluation Rubric',
      criteria: {
        create: [
          { title: 'Problem Statement Clarity', description: 'Clarity and relevance of the problem statement', maxScore: 10, weight: 0.05, section: 'Project Proposal' },
          { title: 'Literature Review', description: 'Comprehensiveness of related work review', maxScore: 10, weight: 0.05, section: 'Project Proposal' },
          { title: 'Methodology', description: 'Appropriateness of research methodology', maxScore: 10, weight: 0.05, section: 'Project Proposal' },
          { title: 'Code Quality', description: 'Clean, well-structured code with documentation', maxScore: 15, weight: 0.15, section: 'Implementation' },
          { title: 'Functionality', description: 'All core features implemented successfully', maxScore: 15, weight: 0.15, section: 'Implementation' },
          { title: 'Technical Complexity', description: 'Use of advanced techniques and tools', maxScore: 10, weight: 0.10, section: 'Implementation' },
          { title: 'User Documentation', description: 'Clear usage instructions and examples', maxScore: 10, weight: 0.08, section: 'Documentation' },
          { title: 'Technical Documentation', description: 'Architecture and design decisions documented', maxScore: 10, weight: 0.09, section: 'Documentation' },
          { title: 'Final Report', description: 'Comprehensive report with proper formatting', maxScore: 5, weight: 0.08, section: 'Documentation' },
          { title: 'Presentation Quality', description: 'Excellent presentation with clear explanations', maxScore: 10, weight: 0.10, section: 'Presentation & Defense' },
          { title: 'Question Responses', description: 'Good understanding and clear clarification', maxScore: 10, weight: 0.10, section: 'Presentation & Defense' },
        ],
      },
    },
  });

  // Default Milestone Template
  await prisma.milestoneTemplate.upsert({
    where: { id: 'default-template' },
    update: {},
    create: {
      id: 'default-template',
      name: 'Standard FYP Template',
      items: {
        create: [
          { title: 'Literature Review', description: 'Complete comprehensive literature review and research background', orderIndex: 1, submissionType: 'FILE', daysFromStart: 21 },
          { title: 'System Design', description: 'Design system architecture and database schema', orderIndex: 2, submissionType: 'FILE', daysFromStart: 42 },
          { title: 'Implementation - Phase 1', description: 'Implement core functionality and basic UI', orderIndex: 3, submissionType: 'LINK', daysFromStart: 70 },
          { title: 'Implementation - Phase 2', description: 'Complete remaining features and integrations', orderIndex: 4, submissionType: 'LINK', daysFromStart: 98 },
          { title: 'Testing & Deployment', description: 'Conduct thorough testing and deploy system', orderIndex: 5, submissionType: 'LINK', daysFromStart: 112 },
        ],
      },
    },
  });

  await seedDemoScenarios(hashedPassword);

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
