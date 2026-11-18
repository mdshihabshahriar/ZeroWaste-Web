# ZeroWaste: Food Rescue Network (Web / Backend API)

ZeroWaste connects people who have **surplus food** with the people who can **collect it** and the people who **need it**. A donor posts food, a volunteer picks it up, and a receiver (NGO, orphanage, shelter or family) confirms it arrived. An admin verifies users and removes unsafe posts.

This repository is the **web version** of the project: a REST API built with **NestJS**, **TypeORM** and **PostgreSQL**. It is tested through Swagger UI and Postman.

| | |
|---|---|
| **Course** | 00930, Advance Web Technology |
| **University** | American International University-Bangladesh (AIUB), Department of Computer Science |
| **Semester / Section** | Fall 2026-27, Section D |
| **Submitted to** | Sultanul Arifeen Hamim |
| **Team** | Group 5 |

---

## Table of contents

1. [Features](#features)
2. [How a donation works](#how-a-donation-works)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [Scripts](#scripts)
8. [API overview](#api-overview)
9. [Roles and permissions](#roles-and-permissions)
10. [Business rules](#business-rules)
11. [Testing](#testing)
12. [Team and responsibilities](#team-and-responsibilities)
13. [Git workflow](#git-workflow)
14. [Known limitations](#known-limitations)

---

## Features

**Donor** (restaurants, event venues, households)
- Post surplus food with quantity, address, coordinates and a pickup deadline (photo is optional)
- Edit or cancel a post while it is still `POSTED`
- See donation history and rate the volunteer

**Volunteer**
- Search nearby available food, sorted by distance
- Accept a pickup (the first volunteer wins)
- Mark the food as `PICKED_UP` and `DELIVERED`
- See delivery history and rate the donor

**Receiver** (NGOs, orphanages, shelters, families)
- Browse available food and send a request
- Confirm receipt of the delivery
- Keep an organisation profile (name, type, capacity) for admin verification

**Admin**
- Verify, reject, ban and unban users
- Handle reports and remove fake or unsafe posts
- View platform statistics and the audit log

**Platform**
- JWT login with refresh-token rotation
- Role-based access control (donor, volunteer, receiver, admin)
- In-app notifications and status history for every donation
- Rate limiting, Helmet, input validation, Swagger documentation

---

## How a donation works

```
ADMIN      verifies donor and receiver accounts
   |
DONOR      creates a food post                          POSTED
   |
RECEIVER   requests the post (first request is kept)
   |
VOLUNTEER  accepts the pickup (first volunteer wins)    ACCEPTED
   |
VOLUNTEER  collects the food from the donor             PICKED_UP
   |
VOLUNTEER  hands it over to the receiver                DELIVERED
   |
RECEIVER   confirms receipt
   |
DONOR <--> VOLUNTEER   rate each other
```

Other end states: `EXPIRED` (nobody accepted before the deadline), `CANCELLED` (donor cancelled), `REMOVED` (admin removed the post).

| From | To | Done by |
|---|---|---|
| `POSTED` | `ACCEPTED` | Volunteer |
| `POSTED` | `CANCELLED` | Donor |
| `POSTED` | `EXPIRED` | System (after the deadline) |
| `POSTED`, `ACCEPTED`, `PICKED_UP` | `REMOVED` | Admin |
| `ACCEPTED` | `PICKED_UP` | The volunteer who accepted |
| `PICKED_UP` | `DELIVERED` | The same volunteer |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| Database | PostgreSQL |
| ORM | TypeORM (entities, `autoLoadEntities`) |
| DB client | DBeaver |
| Auth | JWT, Passport, bcrypt |
| Validation | class-validator, class-transformer |
| API docs | Swagger (`@nestjs/swagger`) |
| Security | Helmet, `@nestjs/throttler` (rate limiting) |
| Scheduling | `@nestjs/schedule` (expiry of overdue posts) |
| Deployment | Vercel (API) and Neon (PostgreSQL) |

---

## Project structure

```
src/
├── main.ts                    # app bootstrap, Swagger, Helmet, validation
├── app.module.ts              # TypeORM connection and module imports
├── common/                    # decorators, guards, pagination helper
│   ├── decorators/            # @Roles, @CurrentUser, @Public
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── dto/                   # PaginationDto
│   └── helpers/               # paginated() response helper
├── auth/                      # register, login, refresh, logout, me
├── users/                     # User entity
├── receiver-profiles/         # organisation profile of receivers
├── food-posts/                # donor posts (create, edit, cancel, history)
├── status-history/            # log of every status change
├── notifications/             # in-app notifications
├── ratings/                   # donor <-> volunteer ratings
├── reports/                   # users report fake or unsafe posts
├── admin/                     # user management, moderation, statistics
├── audit-logs/                # record of admin actions
├── scheduler/                 # expiry job for overdue posts
├── uploads/                   # optional photo upload
└── database/seed.ts           # admin account and optional demo data
```

Pattern used in every module: **Controller → Service → Repository (TypeORM)**.

---

## Getting started

### Prerequisites

- Node.js 20 or newer
- Git
- PostgreSQL 16 (installed locally, no Docker needed)
- DBeaver (optional, for viewing tables)

### 1. Clone and install

```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

### 2. Create the environment file

macOS / Linux:
```bash
cp .env.example .env
```
Windows (CMD):
```bash
copy .env.example .env
```
Open `.env` and set your own PostgreSQL password and JWT secrets (see [Environment variables](#environment-variables)).

Generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Create an empty database

Every member runs their own local database, so the database name must match `DB_NAME` in `.env` (`zerowaste_db`).

In DBeaver: connect to your local PostgreSQL (`localhost:5432`, user `postgres`), open a SQL editor on the `postgres` connection and run:

```sql
CREATE DATABASE zerowaste_db;
```

Or from a terminal: `psql -U postgres -c "CREATE DATABASE zerowaste_db;"`

### 4. Start the server

```bash
npm run start:dev
```

TypeORM creates all tables automatically on the first start. In DBeaver, open `zerowaste_db → Schemas → public → Tables` and press **F5** to see them:

`users`, `receiver_profiles`, `food_posts`, `food_requests`, `status_history`, `notifications`, `ratings`, `reports`, `audit_logs`

### 5. Create the admin account (and optional demo data)

```bash
npm run seed          # creates the admin account only
npm run seed:demo     # admin + demo users + about 5,000 demo posts
```

The admin email and password come from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env`. Demo users are for local testing only:

| Role | Email | Password |
|---|---|---|
| Donor | `donor1@demo.local` | `password123` |
| Volunteer | `volunteer1@demo.local`, `volunteer2@demo.local` | `password123` |
| Receiver | `receiver1@demo.local` | `password123` |

Running the seed twice does not create duplicates. Never run `seed:demo` on a public database.

### 6. Open Swagger

**http://localhost:3000/**

1. Call `POST /auth/login` and copy the `accessToken`
2. Click **Authorize**, paste the token (without the word `Bearer`)
3. Protected routes now work

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default `3000`) |
| `DB_HOST` | Local | PostgreSQL host, usually `localhost` |
| `DB_PORT` | Local | Usually `5432` |
| `DB_USER` | Local | Usually `postgres` |
| `DB_PASSWORD` | Local | Your PostgreSQL password |
| `DB_NAME` | Local | `zerowaste_db` |
| `DATABASE_URL` | Deploy | Full connection string. When set, it replaces the `DB_*` values (used on Vercel with Neon) |
| `DB_SYNC` | No | `true` or `false`. Defaults to `true` locally and `false` when `DATABASE_URL` is used |
| `JWT_SECRET` | Yes | Secret for access tokens |
| `JWT_EXPIRES_IN` | Yes | Access token lifetime, e.g. `15m` |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens (different from `JWT_SECRET`) |
| `JWT_REFRESH_EXPIRES_IN` | Yes | Refresh token lifetime, e.g. `7d` |
| `ADMIN_EMAIL` | Seed | Admin login email |
| `ADMIN_PASSWORD` | Seed | Admin login password |
| `CRON_SECRET` | Deploy | Protects the expiry cron endpoint |

Photo upload settings (if you use a cloud storage service) are listed in `.env.example`.

> Never commit `.env`. Only `.env.example` (without real secrets) goes to Git.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Start in watch mode (local development) |
| `npm run build` | Compile the project (run this before pushing) |
| `npm run start:prod` | Run the compiled build |
| `npm run seed` | Create the admin account |
| `npm run seed:demo` | Admin + demo users and demo posts |
| `npm run test` | Run unit tests |

---

## API overview

Swagger at `/` is the source of truth for every route, request body and response. The table below lists the main groups.

### Auth

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register as donor, volunteer or receiver |
| POST | `/auth/login` | Public | Login, returns access and refresh tokens |
| POST | `/auth/refresh` | Public | Get a new token pair (old refresh token stops working) |
| POST | `/auth/logout` | Logged in | Revoke the refresh token |
| GET | `/auth/me` | Logged in | Current user |

Example register body:
```json
{
  "name": "Rahim Uddin",
  "email": "rahim@example.com",
  "password": "secret123",
  "role": "donor",
  "phone": "01712345678",
  "address": "Mirpur 10, Dhaka",
  "latitude": 23.8069,
  "longitude": 90.3687
}
```
`role` can only be `donor`, `volunteer` or `receiver`. Admin accounts are created by the seed script only.

### Receiver profile

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/receiver-profiles/me` | Receiver | View own organisation profile |
| PUT | `/receiver-profiles/me` | Receiver | Create or update it |

### Reports

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/reports` | Donor, Volunteer, Receiver | Report a fake or unsafe post |

### Admin

| Method | Route | Purpose |
|---|---|---|
| GET | `/admin/users` | List users (filter by `role`, `isVerified`, `isActive`, `search`) |
| GET | `/admin/users/pending` | Donors and receivers waiting for verification |
| PATCH | `/admin/users/:id/verify` | Verify a donor or receiver |
| PATCH | `/admin/users/:id/reject` | Reject an unverified account |
| PATCH | `/admin/users/:id/ban` | Ban a user |
| PATCH | `/admin/users/:id/unban` | Unban a user |
| GET | `/admin/reports` | List reports (`?status=OPEN`) |
| PATCH | `/admin/reports/:id` | Mark a report `RESOLVED` or `DISMISSED` |
| GET | `/admin/posts` | List posts (`?status=...`) |
| PATCH | `/admin/posts/:id/remove` | Remove a post with a reason |
| GET | `/admin/stats` | Users, posts, meals saved, active volunteers |

### Donations (food posts, nearby search, pickup, requests, ratings, notifications)

These routes are grouped by tag in Swagger. In short: donors create and manage posts, volunteers search nearby posts and update pickup status, receivers request food and confirm receipt, and users can read their notifications and rate each other after delivery.

List endpoints are paginated: `?page=1&limit=20`.

---

## Roles and permissions

| Action | Donor | Volunteer | Receiver | Admin |
|---|:--:|:--:|:--:|:--:|
| Register / login | ✅ | ✅ | ✅ | ✅ |
| Create food post | ✅ (verified) | ❌ | ❌ | ❌ |
| Search nearby food | ❌ | ✅ | ✅ | ❌ |
| Accept pickup, update status | ❌ | ✅ | ❌ | ❌ |
| Request food, confirm receipt | ❌ | ❌ | ✅ (verified) | ❌ |
| Rate after delivery | ✅ | ✅ | ❌ | ❌ |
| Report a post | ✅ | ✅ | ✅ | ❌ |
| Verify / ban users, remove posts | ❌ | ❌ | ❌ | ✅ |
| View statistics and audit log | ❌ | ❌ | ❌ | ✅ |

Volunteers are verified automatically. Donors and receivers must be verified by an admin before they can post or request.

---

## Business rules

1. **First volunteer wins.** Accepting a post is one conditional `UPDATE ... WHERE status = 'POSTED'`, so two volunteers cannot take the same post.
2. **First receiver request is kept.** Another receiver cannot claim the same food.
3. **Only the accepting volunteer** can mark a post `PICKED_UP` or `DELIVERED`, and only in the correct order.
4. **Receipt is confirmed** by the receiver after the volunteer marks `DELIVERED`.
5. **Ratings:** donor and volunteer rate each other once per post, score 1 to 5, only after `DELIVERED`, never themselves.
6. **Privacy:** a donor's exact address and phone are shown only to the volunteer who accepted the post.
7. **Expiry:** a post nobody accepted before its deadline becomes `EXPIRED`.
8. **Audit:** every admin action (verify, reject, ban, report handling, post removal) is written to `audit_logs`.
9. **Every status change** is stored in `status_history` with the user and time.

---

## Testing

**Swagger:** open `/`, login, press **Authorize**, then try the routes.

**Postman:**
1. Create an environment with `baseUrl = http://localhost:3000`, `accessToken`, `refreshToken`
2. On the login request, open **Scripts → Post-response** and add:
   ```js
   if (pm.response.code === 200) {
     const res = pm.response.json();
     pm.environment.set("accessToken", res.accessToken);
     pm.environment.set("refreshToken", res.refreshToken);
   }
   ```
3. On other requests use **Authorization → Bearer Token → `{{accessToken}}`**

**Quick checks**

| Test | Expected |
|---|---|
| Protected route without a token | `401` |
| Donor token on `/admin/stats` | `403` |
| Register with `"role": "admin"` | `400` |
| Same email registered twice | `409` |
| Use an old refresh token after `/auth/refresh` or `/auth/logout` | `401` |
| Two volunteers accept the same post | One succeeds, the other gets `409` |
| Unverified donor creates a post | `403` |

**Unit tests:** `npm run test`

---

## Deployment (Vercel + Neon)

The API runs on Vercel, the database on Neon (PostgreSQL).

1. **Create the database** on Neon and copy the **pooled** connection string.
2. **Create the tables once** from your computer: put `DATABASE_URL` and `DB_SYNC=true` in your local `.env`, run `npm run start:dev` once, then run `npm run seed`. Remove both lines from `.env` afterwards.
3. **Push to GitHub** and import the repository in Vercel (framework: NestJS).
4. **Add environment variables** in Vercel: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `CRON_SECRET` (and any photo-upload keys). Use new, strong secrets, not your local ones.
5. **Redeploy** after changing variables.

If a request fails with `500 FUNCTION_INVOCATION_FAILED`, open **Vercel → Logs** and read the runtime error (usually a missing environment variable or a wrong `DATABASE_URL`).

---

## Team and responsibilities

| Student | ID | Responsibility |
|---|---|---|
| MD. Shihab Shahriar | 23-54893-3 | Core setup, authentication, roles, admin module, audit log |
| Monami Maymuna | 23-54885-3 | Donor module, status history, notifications, ratings, expiry job |
| Alif Shahriar Likhan | 23-53530-3 | Nearby search, accept lock, pickup and delivery updates, receiver requests |

---

## Git workflow

- Do not push directly to `main`. Create one branch per feature: `feature/auth`, `feature/food-posts`, `feature/pickups`.
- Open a Pull Request and ask a teammate to review before merging.
- Start every day with `git pull origin main`.
- Each member edits only the entities of their own modules to avoid merge conflicts.
- Run `npm run build` before pushing so build errors are caught locally.
- After pulling, run `npm install` again if `package.json` changed.

---

## Known limitations

- This is a backend API only. There is no web or mobile front end yet.
- After logout, an already issued access token stays valid until it expires (15 minutes by default). The refresh token is revoked immediately.
- On Vercel's free plan, scheduled jobs can run only once a day, so overdue posts are expired by a daily cron and are also excluded from search results by their deadline.
- Coordinates are sent by the client. There is no address-to-coordinates conversion on the server.
- Real-time notifications, chat and map views are future work.