---
name: backend-optimization
description: >
  Production-grade performance, caching, and real-time architecture guide for a
  printing services e-commerce platform. Stack: Next.js + Express on Vercel,
  Supabase Postgres as the database, Redis for backend caching, IndexedDB for
  client-side persistent storage, and React Query for live data. Trigger this
  skill whenever the user asks about: making the site faster, caching strategy,
  IndexedDB setup, React Query configuration, Redis usage, polling or real-time
  updates, connection pooling, admin or client dashboard data loading, order
  notifications, wallet transactions, product catalog storage, variant fetching,
  pre-order validation, security hardening, or handling large-scale traffic.
  Also trigger when the user says things like "how do I make this load faster",
  "the admin panel does not update in real time", "how should I store X",
  "how do I cache Y", or "my API is slow". This skill defines the entire data
  strategy for the platform — always consult it before writing any data
  fetching, caching, or storage logic.
---

# Backend Optimization
## Printing Services Platform — Production Grade Guide

---

## The One Rule That Overrides Everything Else

**The database (Supabase Postgres) is always the source of truth.**
Redis, IndexedDB, and React Query are speed layers — they make the site feel
instant, but they are never trusted for anything that involves money, order
creation, or security. Before any order is placed or any payment is processed,
the real data must always be re-confirmed from the database, server-side,
no exceptions.

---

## Stack at a Glance

- **Database:** Supabase (Postgres) — the only authoritative source of data
- **Backend API:** Next.js API routes + Express, hosted on Vercel
- **Backend Cache:** Redis (Upstash) — sits between the API and the database
- **Client Persistent Store:** IndexedDB — survives page refreshes, works offline
- **Client Live Cache:** React Query — manages fresh, real-time data in memory
- **Real-Time Updates:** Polling — both admin and client panels continuously check for new data

The goal is simple: the user should never wait. Data should already be there
before they ask for it, and when it changes, every panel should know immediately
without anyone needing to refresh the page.

---

## Caching Layer 1 — Redis (Backend)

Redis sits on the server. Every time a client or admin makes an API request,
the server checks Redis first before touching the database. If the answer is
already in Redis, it returns instantly. If not, it fetches from the database,
stores the result in Redis for next time, and returns it.

**What lives in Redis and for how long:**

- Product catalog (full list) — 10 minutes
- Product variants for a specific product — 5 minutes
- Pricing for a specific variant — 2 minutes (prices change often, keep it short)
- Free design templates — 15 minutes (they rarely change)
- A specific user's order history — 1 minute
- A specific user's wallet and top-up history — 30 seconds (money is sensitive)
- Admin order list — 30 seconds
- Admin client transaction list — 15 seconds

**When something changes in the database, the relevant Redis entry must be
deleted immediately.** For example, if an admin updates a price, the Redis
entry for that price must be cleared so the next request gets the real value.
Never let stale data sit in Redis after a mutation.

**Redis keys must always include the user ID for user-specific data.** This
prevents one user's cached data from being accidentally served to another.

---

## Caching Layer 2 — IndexedDB (Client Portal Only)

IndexedDB lives in the user's browser. It survives page refreshes and even
browser restarts. Use it for data that is large, relatively stable, and needed
immediately when the page loads — so the page appears fully loaded before any
network request completes.

**What is stored in IndexedDB (Client Dashboard only):**

- Full product catalog (names, descriptions, categories, thumbnail image URLs)
- Free design templates (the library of templates available to all users)

**How IndexedDB loading works:**

1. When the client portal loads for the first time, fetch the full catalog and
   templates from the API and write them into IndexedDB.
2. On every subsequent load, read from IndexedDB first and display immediately —
   the page should feel instant.
3. In the background, silently check the API for any updates since the last sync.
   If new or changed items exist, update IndexedDB and refresh the display.
4. If a new product is added or a template is published by an admin, the client's
   next background sync will pick it up automatically.

**IndexedDB is for client portal only.** The admin dashboard does not use
IndexedDB at all.

---

## Caching Layer 3 — React Query (Both Dashboards)

React Query manages data that needs to be live, accurate, and always fresh.
It keeps data in memory, knows when it is stale, and automatically re-fetches
in the background without the user doing anything. It is used for anything that
changes frequently or requires near-real-time accuracy.

**What is stored in React Query:**

Client Dashboard:
- Product variants (specific options under each product — size, paper type, finish, etc.)
- Pricing for each variant
- The user's own saved or custom designs
- Order history
- Wallet balance and transaction history
- Wallet Top-up history

Admin Dashboard (everything goes here, no IndexedDB):
- All orders across all clients
- Client transaction and top-up requests
- Pricing configuration
- Client accounts and profiles
- Revenue and analytics summaries
- Product catalog (admin version with full edit access)
- New registration notifications

**How React Query freshness works by data type:**

- Wallet and transaction data: treat as stale after 15 to 30 seconds, always
  re-fetch when the user switches back to the tab.
- Order history: treat as stale after 30 seconds.
- Pricing: treat as stale after 2 minutes, always re-fetch on tab focus.
- Product variants: treat as stale after 5 minutes.
- Admin orders and transaction requests: treat as stale after 30 seconds.
- Design templates and catalog: treat as stale after 10 minutes.

The rule of thumb: the closer the data is to money or user action, the shorter
the stale time. The more static the data, the longer the stale time.

---

## Real-Time Polling — Both Dashboards

This is what solves the problem of the admin panel not updating when a new
client registers or a new order comes in.

**Every panel — both admin and client — must poll the server continuously.**
Polling means the app automatically re-fetches specific data every few seconds
in the background, without any user action.

**What to poll and how often:**

Admin dashboard:
- New orders: every 15 seconds
- New client registrations: every 20 seconds
- New transaction or top-up requests: every 15 seconds
- Wallet activities: every 20 seconds

Client dashboard:
- Order status updates: every 10 seconds (so they see when their order is confirmed or printed)
- Wallet balance: every 10 seconds (so top-ups reflect immediately)
- Notifications: every 30 seconds

**How polling must behave:**
- Polling runs silently in the background. The user should never see a loading
  spinner for a background poll — only for their own direct actions.
- Polling pauses when the user's tab is in the background or the device is
  offline, to avoid wasting resources.
- Polling resumes the moment the user returns to the tab.
- When polled data changes (for example, a new order appears), the UI updates
  automatically without any page refresh.
- Notifications in the admin panel such as "new client registered" or "new
  order received" are driven by polling, not by the user manually refreshing.

React Query's built-in polling feature handles all of the above behaviors
automatically when configured properly. This is the correct tool for this.

---

## Pre-Order Validation — Critical Security Step

Before any order is created, the server must re-check the real price from the
database and compare it against what the client submitted.

This is necessary because the client's React Query cache may be slightly stale,
a bad actor could manipulate the price in the browser, and prices might have
changed between when the user loaded the page and when they clicked "place order."

**The validation flow must work like this:**

1. User clicks "Place Order" on the client portal.
2. The client sends the order details — items, quantities, and the prices as
   shown to the user — to the API.
3. The API fetches the real current prices from the database, bypassing any cache.
4. The API compares the submitted prices to the real prices.
5. If they match: proceed to create the order.
6. If they do not match: reject the order, return the updated prices, and tell
   the client to review the new prices before trying again.
7. The order record is only written to the database after this check passes.

Never skip this step. Never trust prices from the client. Never use cached
prices for the final order calculation.

---

## Connection Pooling — Database Connections

Because the backend runs on Vercel (serverless), many function instances can
run at the same time, each trying to open its own connection to the database.
Without pooling, this will overwhelm Postgres and cause slowdowns or failures
under load.

**The fix:** Use Supabase's built-in connection pooler (PgBouncer) in
Transaction Mode. This means all API requests share a pool of pre-opened
database connections instead of each one creating a new connection from scratch.

**The rules:**
- Always connect using the pooler connection string (port 6543), not the
  direct database connection (port 5432).
- Never use session-level Postgres features such as prepared statements or
  advisory locks through the pooler — they do not survive transaction pooling.
- For complex analytics queries that need a persistent connection, use a
  dedicated background process or a Supabase Edge Function, not the main
  serverless API.
- Keep the maximum number of connections per server instance low (5 to 10).
  Serverless functions scale horizontally — each instance should request few
  connections, not many.

---

## Security Rules — Non-Negotiable

These rules must be followed on every route, every time, without exception.

1. Every admin route must verify that the requesting user is an admin before
   doing anything. If the check fails, return a 403 error immediately.

2. Every client route that touches user-specific data must verify that the
   requesting user owns that data. A client must never be able to see another
   client's orders, wallet, or designs by guessing a different user ID.

3. Row Level Security must be enabled in Supabase on every table. Even if the
   Express middleware checks permissions, Supabase RLS is a second line of
   defense that prevents data leaks if the middleware is ever bypassed.

4. The Supabase service role key must never leave the server. It must not
   appear in frontend code, environment variables exposed to the browser, or
   API responses.

5. Prices from the client are never trusted. Always re-validate server-side
   before creating an order (see Pre-Order Validation above).

6. Redis cache keys for user data must always include the user ID. A generic
   key is dangerous because it might return one user's data to another. Always
   namespace keys with the user ID.

7. Rate limiting must be applied to all write endpoints — order creation, top-up
   requests, and registration — to prevent abuse and protect against denial of
   service attacks.

8. IndexedDB data on the client is untrusted. Never use it to make security or
   pricing decisions. It is a display layer only.

---

## Performance Goals

The platform must load and feel instant for millions of concurrent users. Every
architectural decision should be measured against these targets:

- Initial page load on the client portal: under 1 second, served from IndexedDB
- Any data that is already in Redis: returned in under 50 milliseconds
- Any data fetched fresh from the database: returned in under 300 milliseconds
- Polling updates must appear in the UI within the poll interval, with no page refresh
- Order placement including pre-order validation: under 1 second end-to-end
- The admin panel must reflect new registrations, orders, and transactions
  within 5 to 10 seconds automatically, with no manual refresh

---

## Decision Guide — Where Does Each Piece of Data Live?

When implementing any data feature, ask these questions in order:

1. Is this data static or semi-static and needed on first render?
   Store it in IndexedDB (client portal only). Examples: catalog, templates.

2. Is this data user-specific, live, or changes frequently?
   Use React Query. Examples: variants, pricing, order history, wallet, designs.

3. Is this an admin-facing dataset?
   Use React Query only. No IndexedDB for admin data.

4. Can this API response be safely cached server-side?
   Add a Redis cache layer with an appropriate TTL. When the underlying data
   changes, invalidate the Redis key immediately.

5. Does this data involve money, order creation, or security decisions?
   Always re-fetch from the database directly. No cache. No client data trusted.

---

