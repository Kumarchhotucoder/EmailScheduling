# Full-Stack Email Scheduling System

A production-minded, full-stack email scheduling and dispatch platform built with **Node.js, Express, BullMQ, Redis (AOF Persistence), MongoDB, React (Vite & Tailwind CSS)**, and **Nodemailer with Ethereal SMTP test capture**.

This system guarantees resilient scheduling across backend/worker crashes, rate-limited and concurrent job processing, user isolation, and end-to-end auditability with instant test email preview links.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Technology Stack](#3-technology-stack)
4. [Key Features Implemented](#4-key-features-implemented)
5. [Feature Mapping Matrix](#5-feature-mapping-matrix)
6. [Repository Structure](#6-repository-structure)
7. [Prerequisites](#7-prerequisites)
8. [Environment Variable Configuration](#8-environment-variable-configuration)
9. [Ethereal Email Setup & Behavior](#9-ethereal-email-setup--behavior)
10. [Step-by-Step Startup Guide](#10-step-by-step-startup-guide)
11. [API Endpoint Documentation & Examples](#11-api-endpoint-documentation--examples)
12. [Scheduling & Queue Workflow](#12-scheduling--queue-workflow)
13. [Persistence & Restart Recovery](#13-persistence--restart-recovery)
14. [Rate Limiting vs Concurrency](#14-rate-limiting-vs-concurrency)
15. [Automated Testing](#15-automated-testing)
16. [Assumptions, Shortcuts, and Trade-offs](#16-assumptions-shortcuts-and-trade-offs)
17. [Security Considerations](#17-security-considerations)
18. [GitHub Submission Checklist](#18-github-submission-checklist)
19. [Five-Minute Demonstration Video Script](#19-five-minute-demonstration-video-script)

---

## 1. Project Overview

The **Email Scheduling System** provides an end-to-end solution for scheduling emails at arbitrary future timestamps. Unlike naive implementations that rely on in-memory timers (`setTimeout`) or periodic cron pollers, this system uses **BullMQ delayed job queues backed by persistent Redis (AOF mode)** and **MongoDB**.

### Core Value Highlights:
- **Crash & Restart Resilience**: Scheduled jobs survive complete worker and API server reboots.
- **Idempotency & Duplicate Guards**: Database atomic state transitions (`scheduled` -> `processing` -> `sent`) guarantee that emails are not sent multiple times.
- **Bounded Exponential Backoff**: Transient SMTP delivery failures are retried gracefully up to configurable limits.
- **Queue Rate Limiting & Concurrency**: Controlled execution rate across worker pools prevents SMTP provider rate limit tripping.
- **Ethereal Email Sandbox**: Safe development and testing environment that captures test messages and provides shareable browser preview URLs without sending spam to real inboxes.

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer [Frontend Client (React + Vite)]
        SPA[React Single Page Application]
        AuthCtx[Auth Context & Axios Interceptors]
        Views[Dashboard • Scheduled • Sent • Failed • Compose]
        SPA --> AuthCtx
        SPA --> Views
    end

    subgraph APILayer [Express REST API (Port 5001)]
        Router[Express Router]
        AuthMW[JWT Auth Middleware]
        ValidateMW[Input Validation Middleware]
        EmailCtrl[Email Controller]
        Router --> AuthMW --> ValidateMW --> EmailCtrl
    end

    subgraph PersistenceLayer [Persistent Storage]
        MongoDB[(MongoDB 7.0<br/>User & Email Records)]
        Redis[(Redis 7 AOF<br/>BullMQ Delayed Queue)]
    end

    subgraph WorkerLayer [Standalone BullMQ Worker Process]
        WorkerConsumer[BullMQ Worker Consumer]
        RateLimiter[Shared Redis Rate Limiter]
        ConcurrencyEngine[Worker Concurrency Pool]
        Reconciler[Startup Reconciliation Service]
        Mailer[Nodemailer Transport]
        
        WorkerConsumer --> RateLimiter
        RateLimiter --> ConcurrencyEngine
        WorkerConsumer --> Reconciler
        ConcurrencyEngine --> Mailer
    end

    subgraph ExternalServices [External Mail Sandbox]
        Ethereal[Ethereal SMTP Server<br/>smtp.ethereal.email:587]
        EtherealWeb[Ethereal Web Preview Portal]
    end

    SPA <-->|JWT Authenticated REST / HTTP| Router
    EmailCtrl -->|Persist Metadata| MongoDB
    EmailCtrl -->|Enqueue Delayed Job| Redis
    
    WorkerConsumer <-->|Pull Scheduled Jobs| Redis
    WorkerConsumer <-->|Atomic State Update| MongoDB
    Mailer -->|Dispatch SMTP Message| Ethereal
    Ethereal -->|Return Message-ID & Preview URL| Mailer
    Mailer -->|Save Preview Link| MongoDB
    Views -.->|View In Browser| EtherealWeb
```

---

## 3. Technology Stack

### Frontend
- **React 18** & **Vite**: Ultra-fast build and reactive user experience.
- **Tailwind CSS**: Custom dark mode palette, glassmorphism panels, and responsive layouts.
- **Lucide Icons**: Crisp, clean iconography.
- **Axios**: HTTP client with request and response interceptors.
- **React Router DOM 6**: Declarative client-side routing and protected routes.
- **date-fns**: Time formatting and relative time helpers.

### Backend
- **Node.js 22 (ES Modules)** & **Express.js**: Lightweight, modular REST architecture.
- **JWT (`jsonwebtoken`)**: Stateless token authentication.
- **bcryptjs**: Salted password hashing (cost factor 10).
- **Helmet & CORS**: HTTP security headers and cross-origin resource sharing policies.
- **Express Rate Limit**: General endpoint flood protection.

### Queue & Broker
- **BullMQ 5.8+**: Enterprise Redis-backed queue with native delayed job support, distributed rate limiters, and exponential backoff retries.
- **Redis 7 (Alpine)**: In-memory broker configured with `appendonly yes` (AOF) for crash durability.

### Persistence
- **MongoDB 7.0** & **Mongoose 8**: Document persistence with compound indexes for user isolation and fast status queries.

### Testing & Infrastructure
- **Docker Compose**: Containerized Redis (with persistent volume and AOF) and MongoDB.
- **Vitest**: Unit and integration test runner.
- **Supertest**: High-level HTTP API integration testing.
- **Nodemailer**: SMTP client configured with Ethereal test credentials.

---

## 4. Key Features Implemented

1. **Authentication & User Isolation**:
   - Secure registration, password hashing via bcrypt, and JWT issuance.
   - All email operations are strictly scoped by `userId`. Users can never view, update, or cancel another user's emails.
   - Password hashes are sanitized from all API JSON responses.

2. **Durable Email Scheduling**:
   - Users choose date/time via rich datetime picker or quick presets (+1 min, +5 min, +30 min, +1 hour, Tomorrow 9 AM).
   - Backend validates future timestamp and rejects past dates.
   - BullMQ delayed job is created with `jobId = emailId` and delay computed from `scheduledAt - now`.

3. **Standalone Background Worker**:
   - Fully decoupled from Express server. Can be scaled, killed, or restarted independently.
   - Atomically transitions job state in MongoDB: `scheduled` -> `processing` -> `sent` (or `failed`).
   - Automatically handles retries with exponential backoff on transient errors.

4. **Crash & Restart Recovery**:
   - Redis AOF (`appendfsync everysec`) guarantees delayed jobs are preserved on disk.
   - MongoDB named volume preserves email records.
   - Reconciliation routine runs upon worker/API startup to check for stalled `processing` jobs or missing queue references.

5. **Rate Limiting & Concurrency**:
   - Worker concurrency limit (`WORKER_CONCURRENCY=5` simultaneous dispatches per worker).
   - Queue rate limiter (`EMAIL_RATE_LIMIT_MAX=10` per `EMAIL_RATE_LIMIT_DURATION=10000ms`).

6. **Ethereal Email Sandbox**:
   - Dispatches test messages to Ethereal SMTP (`smtp.ethereal.email:587`).
   - Captures `previewUrl` and persists it to the database.
   - Frontend provides a direct one-click "Preview in Ethereal" button.
   - Auto-generates a disposable test account if custom credentials are not provided.

---

## 5. Feature Mapping Matrix

| Requirement | Implementation Component | File Location |
| :--- | :--- | :--- |
| **User Registration & Login** | `authController.js` & `validateMiddleware.js` | [`backend/src/controllers/authController.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/controllers/authController.js) |
| **Password Hashing** | Mongoose pre-save hook with `bcryptjs` | [`backend/src/models/User.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/models/User.js) |
| **JWT Verification** | Bearer token auth middleware | [`backend/src/middleware/authMiddleware.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/middleware/authMiddleware.js) |
| **Email Data Schema** | Mongoose Schema with compound indexes | [`backend/src/models/Email.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/models/Email.js) |
| **Future Job Scheduling** | BullMQ delayed queue with exact millisecond delay | [`backend/src/queues/emailQueue.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/queues/emailQueue.js) |
| **Decoupled Worker** | Standalone worker process with event listeners | [`backend/src/worker.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/worker.js) & [`backend/src/workers/emailWorker.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/workers/emailWorker.js) |
| **Restart Recovery** | Redis AOF + DB reconciliation service | [`backend/src/services/recoveryService.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/services/recoveryService.js) |
| **Rate Limiter** | BullMQ Redis limiter (`max`, `duration`) | [`backend/src/workers/emailWorker.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/workers/emailWorker.js) |
| **Worker Concurrency** | BullMQ worker pool concurrency setting | [`backend/src/workers/emailWorker.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/workers/emailWorker.js) |
| **Job Cancellation** | Queue `job.remove()` + DB status update | [`backend/src/services/emailService.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/services/emailService.js) |
| **Ethereal Mailer** | Nodemailer transport with preview extraction | [`backend/src/services/mailerService.js`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/backend/src/services/mailerService.js) |
| **Responsive SPA UI** | React 18, Tailwind CSS, Lucide Icons | [`frontend/src/App.jsx`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/frontend/src/App.jsx) |
| **Live Polling Dashboard** | Automated periodic sync + metrics cards | [`frontend/src/pages/Dashboard.jsx`](file:///Users/chhotukumar/Desktop/Email%20Scheduling%20System/frontend/src/pages/Dashboard.jsx) |

---

## 6. Repository Structure

```
Email Scheduling System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                # Environment variable parsing and validation
│   │   │   ├── db.js                 # MongoDB connection and disconnection handlers
│   │   │   └── redis.js              # IORedis configuration for BullMQ
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, login, get current user
│   │   │   └── emailController.js    # Schedule, list, cancel, and stats endpoints
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT Bearer token protection
│   │   │   ├── errorMiddleware.js    # Central error handler & 404 handler
│   │   │   └── validateMiddleware.js # Payload validation (email regex, past date rejection)
│   │   ├── models/
│   │   │   ├── User.js               # User schema with bcrypt password hashing
│   │   │   └── Email.js              # Email schema with statuses and compound indexes
│   │   ├── queues/
│   │   │   └── emailQueue.js         # BullMQ queue instantiation and job dispatch
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/v1/auth routes
│   │   │   └── emailRoutes.js        # /api/v1/emails routes
│   │   ├── services/
│   │   │   ├── emailService.js       # Core business logic for emails and user isolation
│   │   │   ├── mailerService.js      # Nodemailer transport & Ethereal preview generation
│   │   │   └── recoveryService.js   # Crash reconciliation for dangling or missing jobs
│   │   ├── utils/
│   │   │   ├── logger.js             # Formatted ISO logger
│   │   │   └── response.js           # Standardized JSON response formatting
│   │   ├── workers/
│   │   │   └── emailWorker.js        # BullMQ worker with rate limiter & concurrency
│   │   ├── app.js                    # Express application setup
│   │   ├── server.js                 # API server entrypoint (Port 5001)
│   │   └── worker.js                 # Standalone BullMQ worker entrypoint
│   ├── tests/
│   │   ├── setup.js                  # Vitest database lifecycle hooks
│   │   ├── auth.test.js              # 10 automated authentication & security tests
│   │   ├── email.test.js             # 9 automated email scheduling & scoping tests
│   │   └── queue.test.js             # 5 automated queue, rate limiting & worker tests
│   ├── vitest.config.js              # Vitest test configuration
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ComposeModal.jsx      # Modal for composing emails with quick time presets
│   │   │   ├── EmailDetailModal.jsx  # Complete modal inspection with Ethereal preview button
│   │   │   ├── EmailTable.jsx        # Reusable table with pagination, search, status filters
│   │   │   ├── Navbar.jsx            # Sticky navbar with logo, route navigation & compose CTA
│   │   │   ├── StatCard.jsx          # Glassmorphism metric cards
│   │   │   └── StatusBadge.jsx       # Dynamic status badge with pulsing indicators
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication state, token persistence & logout
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx        # Protected dashboard shell & modals
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Summary stats, auto-sync toggle, recent activity
│   │   │   ├── Scheduled.jsx         # Filtered scheduled emails with cancel action
│   │   │   ├── Sent.jsx              # Filtered sent emails with Ethereal links
│   │   │   ├── Failed.jsx            # Filtered failed emails with error logs
│   │   │   ├── Login.jsx             # User login with quick demo-fill helper
│   │   │   └── Register.jsx          # User registration with password confirmation
│   │   ├── services/
│   │   │   ├── api.js                # Axios instance with interceptors
│   │   │   ├── authService.js        # Auth API calls
│   │   │   └── emailService.js       # Email scheduling API calls
│   │   ├── utils/
│   │   │   └── formatters.js         # Local/UTC time formatters & status styling
│   │   ├── App.jsx                   # React Router routing table
│   │   ├── index.css                 # Custom CSS & Tailwind styles
│   │   └── main.jsx                  # React DOM mount point
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── docker-compose.yml                # Redis (AOF) & MongoDB persistent container services
├── .gitignore
├── package.json                      # Monorepo root scripts
└── README.md
```

---

## 7. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or later (v22.x recommended)
- **npm**: v9.0.0 or later
- **Docker & Docker Compose**: For launching Redis and MongoDB containers

---

## 8. Environment Variable Configuration

Both `backend/` and `frontend/` contain `.env.example` files. Create local `.env` files for both directories:

### Backend Configuration (`backend/.env`)
```bash
PORT=5001
NODE_ENV=development

# Database & Persistence
MONGODB_URI=mongodb://localhost:27017/email_scheduler

# Redis & BullMQ Broker
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Authentication (Min 32 characters)
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long_for_security
JWT_EXPIRES_IN=7d

# Ethereal SMTP Settings
# (Leave ETHEREAL_USER and ETHEREAL_PASS empty to auto-generate a disposable test account on boot)
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=
ETHEREAL_PASS=
EMAIL_FROM="Email Scheduler <no-reply@scheduler.local>"

# Worker Concurrency & Rate Limiting
WORKER_CONCURRENCY=5
EMAIL_RATE_LIMIT_MAX=10
EMAIL_RATE_LIMIT_DURATION=10000

# Client URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration (`frontend/.env`)
```bash
# REST API Base URL
VITE_API_URL=http://localhost:5001/api/v1
```

---

## 9. Ethereal Email Setup & Behavior

### What is Ethereal Email?
[Ethereal](https://ethereal.email) is a fake SMTP service provided by Nodemailer designed specifically for development and testing. **Emails sent through Ethereal are captured in an isolated sandbox and never delivered to real human recipients.**

### How this System Handles Ethereal:
1. **Zero-Configuration Automatic Mode (Default)**:
   If `ETHEREAL_USER` and `ETHEREAL_PASS` are left blank in `backend/.env`, the worker automatically calls `nodemailer.createTestAccount()` on boot. It logs the generated test credentials and uses them seamlessly.
2. **Custom Account Mode**:
   - Visit [ethereal.email/create](https://ethereal.email/create).
   - Copy the generated `user` and `pass`.
   - Paste them into `backend/.env` under `ETHEREAL_USER` and `ETHEREAL_PASS`.
3. **Retrieving the Preview**:
   Whenever the worker delivers an email, Nodemailer generates an HTTP URL (`https://ethereal.email/message/...`). This link is saved to MongoDB and displayed directly in the web UI.

---

## 10. Step-by-Step Startup Guide

Open **4 separate terminal windows** (or use Docker for infrastructure):

### Terminal 1: Infrastructure (Redis & MongoDB)
```bash
# In project root
docker compose up -d
```
Verify services are healthy:
```bash
docker compose ps
```
Both `email_scheduler_redis` and `email_scheduler_mongodb` will report `Up (healthy)`.

### Terminal 2: Backend REST API Server
```bash
cd backend
npm install
npm run dev
# Or for production mode: npm start
```
The API server will listen on `http://localhost:5001`. Health check: `http://localhost:5001/health`.

### Terminal 3: BullMQ Background Worker
```bash
cd backend
npm run worker
# Or for watch mode: npm run worker:dev
```
The standalone worker will connect to MongoDB, verify the Ethereal SMTP transporter, reconcile any pending jobs, and poll the Redis queue.

### Terminal 4: React Frontend (Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 11. API Endpoint Documentation & Examples

All `/api/v1/emails` endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

### 1. Register User
- **POST** `/api/v1/auth/register`
- **Request Body**:
```json
{
  "name": "Alex Rivera",
  "email": "alex@company.com",
  "password": "Password123!"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "6ad4cca8577573dffdb66bc0",
      "name": "Alex Rivera",
      "email": "alex@company.com",
      "createdAt": "2026-10-18T13:42:00.517Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5..."
  }
}
```

### 2. Login User
- **POST** `/api/v1/auth/login`
- **Request Body**:
```json
{
  "email": "alex@company.com",
  "password": "Password123!"
}
```

### 3. Get Current User Profile
- **GET** `/api/v1/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`

### 4. Schedule Email
- **POST** `/api/v1/emails/schedule`
- **Request Body**:
```json
{
  "recipient": "client@example.com",
  "subject": "Q4 Performance Review",
  "body": "Dear team, please find attached the scheduled quarterly metrics.",
  "scheduledAt": "2026-10-18T14:30:00.000Z"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Email scheduled successfully",
  "data": {
    "_id": "6ad4cd12577573dffdb66c69",
    "userId": "6ad4cca8577573dffdb66bc0",
    "recipient": "client@example.com",
    "subject": "Q4 Performance Review",
    "body": "Dear team, please find attached the scheduled quarterly metrics.",
    "scheduledAt": "2026-10-18T14:30:00.000Z",
    "status": "scheduled",
    "attempts": 0,
    "maxAttempts": 3,
    "jobId": "6ad4cd12577573dffdb66c69",
    "createdAt": "2026-10-18T13:43:00.120Z",
    "updatedAt": "2026-10-18T13:43:00.145Z"
  }
}
```

### 5. List Emails (Filterable & Paginated)
- **GET** `/api/v1/emails?status=scheduled&page=1&limit=10&search=client`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Emails retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 6. Get Email Details
- **GET** `/api/v1/emails/:id`

### 7. Cancel Scheduled Email
- **DELETE** `/api/v1/emails/:id/cancel`
- *Note: Only emails in `scheduled` or `queued` status can be cancelled. Once an email is `processing` or `sent`, cancellation is rejected with HTTP 400.*

### 8. Dashboard Statistics
- **GET** `/api/v1/emails/stats`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "counts": {
      "total": 12,
      "scheduled": 4,
      "sent": 7,
      "failed": 1,
      "processing": 0,
      "cancelled": 0
    },
    "recentActivity": [...]
  }
}
```

---

## 12. Scheduling & Queue Workflow

1. **Validation**: Recipient email format, non-empty subject, non-empty body, and a future `scheduledAt` timestamp are enforced.
2. **MongoDB Write**: The email record is saved with status `scheduled`.
3. **Queue Enqueue**: BullMQ computes delay:
   ```javascript
   const delay = Math.max(0, new Date(scheduledAt).getTime() - Date.now());
   ```
   A delayed job is placed into Redis using the email's MongoDB `_id` as the durable `jobId`.
4. **Worker Execution**:
   - The BullMQ worker consumes the job when the delay timer fires.
   - Atomically updates status to `processing`.
   - Dispatches the email through Nodemailer.
   - On SMTP confirmation, saves `status = 'sent'`, `sentAt`, `messageId`, and `etherealPreviewUrl`.
5. **Transient Failure Handling**:
   - If SMTP fails temporarily, BullMQ executes exponential backoff (`delay = 3000ms * 2^attempt`).
   - If `attempts >= maxAttempts` (default 3), the status is permanently set to `failed`.

---

## 13. Persistence & Restart Recovery

### Why Process Restarts Don't Lose Jobs:
- **Redis AOF**: Redis is configured with `--appendonly yes --appendfsync everysec`. All queue operations and delayed job timers are flushed to disk every second. Even if the Redis container restarts, all timers resume exactly where they left off.
- **MongoDB Docker Volume**: `mongo_data` persists all user accounts, email states, and audit trails across container restarts.

### Restart Scenario Verification:
1. Schedule an email for 2 minutes into the future.
2. Terminate the Worker process (`SIGTERM` or `Ctrl+C`).
3. Terminate the API server.
4. Verify the scheduled email remains in MongoDB and the delayed job remains in Redis.
5. Restart the Worker.
6. The worker reconnects, runs `reconcilePendingJobs()`, and executes the delayed job at the intended time without re-sending completed jobs.

### Reconciliation Logic (`recoveryService.js`):
If a power failure or hard crash occurs while an email is mid-flight in `processing` status:
- On startup, the service detects any records lingering in `processing`.
- If their corresponding BullMQ job is missing from Redis, it safely resets them to `scheduled` and re-enqueues them with the remaining delay.

---

## 14. Rate Limiting vs Concurrency

| Concept | Concurrency | Rate Limiting |
| :--- | :--- | :--- |
| **Definition** | The number of jobs a worker processes **simultaneously at any single instant**. | The maximum number of jobs processed within a **rolling time window**. |
| **Analogy** | Number of checkout counters open at a grocery store (e.g. 5 cashiers). | Maximum number of customers allowed into the building per hour (e.g. 100/hr). |
| **Configuration** | `WORKER_CONCURRENCY=5` | `EMAIL_RATE_LIMIT_MAX=10`<br/>`EMAIL_RATE_LIMIT_DURATION=10000` (10s) |
| **Scope** | Local to each worker instance. | **Global across all workers** sharing the BullMQ queue via Redis Lua limiters. |
| **Behavior When Exceeded** | Jobs wait in the queue until an active job finishes. | Extra jobs are delayed and throttled until the time window bucket resets. |

---

## 15. Automated Testing

The suite uses **Vitest** and **Supertest** to execute 24 comprehensive integration tests covering all critical paths:

```bash
cd backend
npm test
```

### Test Suite Summary:
```
 ✓ tests/email.test.js (9 tests)
   - should schedule an email for a future date and time
   - should reject email scheduling with past timestamp
   - should reject email scheduling with invalid recipient email format
   - should reject email scheduling with empty body or empty subject
   - should list only emails belonging to the authenticated user
   - should prevent User A from retrieving details of User B email
   - should successfully cancel an eligible scheduled email
   - should reject cancellation of an already sent email
   - should return accurate dashboard statistics for authenticated user

 ✓ tests/queue.test.js (5 tests)
   - should have valid worker concurrency and rate limiter configuration settings
   - should transition status from scheduled to processing to sent upon successful delivery
   - should skip processing if an email was cancelled before worker pickup
   - should handle failure and bounded retry exhaustion
   - should recover interrupted processing emails during reconciliation

 ✓ tests/auth.test.js (10 tests)
   - should register a new user successfully
   - should reject registration with an invalid email address
   - should reject registration with a password shorter than 6 characters
   - should reject registration with duplicate email with 409 Conflict
   - should log in an existing user with correct credentials
   - should reject login with wrong password
   - should reject login for non-existent email
   - should return current user when authenticated with Bearer token
   - should reject unauthorized access without token
   - should reject unauthorized access with invalid token

Test Files  3 passed (3)
     Tests  24 passed (24)
```

---

## 16. Assumptions, Shortcuts, and Trade-offs

1. **Delivery Guarantees (At-Least-Once vs Exactly-Once)**:
   - *Reality*: True "exactly-once" delivery cannot be guaranteed across distributed networks when communicating with external SMTP relays (the Two Generals' Problem). If an SMTP server accepts a message but the connection drops before the TCP ACK reaches the worker, the worker might retry and cause a duplicate email.
   - *Implementation*: We implement **at-least-once delivery with atomic database idempotency guards** (`findOneAndUpdate` check for `status: 'scheduled'`). This eliminates internal worker race conditions while acknowledging inherent SMTP protocol limitations.
2. **Cancellation Boundaries**:
   - Jobs can be cancelled as long as they are in `scheduled` or `queued` state.
   - Once a job transitions to `processing`, cancellation is intentionally prevented to avoid race conditions with Nodemailer's active network socket.
3. **Ethereal Mail Scope**:
   - Ethereal SMTP does not transmit packets to real MX exchange hosts (e.g., Gmail, Outlook). It renders messages on its web portal for developer validation.
4. **Port Configuration on macOS**:
   - macOS Monterey and newer bind port 5000 to the AirPlay Receiver daemon (`ControlCenter`). The backend defaults to port `5001` to ensure frictionless zero-conflict local development.

---

## 17. Security Considerations

- **Password Storage**: Passwords are never stored in plaintext; salted with `bcryptjs` (salt rounds = 10).
- **Password Leakage Prevention**: Mongoose schemas use `toJSON` sanitization to strip `password` hashes from all API payloads.
- **Input Sanitization**: Body text is escaped when rendered in the UI to prevent Stored XSS attacks.
- **API Rate Limiting**: `express-rate-limit` prevents brute-force login attacks (300 requests / 15 min).
- **Environment Confidentiality**: Secret keys (`JWT_SECRET`, database credentials) are stored strictly in `.env` and excluded via `.gitignore`.

---

## 18. GitHub Submission Checklist

When pushing this project to GitHub:

- [x] `.env` files are excluded in `.gitignore` (only `.env.example` templates committed).
- [x] `node_modules`, log files, build artifacts (`dist/`), and OS files (`.DS_Store`) are excluded.
- [x] Docker Compose starts cleanly with healthchecks.
- [x] Automated test suite passes (24/24 tests).
- [x] Frontend builds without warnings or errors.

### Steps to Submit to Private Repository:
1. Create a new private repository on GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete production-minded email scheduling system"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<REPO_NAME>.git
   git push -u origin main
   ```
2. Navigate to **Settings > Collaborators** in your GitHub repository.
3. Click **Add people**, enter username `Mitrajit`, and grant collaborator access.

---

## 19. Five-Minute Demonstration Video Script

| Time | Scene | Action & Narration |
| :--- | :--- | :--- |
| **0:00–0:40** | **Application Overview & Login** | • Open `http://localhost:5173`. Show the modern, sleek dark UI.<br/>• Click "Create Account" or use "Use Test Demo Credentials" on the login screen.<br/>• Explain the architecture: React Vite frontend, Express REST backend, BullMQ queue, Redis AOF, MongoDB, and Ethereal SMTP. |
| **0:40–1:30** | **Compose & Schedule Future Emails** | • Click "+ Schedule Email".<br/>• Enter recipient `evaluator@ethereal.email`, subject, and message body.<br/>• Highlight the quick time presets (+1 min, +5 min, Tomorrow 9 AM) and UTC conversion.<br/>• Click "+1 Minute" and hit "Schedule Email".<br/>• Show the email appearing instantly in the dashboard with the blue `Scheduled` badge. |
| **1:30–2:15** | **Dashboard & Status Navigation** | • Point out the 5 real-time stat cards (Total, Scheduled, Processing, Sent, Failed).<br/>• Navigate to `/scheduled` to show the pending delayed queue.<br/>• Explain the auto-sync polling mechanism that updates states seamlessly without page reloads. |
| **2:15–3:30** | **Worker Restart Resilience** | • In the terminal, show the running BullMQ worker.<br/>• Schedule an email for 2 minutes into the future.<br/>• **Kill the worker process (`Ctrl+C` or `kill`)**.<br/>• Refresh the dashboard: show that the email remains safely in `Scheduled` status in MongoDB and Redis.<br/>• **Restart the worker (`npm run worker`)**.<br/>• Show the worker log: re-connecting, running startup reconciliation, and picking up the job exactly when its timer expires. |
| **3:30–4:15** | **Sent Email & Ethereal Preview** | • Navigate to the `/sent` tab.<br/>• Open the sent email details modal.<br/>• Click **"Open Preview"** to open the real Ethereal email preview link in a new tab.<br/>• Show the formatted email delivered and captured in the Ethereal web portal. |
| **4:15–5:00** | **Rate Limiting & Concurrency Demonstration** | • Highlight the BullMQ limiter (`10 emails per 10s`) and worker concurrency (`5`).<br/>• Run the automated tests in the terminal: `npm test` showing all 24 tests passing.<br/>• Conclude with a summary of persistence, idempotency, and security features. |
