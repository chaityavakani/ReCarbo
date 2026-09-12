# ReCarbo — Circular Carbon Marketplace

> **Capture. Connect. Reuse.**
> AI-Powered B2B Platform connecting industrial CO₂ suppliers with commercial buyers through deterministic matching, RFQ allocation, and logistics estimation.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Database Setup](#3-database-setup)
  - [4. Seed Demo Data](#4-seed-demo-data)
  - [5. Run the Backend](#5-run-the-backend)
  - [6. Run the Frontend](#6-run-the-frontend)
- [Demo Accounts](#demo-accounts)
- [API Overview](#api-overview)
- [Key Features](#key-features)
- [Database Schema](#database-schema)
- [Team & Ownership](#team--ownership)
- [Scripts Reference](#scripts-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

ReCarbo is a full-stack B2B SaaS platform built for the **Gujarat industrial carbon ecosystem**. It connects:

- **Suppliers** — Industrial facilities (cement, chemicals, fermentation) that capture CO₂ and list it for sale
- **Buyers** — Companies (polymer synthesis, greenhouses, SAF producers) that procure captured CO₂ as feedstock
- **Admins** — Platform operators who verify companies, moderate listings, and govern the marketplace

The platform handles the full lifecycle: listing → matching → RFQ → quote → order → delivery → utilization tracking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + custom design tokens |
| Routing | React Router v6 |
| Charts | Recharts |
| Animations | Framer Motion + CSS keyframes |
| Maps | Leaflet + OpenStreetMap |
| Icons | Lucide React |
| HTTP Client | Axios |
| Real-time | Socket.IO Client |
| Backend | Node.js + Express.js + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcryptjs (role-based: SUPPLIER / BUYER / ADMIN) |
| Real-time Server | Socket.IO |
| AI Assistant | Groq SDK (LLM for NL explanations only) |
| Validation | Zod |

---

## Project Structure

```
ReCarbo/
├── frontend/                   # React + Vite app
│   ├── public/
│   │   ├── recarbo-logo.png    # Main logo (used in splash screen)
│   │   └── single-logo.jpeg   # Single icon logo (used in navbar)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # AuthContext, SocketContext
│   │   ├── layouts/            # AppShell (authenticated), PublicLayout
│   │   ├── pages/              # All page components by feature
│   │   ├── services/           # API call functions (axios)
│   │   ├── types/              # Shared TypeScript interfaces
│   │   ├── App.tsx             # Routes + SplashScreen
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Global styles + splash animations
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                    # Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma       # Full database schema
│   │   └── seed.ts             # Demo data seeder
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, error handler
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic
│   │   ├── socket/             # Socket.IO event handlers
│   │   ├── utils/              # Logger, helpers
│   │   └── server.ts           # Express app entry point
│   ├── .env                    # Backend environment variables
│   └── package.json
│
├── .env.example                # Environment variable template
├── recarbo-logo.png            # Source logo file
├── SINGLE-LOGO.jpeg            # Source single icon logo
├── rules.md                    # Team coding rules & conventions
└── README.md                   # This file
```

---

## Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| Node.js | v18+ | https://nodejs.org |
| npm | v9+ | Comes with Node.js |
| PostgreSQL | v14+ | https://www.postgresql.org/download |
| Git | Latest | https://git-scm.com |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ReCarbo
```

---

### 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/recarbo_db?schema=public"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"

# JWT
JWT_SECRET="your_super_secret_key_here"
JWT_EXPIRES_IN="7d"

# Platform defaults
PLATFORM_FEE_PERCENTAGE=2.5
TRANSPORT_RATE=12.5

# AI (Groq) — optional, assistant falls back to mock if absent
AI_API_KEY="your_groq_api_key"
```

> **Note:** Never commit `.env` with real credentials. Only `.env.example` is committed.

---

### 3. Database Setup

Make sure PostgreSQL is running, then create the database:

```sql
-- In psql or pgAdmin
CREATE DATABASE recarbo_db;
```

Then run Prisma migrations:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
```

Or if you just want to push the schema without migration history:

```bash
npx prisma db push
```

---

### 4. Seed Demo Data

Populate the database with demo companies, users, listings, requirements, orders, and analytics:

```bash
cd backend
npm run seed
```

This creates the 3 demo accounts listed in the [Demo Accounts](#demo-accounts) section.

---

### 5. Run the Backend

```bash
cd backend
npm run dev
```

Backend runs at: **http://localhost:5000**

Health check: **http://localhost:5000/api/health**

---

### 6. Run the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Supplier | supplier@recarbo.demo | password123 |
| Buyer | buyer@recarbo.demo | password123 |
| Admin | admin@recarbo.demo | password123 |

These are pre-seeded by `npm run seed`. Each role shows a different dashboard with role-specific features.

---

## API Overview

All API routes are prefixed with `/api`.

| Route | Description |
|---|---|
| `POST /api/auth/login` | Login, returns JWT |
| `POST /api/auth/register` | Register new user + company |
| `GET /api/marketplace/listings` | Get all active CO₂ listings |
| `POST /api/marketplace/listings` | Create a new listing (Supplier) |
| `GET /api/marketplace/requirements` | Get all open requirements |
| `POST /api/marketplace/requirements` | Post a new requirement (Buyer) |
| `GET /api/marketplace/matches` | Get AI match recommendations |
| `GET /api/orders` | Get orders for current user |
| `POST /api/orders` | Place a new order |
| `GET /api/analytics/supplier` | Supplier analytics data |
| `GET /api/analytics/buyer` | Buyer analytics data |
| `GET /api/admin/overview` | Admin platform KPIs |
| `GET /api/admin/users` | All users (Admin only) |
| `GET /api/admin/companies` | All companies (Admin only) |
| `PATCH /api/admin/companies/:id/verify` | Verify a company (Admin only) |
| `GET /api/notifications` | Get notifications for current user |
| `POST /api/assistant/chat` | AI assistant chat endpoint |
| `GET /api/health` | Server health check |

> All protected routes require `Authorization: Bearer <token>` header.

---

## Key Features

### For Suppliers
- List captured CO₂ inventory with purity, quantity, price, and physical specs
- View real-time revenue analytics and buyer breakdown
- Manage active listings and track order fulfillment

### For Buyers
- Post CO₂ feedstock requirements
- Get deterministic AI match recommendations (5-factor scoring)
- Submit RFQ quotes and track procurement spend
- Logistics & cost estimator with route distance calculation

### For Admins
- Full platform overview with GMV, carbon flow, and user growth charts
- Company verification queue with document inspection
- User governance (suspend/reinstate)
- Marketplace moderation (pause/activate listings)
- Immutable audit trail logs
- Platform fee and transport rate configuration

### Platform-wide
- Premium animated splash screen on first load
- Real-time notifications via Socket.IO
- AI assistant for natural language CO₂ queries (Groq LLM)
- Sustainability dashboard with circular carbon tracking
- Responsive design — desktop, tablet, and mobile

---

## Database Schema

Core models:

| Model | Description |
|---|---|
| `User` | Platform users with roles (SUPPLIER / BUYER / ADMIN) |
| `Company` | Industrial organizations with trust scores and verification |
| `CO2Listing` | Supplier CO₂ inventory listings |
| `CO2Requirement` | Buyer feedstock demand requests |
| `Match` | Deterministic 5-factor match scores between listings and requirements |
| `QuoteRequest` | RFQ cycles attached to listings |
| `Quote` | Buyer bids on a QuoteRequest |
| `Allocation` | Winner selection result from RFQ |
| `Order` | Confirmed transactions with full financial breakdown |
| `PlatformFee` | Admin-configurable fee and transport rate settings |
| `Calculation` | Saved logistics cost estimates |
| `Notification` | Real-time user notifications |
| `AuditLog` | Immutable record of all platform actions |

**Match Score Formula (non-negotiable):**
```
Score = 30% Quantity + 25% Purity + 20% Distance + 15% Price + 10% Availability
```

**Financial rule:** Backend always recalculates all costs server-side. Frontend numbers are display-only previews.

---

## Team & Ownership

| Member | Module |
|---|---|
| **Smit Bhalani** | Scaffold, Auth, Layouts, Navigation, Landing Page, Company Profile |
| **Chaitya Vakani** | CO₂ Listings, Marketplace, Matching Engine, RFQ + Allocation, Logistics Calculator |
| **Dhruvi Raval** | Orders, Notifications, Trust & Verification, Analytics |
| **Diya Joshi** | Admin Dashboard, AI Assistant, Sustainability Dashboard, UI Polish |

---

## Scripts Reference

### Backend (`/backend`)

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run seed` | Seed database with demo data |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate dev` | Create and apply a new migration |
| `npx prisma db push` | Push schema to DB without migration history |
| `npx prisma studio` | Open Prisma visual DB browser |

### Frontend (`/frontend`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

---

## Troubleshooting

**`Cannot find module '@tailwindcss/typography'`**
```bash
cd frontend && npm install @tailwindcss/typography
```

**`prisma: command not found`**
```bash
cd backend && npx prisma generate
```

**CORS errors in browser**
- Make sure `FRONTEND_URL` in `backend/.env` matches exactly where your frontend is running (default: `http://localhost:5173`)

**Database connection refused**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `backend/.env` has the correct host, port, username, and password

**Splash screen shows every time**
- The splash uses `sessionStorage` — it only shows once per browser tab session
- To see it again: open a new tab or do `sessionStorage.clear()` in browser console

**Logo not showing in splash screen**
- Make sure `recarbo-logo.png` exists in `frontend/public/`
- Run: `copy recarbo-logo.png frontend\public\recarbo-logo.png` from the project root

**Seed fails with unique constraint error**
- Database already has seed data. Either drop and recreate the DB, or run:
```bash
npx prisma migrate reset
npm run seed
```

---

## License

Built by **The Outliers** — Smit Bhalani, Chaitya Vakani, Dhruvi Raval, Diya Joshi.
For academic and demonstration purposes.
