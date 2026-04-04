# Nexus — FYP Supervisor Finding & Management Portal

A web-based portal for managing Final Year Projects: intelligent supervisor matching, structured proposal workflows, milestone tracking, rubric-based evaluation, and admin oversight.

## Tech Stack

| Layer          | Technology                                              |
|----------------|---------------------------------------------------------|
| Backend        | Express.js (Node.js), TypeScript                        |
| Database       | PostgreSQL 16                                           |
| ORM            | Prisma                                                  |
| Frontend       | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Infrastructure | Docker & Docker Compose                                 |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed
- Git

## Setup & Running

### 1. Clone the repository

```bash
git clone https://github.com/Ammar33333/Nexus.git
cd Nexus
```

### 2. Environment variables

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

Default `.env` values work out of the box with Docker:

| Variable              | Default                                                       | Description                  |
|-----------------------|---------------------------------------------------------------|------------------------------|
| `DATABASE_URL`        | `postgresql://nexus:nexus_password@db:5432/nexus_db?schema=public` | PostgreSQL connection string |
| `JWT_SECRET`          | `nexus-dev-jwt-secret-key-2024`                               | JWT signing secret           |
| `JWT_EXPIRES_IN`      | `7d`                                                          | Access token expiry          |
| `JWT_REFRESH_SECRET`  | `nexus-dev-refresh-secret-key-2024`                           | Refresh token secret         |
| `JWT_REFRESH_EXPIRES_IN` | `30d`                                                      | Refresh token expiry         |
| `PORT`                | `5001`                                                        | Backend server port          |
| `CLIENT_URL`          | `http://localhost:3000`                                       | Frontend origin (CORS)       |

### 3. Start all services

```bash
docker-compose up --build
```

This brings up three containers:

| Service  | Container Port | Host Port | Description              |
|----------|---------------|-----------|--------------------------|
| `db`     | 5432          | 5432      | PostgreSQL database      |
| `server` | 5001          | 5001      | Express API server       |
| `client` | 3000          | 3000      | Next.js frontend         |

### 4. Run database migration and seed

Once the containers are running, open a second terminal:

```bash
docker-compose exec server npx prisma migrate dev --name init
docker-compose exec server npx prisma db seed
```

### 5. Verify

- **Frontend**: http://localhost:3000
- **Backend health check**: http://localhost:5001/api/health

### Running without Docker (alternative)

```bash
# Terminal 1: Start PostgreSQL locally and set DATABASE_URL in .env to point to it

# Terminal 2: Backend
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

# Terminal 3: Frontend
cd client
npm install
npm run dev
```

## Test Accounts (after seeding)

| Role       | Email                          | Password      |
|------------|--------------------------------|---------------|
| Admin      | `admin@nexus.edu`              | `password123` |
| Student    | `student@university.edu`       | `password123` |
| Supervisor | `sarah.johnson@university.edu` | `password123` |
| Supervisor | `michael.chen@university.edu`  | `password123` |
| Supervisor | `emily.martinez@university.edu`| `password123` |
| Supervisor | `james.wilson@university.edu`  | `password123` |
| Supervisor | `lisa.park@university.edu`     | `password123` |

## Project Structure

```
Nexus/
├── client/                          # Next.js frontend
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── (protected)/         # Auth-guarded routes
│   │   │   │   ├── admin/           # Admin dashboard, settings, templates, proposals
│   │   │   │   ├── dashboard/       # Student dashboard
│   │   │   │   ├── matching/        # Supervisor matching results
│   │   │   │   ├── notifications/   # Notification center
│   │   │   │   ├── projects/        # Project interest form
│   │   │   │   ├── requests/        # Student request tracking
│   │   │   │   ├── supervisor/      # Supervisor dashboard, requests, proposals, evaluations
│   │   │   │   ├── supervisors/     # Public supervisor profiles
│   │   │   │   └── workspace/       # Project workspace (proposals, milestones, meetings)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── components/              # Reusable UI components
│   │   └── lib/                     # API client, auth store, utilities
│   ├── Dockerfile
│   └── package.json
│
├── server/                          # Express.js backend
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema (22 models, 6 enums)
│   │   ├── migrations/              # Prisma migration files
│   │   └── seed.ts                  # Database seeding script
│   ├── src/
│   │   ├── controllers/             # Request handlers (business logic)
│   │   ├── middleware/               # Auth, validation, error handling
│   │   ├── routes/                  # Express route definitions
│   │   ├── services/                # Matching algorithm, notifications, cron jobs
│   │   ├── utils/                   # Prisma client, JWT, email, file upload
│   │   ├── validators/              # Zod request validation schemas
│   │   └── index.ts                 # App entry point
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml               # Orchestrates db, server, client
├── .env.example                     # Environment variable template
└── .env                             # Local environment variables (git-ignored)
```

## Architecture

### Backend Service Layers

```
Request → Route → Middleware (auth, validate) → Controller → Service/Prisma → Response
```

- **Routes** define URL patterns and wire middleware to controllers
- **Middleware** handles JWT authentication, role-based authorization (RBAC), and Zod request validation
- **Controllers** contain request handling and business logic
- **Services** encapsulate reusable logic (matching algorithm, notification dispatch, scheduled tasks)
- **Prisma** provides type-safe database access via generated client

### Authentication & Authorization

- JWT-based authentication (access + refresh tokens)
- Role-based access control: `STUDENT`, `SUPERVISOR`, `ADMIN`
- Protected routes enforce roles via `authorize('ROLE')` middleware

## Database Schema

### Core Models (22 total)

| Model                | Purpose                                         |
|----------------------|-------------------------------------------------|
| `User`               | User account (email, password hash, role)       |
| `StudentProfile`     | Student metadata (program, enrollment year)     |
| `SupervisorProfile`  | Supervisor metadata (expertise, slots, style)   |
| `AcademicSession`    | Academic term settings and limits               |
| `ProjectProfile`     | Student project interest form                   |
| `SupervisionRequest` | Request from student to supervisor              |
| `RequestMessage`     | Messages on info-requested supervision requests |
| `ProjectWorkspace`   | Shared workspace after acceptance               |
| `Proposal`           | Proposal lifecycle tracker                      |
| `ProposalVersion`    | Versioned proposal content                      |
| `ProposalComment`    | Inline review comments on proposal versions     |
| `MilestoneTemplate`  | Reusable milestone templates                    |
| `MilestoneTemplateItem` | Items within a template                      |
| `Milestone`          | Individual project milestone                    |
| `MilestoneSubmission`| Student deliverable submission                  |
| `Meeting`            | Scheduled supervisor-student meeting            |
| `MeetingLog`         | Post-meeting attendance, notes, action items    |
| `EvaluationRubric`   | Grading rubric definition                       |
| `RubricCriterion`    | Individual rubric criteria with weights         |
| `Evaluation`         | Supervisor evaluation of a milestone            |
| `EvaluationScore`    | Score per criterion in an evaluation            |
| `Notification`       | In-app notifications                            |

### Enums

| Enum             | Values                                                                                              |
|------------------|------------------------------------------------------------------------------------------------------|
| `Role`           | `STUDENT`, `SUPERVISOR`, `ADMIN`                                                                    |
| `RequestStatus`  | `PENDING`, `ACCEPTED`, `REJECTED`, `INFO_REQUESTED`, `WITHDRAWN`, `EXPIRED`                         |
| `ProposalStatus` | `DRAFT`, `SUBMITTED`, `REVISIONS_REQUESTED`, `SUPERVISOR_APPROVED`, `ADMIN_REVISIONS_REQUESTED`, `ADMIN_APPROVED`, `REJECTED` |
| `MilestoneStatus`| `NOT_SUBMITTED`, `SUBMITTED`, `NEEDS_CHANGES`, `ACCEPTED`, `OVERDUE`                                |
| `MeetingMode`    | `ONLINE`, `IN_PERSON`                                                                               |
| `MeetingStatus`  | `SCHEDULED`, `COMPLETED`, `CANCELLED`                                                               |

## API Documentation

All endpoints return JSON in the format:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Authentication

| Method | Endpoint              | Auth | Description                              | Request Body                                                                 |
|--------|-----------------------|------|------------------------------------------|------------------------------------------------------------------------------|
| POST   | `/api/auth/register`  | No   | Register a new user                      | `{ name, email, password, role, program?, enrollmentYear?, department? }`     |
| POST   | `/api/auth/login`     | No   | Login and receive tokens                 | `{ email, password }`                                                        |
| POST   | `/api/auth/refresh`   | No   | Refresh access token                     | `{ refreshToken }`                                                           |
| GET    | `/api/auth/me`        | Yes  | Get current user profile                 | —                                                                            |

**Example — Login:**

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@university.edu","password":"password123"}'
```

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "John Smith", "email": "student@university.edu", "role": "STUDENT" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Admin — Academic Session & Settings

| Method | Endpoint                | Auth        | Description                  | Request Body                                                    |
|--------|-------------------------|-------------|------------------------------|-----------------------------------------------------------------|
| GET    | `/api/admin/session`    | Admin       | Get active academic session  | —                                                               |
| PUT    | `/api/admin/session`    | Admin       | Update academic session      | `{ name, year, semester, isActive }`                            |
| GET    | `/api/admin/settings`   | Admin       | Get system settings          | —                                                               |
| PUT    | `/api/admin/settings`   | Admin       | Update system settings       | `{ maxRequests, requestTimeoutDays, reminderDays, maxRevisions }` |

### Supervisor Profiles

| Method | Endpoint                         | Auth        | Description                     | Request Body                                                             |
|--------|----------------------------------|-------------|----------------------------------| ------------------------------------------------------------------------|
| GET    | `/api/supervisors/profile`       | Supervisor  | Get own profile                  | —                                                                       |
| PUT    | `/api/supervisors/profile`       | Supervisor  | Update own profile               | `{ expertiseAreas, researchInterests, totalSlots, supervisionStyle, bio }` |
| GET    | `/api/supervisors/profile/:id`   | Any         | Get public supervisor profile    | —                                                                       |

### Notifications

| Method | Endpoint                           | Auth | Description              |
|--------|------------------------------------|------|--------------------------|
| GET    | `/api/notifications`               | Yes  | List user notifications  |
| PUT    | `/api/notifications/:id/read`      | Yes  | Mark one as read         |
| PUT    | `/api/notifications/read-all`      | Yes  | Mark all as read         |

### WF1 — Project Profiles & Matching

| Method | Endpoint                       | Auth     | Description                          | Request Body                                             |
|--------|--------------------------------|----------|--------------------------------------|----------------------------------------------------------|
| POST   | `/api/projects`                | Student  | Create project interest form         | `{ title, domain, skills, description, supervisionStyle }` |
| GET    | `/api/projects/me`             | Student  | List own projects                    | —                                                        |
| GET    | `/api/projects/:id`            | Yes      | Get single project                   | —                                                        |
| GET    | `/api/matching/:projectId`     | Student  | Get ranked supervisor matches        | —                                                        |

**Example — Matching response:**

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "supervisorId": "...",
        "name": "Dr. Lisa Park",
        "department": "Software Engineering",
        "totalScore": 75,
        "breakdown": { "domainAlignment": 100, "skillOverlap": 25, "availability": 60, "workloadBalance": 80, "supervisionStyleMatch": 100 },
        "availableSlots": 3
      }
    ],
    "project": { "id": "...", "title": "Smart Campus Nav", "domain": "Mobile Development", "skills": ["React Native"] }
  }
}
```

### WF1 — Supervision Requests

| Method | Endpoint                       | Auth        | Description                           | Request Body                                          |
|--------|--------------------------------|-------------|---------------------------------------|-------------------------------------------------------|
| POST   | `/api/requests`                | Student     | Send supervision request (max 3 active) | `{ projectProfileId, supervisorId, message }`         |
| GET    | `/api/requests/student`        | Student     | List own requests                     | —                                                     |
| GET    | `/api/requests/supervisor`     | Supervisor  | List incoming requests                | —                                                     |
| PUT    | `/api/requests/:id/respond`    | Supervisor  | Accept / Reject / Request Info        | `{ action: "ACCEPT"|"REJECT"|"REQUEST_INFO", reason? }` |
| POST   | `/api/requests/:id/messages`   | Yes         | Send message on info-requested request| `{ message }`                                         |

### WF2 — Proposals

| Method | Endpoint                                       | Auth        | Description                    | Request Body                                                                              |
|--------|------------------------------------------------|-------------|--------------------------------|-------------------------------------------------------------------------------------------|
| POST   | `/api/workspaces/:workspaceId/proposals`       | Student     | Create proposal draft          | `{ title, abstract, problemStatement, objectives, methodology, techStack, timeline, references }` |
| GET    | `/api/proposals/:id`                           | Yes         | Get proposal with versions     | —                                                                                         |
| PUT    | `/api/proposals/:id`                           | Student     | Update draft                   | `{ title?, abstract?, problemStatement?, ... }`                                           |
| POST   | `/api/proposals/:id/submit`                    | Student     | Submit to supervisor           | `{ changeSummary? }`                                                                      |
| POST   | `/api/proposals/:id/review`                    | Supervisor  | Review proposal                | `{ action: "APPROVE"|"REQUEST_REVISIONS"|"REJECT", feedback? }`                           |
| POST   | `/api/proposals/:versionId/comments`           | Yes         | Add inline comment             | `{ section, content }`                                                                    |
| GET    | `/api/supervisor/proposals`                    | Supervisor  | Supervisor proposal queue      | —                                                                                         |
| GET    | `/api/admin/proposals`                         | Admin       | Admin proposal queue           | —                                                                                         |
| POST   | `/api/admin/proposals/:id/review`              | Admin       | Admin final review             | `{ action: "FINAL_APPROVE"|"REQUEST_REVISIONS"|"REJECT", feedback? }`                     |

### WF2 — Workspaces

| Method | Endpoint                    | Auth | Description            |
|--------|-----------------------------|------|------------------------|
| GET    | `/api/workspaces/:id`       | Yes  | Get workspace details  |

### WF3 — Milestones

| Method | Endpoint                                                   | Auth             | Description                        | Request Body                                             |
|--------|------------------------------------------------------------|------------------|------------------------------------|----------------------------------------------------------|
| POST   | `/api/admin/milestone-templates`                           | Admin            | Create milestone template          | `{ name, items: [{ title, description, orderIndex, submissionType, daysFromStart }] }` |
| GET    | `/api/admin/milestone-templates`                           | Admin            | List templates                     | —                                                        |
| GET    | `/api/workspaces/:workspaceId/milestones`                  | Yes              | List milestones for workspace      | —                                                        |
| POST   | `/api/workspaces/:workspaceId/milestones`                  | Supervisor/Admin | Create custom milestone            | `{ title, description, dueDate, submissionType, orderIndex }` |
| POST   | `/api/workspaces/:workspaceId/milestones/from-template`    | Yes              | Apply template to workspace        | `{ templateId, startDate }`                              |
| PUT    | `/api/milestones/:id`                                      | Yes              | Update milestone                   | `{ title?, description?, dueDate?, status? }`            |
| POST   | `/api/milestones/:id/submissions`                          | Student          | Submit deliverable (multipart)     | `file` (upload), `repoLink?`, `notes?`                   |
| PUT    | `/api/submissions/:id/review`                              | Supervisor       | Review submission                  | `{ status: "ACCEPTED"|"NEEDS_CHANGES", feedback? }`      |

### WF3 — Meetings

| Method | Endpoint                                      | Auth        | Description            | Request Body                                            |
|--------|-----------------------------------------------|-------------|------------------------|---------------------------------------------------------|
| POST   | `/api/workspaces/:workspaceId/meetings`       | Yes         | Schedule meeting       | `{ date, time, agenda, mode, meetingLink? }`            |
| GET    | `/api/workspaces/:workspaceId/meetings`       | Yes         | List meetings          | —                                                       |
| PUT    | `/api/meetings/:id`                           | Yes         | Update/cancel meeting  | `{ date?, time?, agenda?, status? }`                    |
| POST   | `/api/meetings/:id/log`                       | Supervisor  | Add meeting log        | `{ attendance, summary, actionItems, nextMeetingDate? }` |

### WF3 — Evaluations

| Method | Endpoint                                      | Auth        | Description               | Request Body                                                      |
|--------|-----------------------------------------------|-------------|---------------------------|-------------------------------------------------------------------|
| POST   | `/api/admin/rubrics`                          | Admin       | Create evaluation rubric  | `{ name, criteria: [{ title, description, maxScore, weight, section }] }` |
| GET    | `/api/admin/rubrics`                          | Admin       | List rubrics              | —                                                                 |
| POST   | `/api/milestones/:id/evaluate`                | Supervisor  | Submit evaluation         | `{ rubricId, scores: [{ criterionId, score, comment? }], feedback? }` |
| GET    | `/api/evaluations/:id`                        | Yes         | Get evaluation details    | —                                                                 |
| GET    | `/api/workspaces/:workspaceId/evaluations`    | Yes         | Get all workspace evals   | —                                                                 |

### WF3 — Admin Dashboard

| Method | Endpoint                                | Auth  | Description                 | Request Body                         |
|--------|-----------------------------------------|-------|-----------------------------|--------------------------------------|
| GET    | `/api/admin/dashboard`                  | Admin | Aggregate statistics        | —                                    |
| POST   | `/api/admin/grades/lock`                | Admin | Lock grades for a workspace | `{ workspaceId }`                    |
| POST   | `/api/admin/grades/:id/justify`         | Admin | Request grade justification | `{ message }`                        |
| GET    | `/api/admin/reports`                    | Admin | Generate grade report       | —                                    |
| PUT    | `/api/admin/workspaces/:id/reassign`    | Admin | Reassign supervisor         | `{ newSupervisorId }`                |

## Implemented Workflows

### Workflow 1 — Intelligent Supervisor Matching

1. Student creates a Project Interest Form (title, domain, skills, description, preferred supervision style)
2. Matching algorithm scores supervisors on: domain alignment (35%), skill overlap (25%), availability (15%), workload balance (15%), supervision style compatibility (10%)
3. Student views ranked recommendations with score breakdowns, filters by domain/slots/department
4. Student sends up to 3 simultaneous supervision requests with a personal message
5. Supervisor receives notification and can Accept, Reject (with reason), or Request More Info
6. On acceptance: other pending requests auto-withdrawn, supervisor slot decremented, shared workspace created
7. Cron job sends reminders after 7 days and auto-expires requests after 10 days

### Workflow 2 — Proposal Submission & Approval

1. Student creates structured proposal draft in workspace (title, abstract, problem statement, objectives, methodology, tech stack, timeline, references)
2. System tracks versions (v0.1, v1.0, v1.1…); submitted versions locked as read-only
3. Supervisor reviews with inline comments: Approve for Admin Review, Request Revisions, or Reject
4. Student revises with mandatory Change Summary and resubmits
5. Admin reviews approved proposals with full version history and supervisor feedback trail
6. Final approval locks proposal, generates PDF snapshot, activates milestone tracking

### Workflow 3 — Milestone Tracking & Evaluation

1. Upon proposal approval, milestones activated from department template or custom supervisor milestones
2. Student submits deliverables (file upload, repo link, notes) per milestone
3. Supervisor reviews submissions (accept / request resubmission)
4. Meeting scheduling with post-meeting logs (attendance, summary, action items)
5. Rubric-based evaluation: supervisor scores each criterion, system calculates weighted totals
6. Admin dashboard: project progress, supervisor workload, evaluation rates, grade distribution
7. Admin can lock grades, request justifications, generate reports, reassign supervisors
8. Overdue milestones auto-flagged by daily cron job

## Git Branch Strategy

| Branch      | Content                                           |
|-------------|---------------------------------------------------|
| `main`      | Foundation: auth, Docker, Prisma schema, profiles |
| `workflow1` | + Intelligent matching system                      |
| `workflow2` | + Proposal submission & approval                   |
| `workflow3` | + Milestone tracking, meetings, evaluation         |

Each workflow branch builds on the previous. The `workflow3` branch contains the complete implementation.
