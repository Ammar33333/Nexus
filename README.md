# Nexus - FYP Supervisor Finding and Management Portal

A comprehensive platform for managing Final Year Projects, connecting students with supervisors through intelligent matching, structured proposal workflows, and milestone-based evaluation.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker & Docker Compose

## Quick Start

```bash
# Clone and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5001/api/health
```

## Default Accounts (after seeding)

| Role       | Email                          | Password    |
|------------|--------------------------------|-------------|
| Admin      | admin@nexus.edu                | password123 |
| Supervisor | sarah.johnson@university.edu   | password123 |
| Student    | student@university.edu         | password123 |

## Project Structure

```
Nexus/
├── client/          # Next.js frontend
├── server/          # Express backend
│   ├── prisma/      # Database schema & migrations
│   └── src/         # Source code
├── docker-compose.yml
└── .env.example
```

## Development

```bash
# Run without Docker
cd server && npm install && npm run dev
cd client && npm install && npm run dev

# Database
cd server
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```
