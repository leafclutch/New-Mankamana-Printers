# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manakamana Printing E-commerce Platform — a monorepo with three independent apps:
- `server/` — Express.js + TypeScript REST API (port 8005)
- `Client/` — Next.js 16 customer-facing frontend
- `admin/` — Next.js 16 admin dashboard

Database: PostgreSQL via Supabase, accessed through Prisma ORM.

## Commands

Each app has its own `node_modules` and must be run from its own directory.

### Backend (`server/`)
```bash
npm run dev              # Start dev server with nodemon (hot reload)
npm run build            # Compile TypeScript → dist/
npm start                # Run compiled output
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run seed:run         # Seed the database
npm run seed             # Reset DB + seed (uses --force)
npm run swagger          # Regenerate Swagger docs at /api-docs
```

### Client & Admin (`Client/` or `admin/`)
```bash
npm run dev    # Start Next.js dev server
npm run build  # Production build
npm run lint   # ESLint check
```

There are no test suites in this codebase currently.

## Architecture

### Backend: MVC + Service Layer

Routes → Controllers → Services → Prisma (DB)

- **Routes** (`server/src/routes/`) define endpoints and attach middleware
- **Controllers** handle HTTP request/response; minimal logic
- **Services** contain all business logic; called by controllers
- **Validators** (`server/src/validators/`) are Zod schemas passed to the `validate` middleware before controllers run

**Middleware pipeline** for protected routes:
1. `protect` — verifies JWT Bearer token, attaches `req.user`
2. `restrictTo('ADMIN' | 'CLIENT')` — role-based gate
3. `validate(schema)` — Zod body/params validation

**Prisma singleton**: `server/src/connect/index.ts` exports a single `prisma` instance. Import from there, never instantiate directly.

### Auth Flow

- JWT payload: `{ id, role, business_name }`
- Two separate login endpoints: `POST /api/v1/auth/login` (client) and `POST /api/v1/admin/auth/login` (admin)
- Client login accepts phone number OR client code (OR query in `findFirst`)
- Legacy plaintext passwords are auto-upgraded to bcrypt on first login
- Admin uses `admin-auth-token` cookie; client uses `mk_token` in localStorage

### API Base URL

All routes are prefixed `/api/v1`. Key route groups:
- `/auth` — login, logout, profile
- `/admin/*` — all admin operations (registration approvals, design reviews, catalog CRUD, order management, wallet)
- `/user/*` — client-specific operations (profile CRUD)
- `/orders` — place and list orders (multipart: payment proof upload)
- `/wallet` — client wallet top-up
- `/design-submissions` — submit and list custom design submissions
- `/designs/my` — list client's approved designs (for order form dropdown)
- `/designs/verify` — verify a design code
- `/templates` — template library
- `/uploads` — file upload endpoints (Multer → Supabase storage bucket `printing-assets`)
- `/products`, `/variants`, `/pricing` — catalog and dynamic pricing

### Dynamic Pricing System

Products → ProductVariants → OptionGroups → OptionValues → VariantPricing

`VariantPricing` rows use a `combination_key` (JSON) to encode which option value combination applies to a given price. When calculating price, the client posts selected option values and the backend matches against stored combination keys.

### Admin App: API Proxy Pattern

The admin Next.js app has API routes under `admin/src/app/api/admin/` that act as a proxy layer — they call the Express backend. Admin UI pages talk to these Next.js API routes, not the backend directly. Auth state for the admin is managed separately from the client.

### Client App: Zustand Auth State

Global auth state lives in `Client/src/store/authStore.ts`. Route groups use Next.js App Router layout-level auth guards:
- `(public)/` — unauthenticated pages (login, register, contact)
- `(client)/` — protected pages (orders, services, templates, profile)

### File Uploads

Multer is configured in `server/src/utils/file-upload.ts` for multipart form data. Files are stored in the Supabase `printing-assets` bucket via the Supabase client in `server/src/utils/supabase.ts`.

## Environment

Backend requires `server/.env` with:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `DIRECT_URL` — Supabase direct connection (for Prisma migrations)
- `JWT_SECRET`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`
- `SMTP_EMAIL`, `SMTP_PASSWORD` — Gmail credentials for Nodemailer

After schema changes in `server/prisma/schema.prisma`, always run `npm run prisma:generate` before starting the server.

## Key Implementation Details

### Registration Flow
1. Client submits `POST /api/v1/register-request` — validated for 10-digit phone, valid email format
2. Duplicate checks: same phone (any status), same email (active client), same business name (PENDING/APPROVED)
3. Admin approves → client account + wallet created atomically; `sendClientCredentials` email sent
4. Client code format: `MP` + 8 random alphanumeric chars (no dashes)

### Design Submission Flow
1. Client uploads file via `POST /api/v1/design-submissions` (multipart, Bearer token)
2. Admin reviews at `/design-approval` → approve creates `ApprovedDesign` with `designCode` (format: `DSN-YYYY-XXXXXX`)
3. `sendDesignApproved` email sent with the design code
4. Rejected → `sendDesignRejected` email with feedback message

### Password Reset
- Admin resets from Clients page → `POST /api/v1/admin/clients/:id/reset-password`
- Sends `sendPasswordReset` email (NOT the welcome/credentials email) with owner name, phone, new password

### Order Creation Flow
1. Client selects product → variant → options → quantity
2. Design dropdown auto-filters to only show approved designs matching the selected product name (title substring match)
3. Proceeds to payment step — uploads proof screenshot/PDF
4. `POST /api/v1/orders` as multipart FormData

### Notification System (Admin)
- `admin/src/app/api/admin/dashboard/stats` aggregates: `active_orders`, `total_orders`, `pending_registrations`, `pending_designs`, `total_clients`
- Header bell badge + sidebar item badges (Registration Requests, Designs) both fetch this every 15 seconds
- Also refreshed on `visibilitychange` (tab focus) and immediately via `window.dispatchEvent(new Event('stats-updated'))` after any approve/reject action
- Pages that dispatch: `registration-requests/page.tsx` and `design-approval/page.tsx`

### Email (Nodemailer + Gmail SMTP)
All emails are fire-and-forget (non-blocking `.catch()`). Functions in `server/src/utils/email.ts`:
- `sendClientCredentials` — welcome email on registration approval
- `sendPasswordReset` — password reset (uses owner name, not "Welcome")
- `sendDesignApproved` — design code notification
- `sendDesignRejected` — rejection with feedback

### Client-Side Design Management
- **My Designs tab**: `/templates?tab=mydesigns` — `useSearchParams` reads `tab` param; shows all submissions with status badges and design codes for approved ones
- **Profile dropdown** (Navbar "P" button): Profile → Order History → My Designs → Logout
- **Order form design dropdown**: filtered by product name match; resets when product changes

### Admin Sidebar
Operations: Dashboard · Registration Requests (badge) · Clients · Designs (badge) · Wallet · Orders
Catalog: Pricing

Badges on Registration Requests and Designs show live pending counts.

### Image Rendering
Both `Client/next.config.ts` and `admin/next.config.ts` have `remotePatterns` for:
- `*.supabase.co` — uploaded files
- `images.unsplash.com` / `unsplash.com` — placeholder images
- `lh3.googleusercontent.com` — (admin only)

### Global Error Handling
`server/src/middleware/error.middleware.ts` handles:
- `Prisma.PrismaClientKnownRequestError` P2002 → 400 with field name
- P2025 → 404 "Record not found"
- `AppError` → status from error
- Unhandled → 500

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
