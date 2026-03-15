# 🛡️ SecureRAG — Multi-Tenant Secure AI Knowledge Platform

<div align="center">

**Enterprise-grade Retrieval-Augmented Generation platform with multi-tenant isolation, role-based access control, prompt injection detection, and PII masking.**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![HuggingFace](https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Security Model](#security-model)
- [Deployment](#deployment)

---

## Overview

SecureRAG is a production-grade SaaS platform that allows organizations to upload internal documents and interact with an AI assistant that retrieves answers exclusively from their company's knowledge base.

**Key differentiators:**
- **Multi-tenant architecture** — complete data isolation between organizations
- **Enterprise security** — prompt injection detection, PII masking, audit logging
- **Role-based access control** — Admin, Manager, and Employee permission levels
- **Production-ready** — Docker deployment, structured logging, error handling

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Login/   │ │Dashboard │ │  Chat    │ │  Admin Panel  │  │
│  │  Signup   │ │          │ │Interface │ │  (Audit Logs) │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼─────────────────────────────────┐
│                     API Gateway (Express.js)                 │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────┐  │
│  │   Auth    │ │  Tenant  │ │   RBAC    │ │    Rate      │  │
│  │Middleware │ │ Isolation│ │ Middleware │ │  Limiting    │  │
│  └───────────┘ └──────────┘ └───────────┘ └─────────────┘  │
└───────┬──────────────┬──────────────┬───────────────────────┘
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼──────────────────────┐
│   Auth       │ │  Document  │ │      RAG Pipeline          │
│   Service    │ │  Service   │ │  ┌──────────────────────┐  │
│  (JWT+bcrypt)│ │ (Upload/   │ │  │ 1. Prompt Guard      │  │
│              │ │  Process)  │ │  │ 2. Embed Query       │  │
└──────────────┘ └─────┬──────┘ │  │ 3. Vector Search     │  │
                       │        │  │ 4. Build Context     │  │
                 ┌─────▼──────┐ │  │ 5. LLM Generation   │  │
                 │  Ingestion │ │  │ 6. PII Masking       │  │
                 │  Pipeline  │ │  │ 7. Audit Log         │  │
                 │ ┌────────┐ │ │  └──────────────────────┘  │
                 │ │Extract │ │ └────────────────────────────┘
                 │ │Chunk   │ │
                 │ │Embed   │ │
                 │ │Store   │ │
                 │ └────────┘ │
                 └──────┬─────┘
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼──────┐ ┌────▼─────┐ ┌────▼──────┐
    │ PostgreSQL │ │ ChromaDB │ │  OpenAI   │
    │ (Tenants,  │ │ (Vector  │ │ (Embed +  │
    │  Users,    │ │  Store)  │ │  Generate)│
    │  Docs,     │ │          │ │           │
    │  Audit)    │ │          │ │           │
    └────────────┘ └──────────┘ └───────────┘
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, TailwindCSS, shadcn/ui, Radix UI |
| **Backend** | Node.js, Express.js, TypeScript |
| **AI/RAG** | @xenova/transformers, Xenova/all-MiniLM-L6-v2 (local, no API keys) |
| **Vector DB** | ChromaDB |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT (access + refresh tokens) + bcrypt |
| **Security** | Helmet, CORS, rate limiting, prompt injection detection, PII masking |
| **Deployment** | Docker + Docker Compose |

---

## Features

### Core
- 📄 **Document Ingestion** — Upload PDF, DOCX, TXT, Markdown files
- 🤖 **AI Chat** — Query your knowledge base with natural language
- 📊 **Source Citations** — Every answer includes document references with relevance scores

### Multi-Tenancy
- 🏢 **Company Isolation** — Every data query is scoped by `company_id`
- 🔐 **Tenant-Filtered Vectors** — ChromaDB queries always filter by tenant
- 🚫 **Cross-Tenant Prevention** — Middleware blocks tenant spoofing attempts

### Security
- 🛡️ **Prompt Injection Detection** — Blocks "ignore previous instructions" attacks
- 🔒 **PII Masking** — Auto-redacts emails, phones, SSNs, credit cards in responses
- 📝 **Audit Logging** — Full query trail with suspicious activity flagging
- ⚡ **Rate Limiting** — Configurable request throttling per IP
- 🔑 **RBAC** — Admin / Manager / Employee role enforcement

### Enterprise
- 📈 **Dashboard Analytics** — Document stats, query metrics, security summary
- 👥 **User Management** — Add users, assign roles, deactivate accounts
- 🔍 **Admin Audit Panel** — Filter and review all queries with threat indicators

---

## Project Structure

```
secure-rag-platform/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config/                # Environment configuration
│   │   ├── controllers/           # Route handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── document.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── database/              # Prisma client + seed
│   │   ├── middleware/            # Auth, RBAC, tenant, validation
│   │   ├── rag/                   # RAG pipeline
│   │   │   ├── document-processor.ts
│   │   │   ├── text-chunker.ts
│   │   │   ├── embedding.service.ts
│   │   │   ├── vector-store.ts
│   │   │   └── rag-chain.ts
│   │   ├── routes/                # Express route definitions
│   │   ├── security/              # Security layer
│   │   │   ├── prompt-guard.ts
│   │   │   ├── data-masker.ts
│   │   │   └── audit.service.ts
│   │   ├── services/              # Business logic
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── utils/                 # Logger, errors, response helpers
│   │   └── index.ts               # Express app entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── login/                 # Login page
│   │   ├── register/              # Registration page
│   │   └── dashboard/             # Authenticated pages
│   │       ├── chat/              # AI chat interface
│   │       ├── documents/         # Document list
│   │       ├── upload/            # Document upload
│   │       ├── users/             # User management (Admin)
│   │       └── admin/             # Audit logs (Admin)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   └── sidebar.tsx            # Navigation sidebar
│   ├── hooks/                     # React hooks
│   ├── lib/                       # API client, auth helpers
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/secure-rag-platform.git
cd secure-rag-platform

# 2. Start all services (no API keys needed)
docker-compose up -d

# 4. Run database migrations
docker-compose exec backend npx prisma migrate dev

# 5. Seed demo data
docker-compose exec backend npm run seed
```

The platform will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

### Local Development

```bash
# Start infrastructure services
docker-compose up -d postgres chromadb

# Backend setup
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Demo Credentials

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@acme.com | password123 |
| Manager | manager@acme.com | password123 |
| Employee | employee@acme.com | password123 |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `JWT_EXPIRY` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL | `7d` |
| `CHROMA_URL` | ChromaDB URL | `http://localhost:8000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000/api` |

---

## API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register company + admin | No |
| `POST` | `/api/auth/login` | Login | No |
| `POST` | `/api/auth/refresh` | Refresh tokens | No |
| `GET` | `/api/auth/me` | Get current user profile | Yes |

### Documents

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/api/documents` | Upload document (multipart) | Admin, Manager |
| `GET` | `/api/documents` | List documents | All |
| `GET` | `/api/documents/stats` | Document statistics | All |
| `GET` | `/api/documents/:id` | Get document details | All |
| `DELETE` | `/api/documents/:id` | Delete document | Admin, Manager |

### Chat (RAG)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/api/chat/query` | Query AI assistant | All |
| `GET` | `/api/chat/history` | Get query history | All |

### Users

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/users` | List users | Admin |
| `POST` | `/api/users` | Add user | Admin |
| `GET` | `/api/users/:id` | Get user | Admin |
| `PATCH` | `/api/users/:id/role` | Update role | Admin |
| `DELETE` | `/api/users/:id` | Deactivate user | Admin |

### Admin

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/admin/dashboard` | Dashboard stats | Admin |
| `GET` | `/api/admin/audit-logs` | Audit logs | Admin |

### Example: Chat Query

```bash
curl -X POST http://localhost:4000/api/chat/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is our company vacation policy?", "topK": 5}'
```

Response:
```json
{
  "success": true,
  "data": {
    "answer": "According to the Employee Handbook, the company offers...",
    "sources": [
      {
        "documentId": "abc-123",
        "documentTitle": "Employee Handbook",
        "chunkContent": "Annual leave policy: All full-time employees...",
        "relevanceScore": 0.92
      }
    ],
    "tokensUsed": 487,
    "latencyMs": 1250
  }
}
```

---

## Security Model

### Multi-Tenant Isolation

Every database query and vector search is scoped by `company_id`. The tenant middleware validates that:
1. JWT token contains a valid `companyId`
2. Request body/params cannot spoof a different `companyId`
3. Vector queries always filter by `tenantId`

### Prompt Injection Detection

The PromptGuard module scans every user query for:
- Instruction override patterns ("ignore previous instructions")
- System prompt extraction attempts
- Role manipulation ("you are now a...")
- SQL/XSS injection patterns
- Hidden text via zero-width characters
- Excessive input length

Blocked queries are logged with the threat type for audit review.

### PII Masking

The DataMasker automatically redacts sensitive patterns in LLM responses:
- Email addresses → `[EMAIL REDACTED]`
- Phone numbers → `[PHONE REDACTED]`
- Social Security Numbers → `[SSN REDACTED]`
- Credit card numbers → `[CARD NUMBER REDACTED]`
- API keys → `[API KEY REDACTED]`

### RBAC Permissions

| Permission | Admin | Manager | Employee |
|-----------|-------|---------|----------|
| Query AI | ✅ | ✅ | ✅ |
| View documents | ✅ | ✅ | ✅ |
| Upload documents | ✅ | ✅ | ❌ |
| Delete documents | ✅ | ✅ | ❌ |
| Access confidential docs | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ |

---

## Deployment

### Docker Compose (Recommended)

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f backend

# Scale
docker-compose up -d --scale backend=3
```

### Vercel (Frontend)

```bash
cd frontend
vercel --prod
```

Set `NEXT_PUBLIC_API_URL` in Vercel environment settings.

### Render / Railway (Backend)

1. Connect your GitHub repository
2. Set the root directory to `backend`
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npm start`
5. Add all environment variables from `.env.example`

### Database Hosting

- **PostgreSQL:** Supabase, Neon, Railway, or AWS RDS
- **ChromaDB:** Self-host via Docker or use Chroma Cloud

---

## License

MIT

---

<div align="center">
  <p>Built with 🛡️ by SecureRAG Team</p>
  <p><em>Enterprise-grade AI knowledge management, secured by design.</em></p>
</div>
