import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
