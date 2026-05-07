# Nexus — Demo presentation script

Use **http://localhost:3000** after `docker-compose up` and `docker-compose exec server npx prisma migrate reset --force` (or `migrate deploy` + `db seed` on first run).

## Account credentials (seeded demo)

**Every account below uses the same password:** `password123`

| Email | Password | Who / role |
|-------|----------|------------|
| `admin@nexus.edu` | `password123` | System administrator |
| `demo.wf1@nexus.edu` | `password123` | **Alex Chen** (student) — Workflow 1 demo |
| `demo.wf23@nexus.edu` | `password123` | **Jordan Rivera** (student) — Workflows 2 & 3 demo |
| `sarah.johnson@university.edu` | `password123` | **Dr. Sarah Johnson** (supervisor) — Alex’s pending request; Jordan’s workspace |
| `michael.chen@university.edu` | `password123` | **Prof. Michael Chen** (supervisor) — optional; seeded as decliner for Alex |
| `student@university.edu` | `password123` | **John Smith** (student) — baseline empty account if you need a spare student |

## Roles at a glance (same password for each: `password123`)

| Step | Email | Password | Purpose |
|------|-------|----------|---------|
| 0 | `admin@nexus.edu` | `password123` | Academic session / system settings; optional admin dashboard |
| 1 | `demo.wf1@nexus.edu` | `password123` | **Alex Chen** — Workflow 1 (matching + requests) |
| 2 | `sarah.johnson@university.edu` | `password123` | Respond to Alex’s pending request (accept / reject / more info) |
| 3 | `demo.wf23@nexus.edu` | `password123` | **Jordan Rivera** — Workflows 2 & 3 (workspace, proposals, milestones, meetings) |
| 4 | `admin@nexus.edu` | `password123` | Admin proposal queue (Jordan’s proposal is already final-approved in seed; show read-only history) |

---

## 0 — Opening (about 1 minute)

- Show `http://localhost:5001/api/health` (API up).
- Stack: Express + Prisma + PostgreSQL + Next.js.
- Mention in-app notifications (email is optional if SMTP not set).

---

## 1 — Admin configuration (2–3 minutes)

**Login:** `admin@nexus.edu` — **Password:** `password123`

- **Admin → Settings** (if available): active academic session, max simultaneous requests (3), timeout days.
- **Admin → Dashboard** (workflow3 branch): high-level stats.
- **Admin → Templates** (optional): milestone templates.

---

## 2 — Workflow 1: Matching & requests (8–10 minutes)

**Login:** `demo.wf1@nexus.edu` — **Password:** `password123` — (**Alex Chen**)

- **Dashboard:** **Project Status** — one pending request to Dr. Sarah Johnson, one rejected from Prof. Michael Chen; **Active requests** count.
- **My Projects** → **Find Supervisors** for *Explainable AI for Medical Diagnosis*.
- **Matching page:** match scores, breakdown, filters, search; open **Request Supervisor** (message must be **≥ 50 characters**).
- **My Requests** + **Notifications** (bell).

**Switch to:** `sarah.johnson@university.edu` — **Password:** `password123`

- **Supervisor → Requests:** Alex’s project; show **Accept**, **Reject**, **Request more info**.
- If you **Accept**: other pendings auto-withdraw (seed only has one pending to Sarah; optional live second request for effect).

**Back to Alex:** refresh **My Requests** / **Dashboard**; optional **Workspace** if accepted (not pre-seeded for Alex unless you accept live).

---

## 3 — Workflow 2 & 3: Workspace (8–12 minutes)

**Login:** `demo.wf23@nexus.edu` — **Password:** `password123` — (**Jordan Rivera**)

- **Workspace** (navbar or `/workspace` redirect): single active workspace with Dr. Sarah Johnson.
- **Proposal tab:** status **Admin approved**; version **v1.0** and **v1.1** with change summary; supervisor comment on methodology.
- **Milestones tab:**  
  - Literature review — **Accepted** (submission + evaluation scores).  
  - Core FL prototype — **Submitted** (awaiting review).  
  - Privacy evaluation — **Not submitted**.  
  - Pilot deployment — **Overdue** (demo flag).
- **Meetings tab:** one **completed** meeting with log; one **scheduled** meeting.

**Optional — Supervisor view:** `sarah.johnson@university.edu` / `password123` → proposals / evaluations / milestone submission review for Jordan.

**Optional — Admin:** `admin@nexus.edu` / `password123` → proposal queue (Jordan’s row may show as approved already), **Lock grades** / reports on admin dashboard if you want to show controls.

---

## 4 — Close (1 minute)

- Point to [README.md](README.md) for API routes and local setup.
- Branch layout: `main` → `workflow1` → `workflow2` → `workflow3` (full feature set on `workflow3`).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty dashboard for demo student | Re-run seed: `docker-compose exec server npx prisma migrate reset --force` |
| Cannot open workspace | Use `demo.wf23@nexus.edu`; ensure you are on a branch that includes workspace UI |
| “Find Supervisors” missing | Use a branch with the student **My Projects** card; seed must have created `demo.wf1` project |
