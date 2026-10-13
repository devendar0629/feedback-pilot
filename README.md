# FeedbackPilot — Full-Stack AI Feedback & Complaint Management Platform

FeedbackPilot is a complete, production-grade, AI-powered feedback and complaint management platform. Built with **FastAPI**, **PostgreSQL**, **React 19**, **Tailwind CSS**, and the official **Google Gen AI SDK for Gemini**, FeedbackPilot enables public users to submit grievances, automates triage with structured AI classification, enforces strict role-based access and note privacy, and delivers real-time SLA metrics.

---

## 1. System Architecture & Workflows

### System Architecture Diagram
```mermaid
graph TD
    Client["Browser (React 19 + TypeScript + Vite)"]
    Nginx["Production Nginx Web Server (:80 / :3000)"]
    FastAPI["FastAPI Modular Monolith (:8000)"]
    Postgres[("PostgreSQL 16 Database (:5432)")]
    Worker["Asyncio Bounded AI Background Worker"]
    Gemini["Google Gen AI Gemini Model"]

    Client -->|Static Assets| Nginx
    Client -->|/api/v1 REST Requests| Nginx
    Nginx -->|Reverse Proxy| FastAPI
    FastAPI -->|Async SQLAlchemy + asyncpg| Postgres
    FastAPI -->|Enqueue Feedback ID| Worker
    Worker -->|Structured JSON Prompt| Gemini
    Worker -->|Save AI Suggestions & Stats| Postgres
```

### Database Entity Relationship Diagram (ERD)
```mermaid
erDiagram
    USERS ||--o{ FEEDBACKS : reports
    USERS ||--o{ FEEDBACKS : assigned_to
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ NOTIFICATIONS : receives
    DEPARTMENTS ||--o{ USERS : members
    DEPARTMENTS ||--o{ CATEGORIES : groups
    DEPARTMENTS ||--o{ FEEDBACKS : owns
    CATEGORIES ||--o{ FEEDBACKS : classifies
    FEEDBACKS ||--|| TRACKING_CREDENTIALS : secures
    FEEDBACKS ||--|| AI_ANALYSES : triaged_by
    FEEDBACKS ||--o{ COMMENTS : contains
    FEEDBACKS ||--o{ STATUS_HISTORIES : tracks
    FEEDBACKS ||--o{ AUDIT_LOGS : audits

    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string full_name
        string role
        boolean is_active
    }

    FEEDBACKS {
        uuid id PK
        string reference_number UK
        string title
        text description
        string status
        string priority
        string sentiment
        timestamp created_at
        timestamp resolved_at
    }

    TRACKING_CREDENTIALS {
        uuid id PK
        uuid feedback_id FK
        string tracking_token_hash
    }

    AI_ANALYSES {
        uuid id PK
        uuid feedback_id FK
        string status
        string model_name
        int urgency_score
        string suggested_priority
        string suggested_sentiment
        text summary
        text suggested_next_action
        float confidence_score
    }

    COMMENTS {
        uuid id PK
        uuid feedback_id FK
        uuid author_id FK
        boolean is_internal
        text content
    }
```

### Feedback Lifecycle State Machine
```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : Public Submission
    SUBMITTED --> UNDER_REVIEW : Triage by Staff
    SUBMITTED --> ASSIGNED : Assign Department/Agent
    SUBMITTED --> CLOSED : Rejected / Spam
    UNDER_REVIEW --> ASSIGNED : Triage Done
    UNDER_REVIEW --> IN_PROGRESS : Direct Work
    UNDER_REVIEW --> AWAITING_INFORMATION : Info Needed
    UNDER_REVIEW --> RESOLVED : Immediate Fix
    UNDER_REVIEW --> CLOSED : Discarded
    ASSIGNED --> IN_PROGRESS : Agent Starts
    ASSIGNED --> UNDER_REVIEW : Return to Queue
    ASSIGNED --> AWAITING_INFORMATION : Need Details
    ASSIGNED --> RESOLVED : Quick Resolution
    ASSIGNED --> CLOSED : Closed
    IN_PROGRESS --> AWAITING_INFORMATION : Query Reporter
    IN_PROGRESS --> RESOLVED : Resolution Complete
    IN_PROGRESS --> CLOSED : Closed
    AWAITING_INFORMATION --> IN_PROGRESS : Info Provided
    AWAITING_INFORMATION --> RESOLVED : Fixed
    RESOLVED --> CLOSED : Archived
    RESOLVED --> REOPENED : Issue Persists
    CLOSED --> REOPENED : Reopened by Staff
    REOPENED --> IN_PROGRESS : Work Resumed
```

---

## 2. Key Features

- **Gemini AI Auto-Classification**: Automatically assesses urgency (0–100), sentiment (positive, neutral, negative, mixed), priority (low, medium, high, critical), category, department, summary, and next action using official Google Gen AI Python SDK.
- **Untrusted Input Isolation**: Strict system instructions and delimiters prevent prompt injection embedded inside submitted complaints.
- **Dual Verification Tracking**: Anonymous complaints receive an unpredictable reference code (`FP-YYYY-XXXXXX`) and a secret tracking token (`tr_...`). Only the cryptographic HMAC-SHA256 hash is persisted, preventing ticket enumeration.
- **Strict Note Privacy**: Internal staff notes (`is_internal: true`) are completely isolated on the server and database level from reporters and public tracking lookups.
- **Finite State Machine**: Backend validates all status transitions with complete status history auditing and lifecycle timestamps (`resolved_at`, `closed_at`).
- **Live PostgreSQL Analytics**: Real aggregations (no mock or hardcoded data) calculate SLA resolution times, 14-day trends, category distributions, priority breakdowns, and department workloads.
- **Role-Based Access Control**: Server-side and client-side guards for **Administrator**, **Department Agent**, and **Reporter**.

---

## 3. Technology Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **React Router v7**
- **TanStack Query v5**
- **React Hook Form** + **Zod**
- **Recharts** for real-time visualization
- **Lucide React** for modern UI icons
- **Vitest** + **React Testing Library** + **jsdom**

### Backend
- **Python 3.12+ / 3.14**
- **FastAPI**
- **SQLAlchemy 2** (Async with `asyncpg` and `aiosqlite`)
- **PostgreSQL 16**
- **Alembic** migrations
- **Pydantic v2** + `pydantic-settings`
- **PyJWT** + **bcrypt** password hashing
- **Google Gen AI Python SDK** (`google-genai`)
- **Pytest** + **pytest-asyncio** + **HTTPX**

### Infrastructure
- **Docker** & **Docker Compose**
- **Nginx** reverse proxy and SPA static server

---

## 4. Quick Start & Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- (Optional for native local execution) Python 3.12+ with `uv` and Node.js with `bun`

### 1. Configure Environment
```bash
# Copy template configuration
cp .env.example .env
```

Review `.env` settings:
```ini
POSTGRES_USER=feedbackpilot
POSTGRES_PASSWORD=feedbackpilot_secret_pass
POSTGRES_DB=feedbackpilot
DATABASE_URL=postgresql+asyncpg://feedbackpilot:feedbackpilot_secret_pass@localhost:5432/feedbackpilot
JWT_SECRET_KEY=change_this_to_a_secure_random_secret_in_production_32chars!
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
AI_ENABLED=true
```

### 2. Build and Launch via Docker Compose
```bash
docker compose up -d --build
```

> **Automated Migrations & Seeding**: The backend container automatically executes an entrypoint script (`entrypoint.sh`) that runs `alembic upgrade head` and seeds default departments, categories, and initial admin credentials upon startup. No manual migration commands are required!

Default administrator credentials:
- **Email**: `admin@feedbackpilot.io`
- **Password**: `AdminSecurePass2026!`

### 3. Access Services
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 5. Running Automated Tests

All tests are designed to execute completely offline without requiring paid API tokens.

### A. Backend Tests (Pytest)
```bash
cd backend
.\.venv\Scripts\pytest -v
```
**Results**: **61 tests passing** (37 core platform & workflow tests + 24 AI synthetic edge-case & invariant tests).

### B. Frontend Unit Tests (Vitest)
```bash
cd frontend
bun run test
```
**Results**: **11 unit tests passing** covering login, form validation, role-based protection, public tracking, and comment privacy.

### C. End-to-End Tests (Playwright)
```bash
bun x playwright test
```
Executes the comprehensive 11-step lifecycle verifying public submission, AI background analysis, admin triage, agent transition, public comment isolation, and SLA reflections.

---

## 6. Security Considerations

1. **Untrusted Content Demarcation**: User feedback input is wrapped in delimiters and strictly isolated from system prompts.
2. **Timing Attack Protection**: Tracking secrets are compared using constant-time HMAC comparison (`hmac.compare_digest`).
3. **Internal Note Redaction**: Internal comments are filtered server-side based on JWT claims; reporters and public API responses physically never receive internal note payloads.
4. **SQL Injection Defense**: All queries utilize SQLAlchemy 2 parameterized statements.
5. **Rate Limiting & Bounded Queues**: Background AI processing is bounded by an asynchronous worker queue to prevent memory exhaustion under submission bursts.
