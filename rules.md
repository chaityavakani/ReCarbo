# rules.md — ReCarbo Project Rules
**Team:** The Outliers — Smit Bhalani (Lead), Chaitya Vakani, Dhruvi Raval, Diya Joshi

Place this file at the root of the repo. Every Antigravity/AI coding session should read this file before writing code. It exists so 4 people working in parallel produce one consistent codebase, not four different apps stitched together.

---

## 1. Project Identity
- **Project Name:** ReCarbo
- **Tagline:** Capture. Connect. Reuse.
- **Theme:** Circular Carbon Ecosystem — a Carbon Capture-to-Product Matchmaking Platform. The platform starts after CO2 is captured; it never simulates or claims to perform carbon capture itself.
- Do not rename the project, core entities (`CO2Listing`, `CO2Requirement`, `Match`, `QuoteRequest`, `Quote`, `Allocation`, `Order`), or user-facing labels without updating this file and notifying the team.

---

## 2. Tech Stack — Do Not Substitute
| Layer | Required |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS + React Router + Recharts + Framer Motion + Lucide React + Axios |
| Backend | Node.js + Express.js + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt, role-based access control (`SUPPLIER`, `BUYER`, `ADMIN`) |
| Real-time | Socket.IO — server is always the source of truth |
| Maps | Leaflet + OpenStreetMap, with a local demo-data fallback |
| AI | LLM API only for the assistant, NL search parsing, and explanations |

If a task seems to need a different library, stop and raise it with the team instead of silently substituting one.

---

## 3. Folder Structure — Fixed
```
frontend/
  components/   pages/    layouts/   hooks/
  services/     utils/    types/     context/
backend/
  controllers/  routes/   services/  middleware/
  models/       utils/    socket/    prisma/
```
- No business logic inside React components — components call `services/`.
- No business logic inside Express route files — routes call `controllers/` → `services/`.
- New files go in the matching folder above. Do not invent parallel folders (no `helpers/`, `lib/`, `common/` duplicating an existing one).

---

## 4. Naming Conventions
- **Files:** `PascalCase.tsx` for React components, `camelCase.ts` for services/utils/hooks, `kebab-case.ts` for backend route files.
- **Database models:** PascalCase singular (`CO2Listing`, not `co2_listings` or `Listings`). Use the exact model names from the shared schema.
- **API routes:** `/api/<resource-plural-kebab-case>/...` (e.g. `/api/quote-requests/:id/quotes`).
- **Socket.IO events:** `resource:action` lowercase (e.g. `quote:submitted`, `listing:closed`) — never invent a new event name pattern.
- **Env vars:** `SCREAMING_SNAKE_CASE`, always added to `.env.example` when introduced, never committed with real values.

---

## 5. Ownership Boundaries
Stay inside your assigned area. If you need something from another module that doesn't exist yet, add a clearly-marked stub/interface and flag it — don't build someone else's module for them.

| Owner | Owns |
|---|---|
| **Smit** | Scaffold, Prisma schema (base), auth, layouts/navigation, landing page, company profile |
| **Chaitya** | CO2 Listings & Marketplace, Matching Engine, RFQ + Allocation Engine, Logistics + Calculator |
| **Dhruvi** | Orders, Notifications, Trust & Verification, Analytics |
| **Diya** | Admin Dashboard, AI Assistant, Sustainability Dashboard, landing/UI polish |

Shared/edited-by-all files (`schema.prisma`, `types/`, `App.tsx` routes, `Sidebar.tsx`) — pull latest before editing, and keep additions additive (append, don't restructure someone else's section) to avoid merge conflicts.

---

## 6. Database Rules
- Core models are fixed: `User`, `Company`, `CO2Listing`, `CO2Requirement`, `Match`, `QuoteRequest`, `Quote`, `Allocation`, `Order`, `PlatformFee`, `Calculation`, `Notification`, `AuditLog`. Extend fields; don't rename or delete a model without team agreement.
- Every migration must be committed alongside the schema change — never edit the DB by hand outside Prisma.
- **Quantities:** always store and compute in a single base unit internally (**kg**). Convert only at the display layer. `1 tonne = 1000 kg` — never multiply a `tonnes` value directly against a `₹/kg` rate.
- Every write to `Order`, `Quote`, or `Allocation` that changes money or quantity must also be safe under concurrent access — use a Prisma transaction (`prisma.$transaction`) with row locking, not an application-level "check then write."

---

## 7. Financial & Matching Rules (Non-negotiable)
- Backend is the only source of truth for money. The frontend may show a live preview, but before any `Order` is created, the backend recalculates CO2 cost, transport cost, handling, and platform fee from scratch and uses its own numbers — never numbers passed in from the client.
- Platform Fee % and Transport Rate are read from Admin Settings, never hard-coded in a component, controller, or constant file.
- Match Score is always: **30% quantity + 25% purity + 20% distance + 15% price + 10% availability**, each normalized 0–100. Hard eligibility checks (purity, quantity, distance, price, availability overlap) run before scoring — a listing that fails any check must never appear as a match, regardless of score.
- Never let the LLM decide a price, a match score, a fee, or an allocation winner. The LLM may only explain a decision that was already computed deterministically, or parse free text into structured filters that are then run through the real matching/allocation code.
- RFQ, not open auction. No countdown-style "outbid" live auction UI. Use Fixed-Price mode or Request-Quote mode as defined in the shared context, behind the `TransactionStrategy` interface (`validateRequest → rankOffers → selectWinners → allocateQuantity → closeListing`).

---

## 8. API Conventions
- REST, JSON in/out. Every endpoint validates its input server-side.
- Auth: every protected route uses the shared JWT + role-based middleware from `backend/middleware/` — don't write a second auth check inline.
- Errors: consistent shape — `{ "error": { "code": "STRING_CODE", "message": "human readable" } }` with an appropriate HTTP status.
- Every state-changing action that matters for accountability writes an `AuditLog` entry.

---

## 9. Frontend Conventions
- Tailwind only for styling — no inline `style={{}}` unless truly dynamic, no separate CSS files per component.
- Design tokens come from the shared Tailwind config — deep green/emerald/charcoal palette.
- Every data-fetching view needs three real states: **loading** (skeleton), **empty** (clear empty-state), and **error** (user-friendly message).
- No placeholder buttons. If a button exists, it does something.
- Responsive: collapsible sidebar on mobile, wide tables adapt to stacked cards, primary action buttons sticky on mobile.

---

## 10. Real-Time (Socket.IO) Rules
- Client never assumes a bid/quote/order state changed on its own — it waits for the server event and re-renders from the payload the server sends.
- Every event name is documented in `backend/socket/events.ts` (single source of truth).
- Reconnect handling: on reconnect, the client re-fetches current state via REST.

---

## 11. Git Workflow
- Branch per person/module: `smit/foundation`, `chaitya/marketplace-rfq`, `dhruvi/orders-notifications`, `diya/admin-ai`.
- Merge order: `smit/foundation` → main first.
- Commit messages: `[module] short description`.

---

## 12. Definition of Done (per module)
- It works end-to-end against the real backend/DB.
- It has loading/empty/error states.
- It is responsive down to mobile width.
- No `TODO`/`console.log` debug leftovers in committed code.
- Any new env var is in `.env.example`.
- Seed script works reliably.

---

## 13. Demo Data & Accounts
- `supplier@recarbo.demo` / `password123`
- `buyer@recarbo.demo` / `password123`
- `admin@recarbo.demo` / `password123`

---

## 14. Wording & Claims
- Never claim CO2 utilization is automatically "permanently avoided emissions." Use language like "Captured CO2 routed toward productive utilization."
- Verification is simulated in this prototype — label clearly.
- Transport rates and fee percentages are labeled as configurable estimates.
