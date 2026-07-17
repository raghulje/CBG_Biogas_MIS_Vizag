# CBG Biogas MIS — Vizag (SREL)

Enterprise **Management Information System (MIS)** for the **Industrial Biogas / CBG plant** at Vizag (SREL), built for **Refex**.

This monorepo contains a **React + Vite + MUI** SPA and a **Node.js + Express + Sequelize + MySQL** API. Operators capture daily plant data; managers review and approve; admins manage users, email templates, SMTP, schedulers, and audit trails. Dashboards and Final MIS reports turn approved entries into operational insights and scheduled email delivery.

**Repository:** [github.com/raghulje/CBG_Biogas_MIS_Vizag](https://github.com/raghulje/CBG_Biogas_MIS_Vizag)

---

## Table of contents

- [What is included](#what-is-included)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Application modules](#application-modules)
- [MIS workflow](#mis-workflow)
- [Project structure](#project-structure)
- [API overview](#api-overview)
- [Database & migrations](#database--migrations)
- [Email, SMTP & schedulers](#email-smtp--schedulers)
- [UI and UX conventions](#ui-and-ux-conventions)
- [Production notes](#production-notes)
- [Troubleshooting](#troubleshooting)
- [Scripts reference](#scripts-reference)
- [Security](#security)
- [Contributing](#contributing)

---

## What is included

| Area | Path | Description |
|------|------|-------------|
| **Web client** | `client/` | React 19 SPA — login, dashboard, MIS entry, Final MIS, customers, admin, notifications |
| **API server** | `server/` | Express REST API, JWT auth, Sequelize models, cron schedulers, Nodemailer |
| **UI reference screenshots** | `images/` | Module screenshots for documentation and onboarding |
| **Docker compose** | `docker-compose.yml` | Sample Node container wiring for UAT-style deploys |

### Main product capabilities

| Capability | Description |
|------------|-------------|
| **Daily MIS entry** | Multi-section form: raw materials, feed mixing, digesters, SLS, biogas, utilities, HSE, manpower, availability, remarks |
| **Approval workflow** | Draft → Submit → Approve / Reject with permission checks and email notifications |
| **Dashboard** | Period filters (day / week / month / quarter / year / custom), KPIs, trends, operations overview |
| **Final MIS report** | Consolidated plant report with date filters and Excel export |
| **Customer master** | CBG customer CRUD used by sales-related MIS fields |
| **Admin panel** | Users & permissions, activity/session logs, email templates, SMTP, Final MIS report config, theme presets |
| **In-app notifications** | Notification schedules and recipient configuration |
| **Auditability** | User activity logs and email delivery logs |

---

## Screenshots

Screenshots live in [`images/`](./images/). Use them for demos, QA, and stakeholder walkthroughs.

### Login

![Login page](images/Login_Page.png)

### Dashboard

![Dashboard](images/Dashboard.png)

### MIS Entry — list

![MIS Entry list](images/MIS%20Entry%20List%20View.png)

### MIS Entry — form sections

| Screen | Preview |
|--------|---------|
| Entry form (1) | ![Entry form 1](images/EntryForm_1.png) |
| Entry form (2) | ![Entry form 2](images/EntryForm_2.png) |
| Entry form (3) | ![Entry form 3](images/EntryForm_3.png) |
| Entry form (4) | ![Entry form 4](images/EntryForm_4.png) |
| Entry form (5) | ![Entry form 5](images/EntryForm_5.png) |
| Entry form (6) | ![Entry form 6](images/EntryForm_6.png) |
| Entry form (7) | ![Entry form 7](images/EntryForm_7.png) |

### Final MIS report

![Final MIS report](images/FinalMIS_Report.png)

### Customer master

![Customer master](images/Customer_Master.png)

![Customer creation](images/Customer_Creation_Form.png)

### Admin & email

| Screen | Preview |
|--------|---------|
| Admin — users | ![Admin users](images/AdminPanel_User_List.png) |
| Create user | ![Create user](images/Create_User_Form.png) |
| Email templates | ![Email templates](images/Email_Templates_list.png) |
| Email recipients | ![Email recipients](images/Email_Recepients_Config.png) |
| MIS entry schedulers | ![MIS schedulers](images/MIS_Entry_Daily_Schedulers.png) |
| MIS report scheduler | ![Report scheduler](images/MIS_Report_Scheduler.png) |
| Scheduler recipients | ![Scheduler recipients](images/Scheduler_Recepients_1.png) |
| Reviewers / editors | ![Reviewers](images/Reviewers%20%26%20Approved%20Entry%20editors%20.png) |
| Login sessions | ![Sessions](images/Login_Session_log_list.png) |
| User activity log | ![Activity log](images/User_Activity_log.png) |

> Tip: keep filenames stable when replacing screenshots so README links continue to work. See [`images/README.md`](./images/README.md).

---

## Architecture

```mermaid
flowchart TB
    subgraph client [Client — React + Vite]
        UI[Pages & Layout]
        SVC[Axios services]
        AUTH[AuthContext + JWT]
        THEME[themes.ts tokens]
    end

    subgraph server [Server — Express]
        API["/api/* routes"]
        MW[Auth + permission middleware]
        CTRL[Controllers]
        ORM[Sequelize models]
        CRON[node-cron schedulers]
        MAIL[Nodemailer emailService]
    end

    subgraph data [Data]
        DB[(MySQL)]
    end

    UI --> SVC
    SVC --> AUTH
    SVC -->|HTTP JSON| API
    API --> MW
    MW --> CTRL
    CTRL --> ORM
    ORM --> DB
    CRON --> CTRL
    CRON --> MAIL
    CTRL --> MAIL
    THEME --> UI
```

**Runtime flow (local):**

1. Vite serves the SPA on port **3000** and proxies `/api` → `http://localhost:3015`.
2. Express listens on **3015** (override with `PORT` in `server/.env`).
3. Authenticated requests send a Bearer JWT; refresh tokens extend sessions.
4. Schedulers (MIS reminders, Final MIS report emails) run inside the Node process via `node-cron`.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19, TypeScript, Vite 7 |
| UI | MUI 5, MUI X Date Pickers 8, Emotion |
| Forms | React Hook Form |
| HTTP | Axios |
| Toasts | Notistack |
| Styling extras | Tailwind 3 (utility support), design tokens in `themes.ts` |
| Backend | Node.js, Express 4 |
| ORM | Sequelize 6 + Umzug migrations |
| Database | MySQL 8 (via `mysql2`) |
| Auth | JWT access + refresh, bcrypt passwords |
| Email | Nodemailer (SMTP stored in DB / env defaults) |
| Jobs | `node-cron` |
| Excel | `xlsx` (import / export) |
| Process manager (optional) | PM2 |

---

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **npm**
- **MySQL** 8.x reachable from the server host
- Git

Optional:

- Docker + an external proxy network (see `docker-compose.yml`)
- SMTP credentials for outbound email in non-dev environments

---

## Quick start

### 1. Clone

```bash
git clone https://github.com/raghulje/CBG_Biogas_MIS_Vizag.git
cd CBG_Biogas_MIS_Vizag
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Edit `server/.env` — at minimum set:

```env
PORT=3015
DB_HOST=localhost
DB_PORT=3306
DB_NAME=biogas_mis
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=change_me_to_a_long_random_string
JWT_REFRESH_SECRET=change_me_to_another_long_random_string
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
SERVE_CLIENT=false
```

For Indian plant “calendar day / 09:00” scheduling on a UTC VM:

```env
TZ=Asia/Kolkata
```

### 3. Install & prepare the database

```bash
# from server/
npm install
npm run migrate:up
```

Seed users/roles (destructive — only for empty/dev DBs):

```bash
# Windows PowerShell
$env:ALLOW_FORCE_SYNC="true"; npm run seed

# bash
ALLOW_FORCE_SYNC=true npm run seed
```

Or use the helper that creates the DB then seeds:

```bash
ALLOW_FORCE_SYNC=true npm run init-db
```

### 4. Start the API

```bash
npm run dev
# or: npm start
```

API base: `http://localhost:3015/api`

### 5. Start the client

```bash
cd ../client
npm install
npm run dev
```

Open the URL Vite prints (default **http://localhost:3000**). API calls to `/api` are proxied to port **3015**.

### 6. Sign in (seeded defaults)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@biogas.com` | `Admin@123` |
| Manager | `manager@biogas.com` | `User@123` |
| Operator | `operator@biogas.com` | `User@123` |

> Change these passwords immediately in any shared or production environment.

---

## Environment variables

### Server (`server/.env`)

Documented template: [`server/.env.example`](./server/.env.example).

| Variable | Purpose |
|----------|---------|
| `PORT` | API listen port (default `3015`) |
| `HOST` | Bind address (default `0.0.0.0`) |
| `NODE_ENV` | `development` / `production` |
| `TZ` | Process timezone for schedulers & “yesterday” logic |
| `SERVE_CLIENT` | When `true`, Express serves the built SPA |
| `DB_*` | MySQL connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing |
| `JWT_EXPIRY` / `JWT_REFRESH_EXPIRY` | Token lifetimes |
| `CORS_ORIGIN` / `FRONTEND_URL` | Browser origin for CORS & links |
| `SMTP_*` | Fallback SMTP if DB config is empty |
| `MIS_NOTIFY_EMAILS` | Extra recipients on MIS submit (comma-separated) |
| `ALLOW_FORCE_SYNC` | Must be `true` to allow destructive `seed` / force sync |

### Client

In **dev**, Axios uses `/api` (Vite proxy). In **production builds**, set:

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Absolute API root, e.g. `https://your-host/api` |

Create `client/.env` locally if needed (do **not** commit it):

```env
VITE_API_URL=http://localhost:3015/api
```

---

## Application modules

### Routes (client)

| Path | Module | Access |
|------|--------|--------|
| `/login` | Login | Public |
| `/reset-password` | Password reset | Public |
| `/dashboard` | Operations dashboard | Authenticated |
| `/mis-entry` | MIS list + create/edit/view form | Permissioned |
| `/final-mis` | Final MIS consolidated report | Permissioned |
| `/customers` | Customer master | Permissioned |
| `/admin` | Admin shell (users, logs, templates, SMTP, report config) | Admin |
| `/admin/notifications` | In-app notification schedules | Admin |

Legacy paths `/consolidated-mis-view`, `/consolidated-mis-v2`, and `/audit-logs` redirect to Final MIS / Admin.

### Login

- Split layout with Refex branding and static CBG plant illustration (`client/src/assets/login-hero.svg`)
- Email / password, remember me, forgot-password dialog
- Enterprise frosted login card on the right

### Dashboard

- Filter toolbar: day, week, month, quarter, year, custom range
- KPI cards with sparklines, production trends, operations overview (fertilizer / utilities / safety)
- Data driven from **approved** MIS entries via dashboard APIs

### MIS Entry

- List view: search, date filters, status chips, import / export
- Form sections with sticky section navigation (Raw Materials → Remarks)
- Status lifecycle: draft, submitted, approved, rejected
- Role actions: submit, approve, reject (permission-gated)

### Final MIS

- Period filters (single day, week, month, quarter, year, custom)
- Sectioned operational report (feeding, quality, digesters, biogas, etc.)
- Export to Excel

### Customer Master

- Searchable customer list and create/edit dialogs for CBG commercial data

### Admin

- Theme preset selector (e.g. Classic Blue)
- Users & page-level permissions (including MIS approve)
- Activity / session logs with date filters
- Email templates (create / edit / activate)
- SMTP settings + test email
- Final MIS report schedule (frequency, send time, recipients, test send)
- Email delivery logs

### Notifications

- Dedicated admin page for notification schedules and recipients

---

## MIS workflow

```mermaid
stateDiagram-v2
    [*] --> Draft: Operator creates
    Draft --> Draft: Save
    Draft --> Submitted: Submit
    Submitted --> Approved: Manager approves
    Submitted --> Rejected: Manager rejects
    Rejected --> Draft: Operator edits & resubmits
    Approved --> [*]
```

1. **Operator** creates a daily entry (`draft`) and saves section data.
2. **Operator** submits → status `submitted` → email to managers / configured recipients.
3. **Manager** (or user with `approve`) approves or rejects → email to operator.
4. **Approved** entries feed Dashboard and Final MIS aggregations.
5. All significant actions are written to activity / audit logs.

---

## Project structure

```
CBG_Biogas_MIS_Vizag/
├── README.md
├── .gitignore
├── docker-compose.yml
├── images/                      # UI screenshots (docs)
│   ├── Login_Page.png
│   ├── Dashboard.png
│   ├── EntryForm_*.png
│   ├── FinalMIS_Report.png
│   ├── AdminPanel_User_List.png
│   └── ...
├── client/
│   ├── package.json
│   ├── vite.config.ts           # Dev server :3000, /api → :3015
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── themes.ts            # Design tokens + MUI + date-picker theme
│   │   ├── assets/              # Logos, login-hero.svg
│   │   ├── components/          # Layout, routes, FilterPanel, ui/*
│   │   ├── context/AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── mis-entry/
│   │   │   ├── final-mis/
│   │   │   ├── customer/
│   │   │   └── admin/
│   │   ├── services/            # auth, mis, admin, customer Axios clients
│   │   └── router/
│   └── out/                     # Vite production build output (gitignored)
└── server/
    ├── package.json
    ├── .env.example
    ├── app.js / server.js
    ├── config/
    ├── controllers/
    ├── middleware/              # JWT + permission checks
    ├── models/                  # Sequelize models (MIS*, User, Email*, …)
    ├── migrations/
    ├── routes/
    ├── services/                # email, schedulers, audit, migrations
    ├── scripts/                 # seed helpers, Excel import utilities
    └── docs/                    # SQL notes for Final MIS / email config
```

---

## API overview

Base path: `/api`

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Logout |
| `GET` | `/auth/profile` | Current user |
| `POST` | `/auth/forgot-password` | Reset link email |

### MIS

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/mis-entries` | List entries |
| `POST` | `/mis-entries` | Create |
| `GET` | `/mis-entries/:id` | Detail |
| `PUT` | `/mis-entries/:id` | Update |
| `POST` | `/mis-entries/:id/submit` | Submit |
| `POST` | `/mis-entries/:id/approve` | Approve |
| `POST` | `/mis-entries/:id/reject` | Reject |
| `GET` | `/mis-entries/for-report` | Report aggregation window |
| `POST` | `/mis/import` | Excel import |
| `GET` | `/dashboard/daily` | Dashboard series / KPIs |

### Customers & admin

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST/PUT` | `/customers` | Customer master |
| `GET/POST/PUT` | `/admin/users` | User administration |
| `GET` | `/admin/email-templates` | Templates |
| `GET/PUT` | `/admin/smtp-config` | SMTP |
| `GET/PUT` | `/admin/final-mis-report-config` | Scheduled report config |
| `GET` | `/admin/email-logs` | Outbound email audit |
| `GET` | `/admin/schedulers` | Scheduler status |

Exact payloads mirror the Sequelize models under `server/models/`. Prefer inspecting Network tab while using the UI, or reading controllers under `server/controllers/`.

---

## Database & migrations

- ORM models: `server/models/`
- Migrations: `server/migrations/` (Umzug runner)

```bash
cd server
npm run migrate:up      # apply pending
npm run migrate:down    # revert last
```

Key domains:

- `MISDailyEntry` + child tables (raw materials, digesters, biogas, utilities, HSE, …)
- `User` / `Role` / `Permission` / `UserPermission`
- `Customer`, `EmailTemplate`, `SMTPConfig`, `FinalMISReportConfig`
- `NotificationSchedule`, `EmailLog`, activity / audit tables

SQL notes for Final MIS and email config also live in `server/docs/`.

---

## Email, SMTP & schedulers

1. Configure **SMTP** in Admin (or env fallbacks).
2. Customize **email templates** (entry missing, not submitted, escalation, etc.).
3. Configure **Final MIS report** schedule: frequency, send time, To/Cc, test date range.
4. Optional **MIS entry reminder** schedulers and recipient lists.
5. Process timezone (`TZ`) controls “yesterday” and wall-clock send times.

Email attempts are recorded in **email logs** for ops troubleshooting.

---

## UI and UX conventions

- **Brand primary:** `#2879B6` (Refex blue); success greens for plant / active states
- **Tokens:** `client/src/themes.ts` (`tokens` + `themePresets`)
- **Controls:** shared heights/radii for inputs, buttons, and date pickers
- **Date fields:** shared `AppDateField` (MUI X) — avoid native browser calendars
- **Layout:** persistent `Layout` chrome (sidebar + topbar) for authenticated pages
- **Density:** dashboards and admin tables aimed at one-screen ops use
- **Login:** static plant hero as soft-edged background; frosted login card

---

## Production notes

1. Build the client:

   ```bash
   cd client
   npm run build
   ```

   Output directory: `client/out/` (see `vite.config.ts` → `build.outDir`).

2. Point the server at the build and enable serving (or put `out/` behind Nginx and keep API separate):

   ```env
   NODE_ENV=production
   SERVE_CLIENT=true
   CORS_ORIGIN=https://your-public-origin
   FRONTEND_URL=https://your-public-origin
   ```

3. Set strong `JWT_*` secrets and real DB / SMTP credentials.
4. Run migrations on deploy: `npm run migrate:up`.
5. Prefer **PM2** or systemd for process supervision; keep a single Node instance (or carefully design multi-instance cron locks) so schedulers do not double-send.
6. Sample Docker wiring: `docker-compose.yml` (expects an external `proxy` network).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login: “Cannot connect to server” | API down or wrong proxy / `VITE_API_URL` | Start `server` on 3015; confirm Vite proxy target |
| Empty dashboard | No **approved** entries in range | Approve MIS entries or widen filters |
| Seed refuses to run | Safety guard | Set `ALLOW_FORCE_SYNC=true` (dev only) |
| Emails not sending | SMTP / template inactive | Admin → SMTP test; check email logs |
| Final MIS email at wrong hour | Timezone | Set `TZ=Asia/Kolkata` (or plant TZ) and restart Node |
| Date picker looks wrong | Old native `type="date"` | Use `AppDateField` / themed MUI X pickers |
| CORS errors | Origin mismatch | Align `CORS_ORIGIN` with the browser origin |
| 401 after idle | Token expired | Refresh flow / re-login |

### Debug tips

1. Browser DevTools → Network: inspect `/api/*` status and payloads.
2. Server console: Morgan logs + scheduler / email errors.
3. Confirm MySQL connectivity with `server/test_db.js` if present.
4. Compare UI screenshots in `images/` when verifying regressions.

---

## Scripts reference

### Client (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build` | Production build → `out/` |
| `npm run preview` | Preview production build |
| `npm run type-check` | TypeScript check |
| `npm run lint` | ESLint |

### Server (`server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Nodemon API |
| `npm start` | Production-style start |
| `npm run migrate:up` | Apply pending migrations |
| `npm run migrate:down` | Revert last migration |
| `npm run seed` | Force-sync + seed (requires `ALLOW_FORCE_SYNC=true`) |
| `npm run init-db` | Create DB + seed |

---

## Security

- **Never commit** `server/.env`, `client/.env`, `server/config/config.json`, or real SMTP passwords.
- `.gitignore` already excludes env files, `node_modules/`, and build outputs.
- Rotate JWT secrets and seeded passwords before any shared deployment.
- Prefer least-privilege MySQL users and HTTPS termination at the reverse proxy.

---

## Contributing

1. Branch from `main`.
2. Keep API path / permission changes mirrored in both client services and server middleware.
3. Prefer design tokens from `themes.ts` over one-off colors.
4. Add or update screenshots under `images/` when UX changes meaningfully.
5. Do not commit secrets, zip bundles, or `node_modules/`.

---

## License

ISC (see `server/package.json`). Adjust if your organization requires a different license file.

---

## Maintained by

**Refex AI Team** — Industrial Biogas Plant MIS (Vizag / SREL).
