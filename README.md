# Confident Property CRM — Frontend

React + Vite + Tailwind CSS admin frontend for the Property CRM, themed after
**Confident Group** (deep navy + luxury gold). State and data fetching use
**Redux Toolkit + RTK Query**, alerts use **SweetAlert2**, and the whole UI is
fully **mobile responsive**.

Pairs with the `property-crm-backend` (Node/Express/MongoDB) API.

---

## Highlights

- **Redux Toolkit + RTK Query** — all API calls go through a single typed API
  slice with automatic caching, request de-duplication, and tag-based cache
  invalidation. This is what keeps re-renders minimal and the UI fast: a
  mutation (e.g. "create lead") surgically refetches only the affected lists,
  never the whole screen.
- **Auto token refresh** — a 401 transparently calls `/auth/refresh` once and
  replays the request; if that fails the user is logged out. No flicker.
- **Role-aware everything** — sidebar, routes, and dashboards adapt to
  `SUPER_ADMIN`, `STAFF`, `AGENT`, and `USER`. Routes are guarded both by
  authentication and by role.
- **Google login** — "Sign in with Google" via `@react-oauth/google`
  (external-API requirement), wired to the backend's `/auth/google`.
- **SweetAlert2** — branded toasts for success/error and confirm dialogs for
  destructive actions, styled with the navy/gold theme.
- **Mobile responsive** — collapsible sidebar with backdrop, tables collapse to
  cards on small screens, bottom-sheet modals on mobile.
- **Accessibility floor** — visible keyboard focus, `prefers-reduced-motion`
  respected, semantic dialogs.

---

## Tech stack

| Concern        | Choice                         |
|----------------|--------------------------------|
| Build tool     | Vite 5                         |
| UI             | React 18                       |
| Styling        | Tailwind CSS 3                 |
| State / data   | Redux Toolkit + RTK Query      |
| Routing        | React Router 6                 |
| Alerts         | SweetAlert2                    |
| Auth (external)| @react-oauth/google            |

> Tailwind **v3** is used deliberately (stable, standard PostCSS config) to
> avoid the v4 `@tailwindcss/postcss` plugin churn.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure (optional — defaults work for local dev)
cp .env.example .env

# 3. Run (expects the backend on http://localhost:5000)
npm run dev          # → http://localhost:5173

# Production build
npm run build
npm run preview
```

During development, Vite proxies `/api` → `http://localhost:5000`
(see `vite.config.js`), so there are **no CORS issues** locally.

### Demo logins (after seeding the backend)

| Role        | Email             | Password       |
|-------------|-------------------|----------------|
| Super Admin | admin@crm.com     | Admin@12345    |
| Staff       | staff@crm.com     | Staff@12345    |
| Agent       | agent@crm.com     | Agent@12345    |
| Customer    | customer@crm.com  | Customer@12345 |

The login screen has one-tap buttons that fill these in.

---

## Project structure

```
frontend/
├── index.html
├── vite.config.js            # dev server + /api proxy
├── tailwind.config.js        # navy + gold brand theme
├── postcss.config.js
├── .env.example
└── src/
    ├── main.jsx              # providers: Redux, Router, GoogleOAuth
    ├── App.jsx               # routes + role guards
    ├── index.css             # Tailwind layers + component classes
    ├── app/
    │   └── store.js          # Redux store
    ├── features/
    │   ├── auth/authSlice.js # token + user, persisted to localStorage
    │   └── api/apiSlice.js   # RTK Query — every endpoint + auto-refresh
    ├── components/           # Layout, Sidebar, Topbar, Modal, UI, Icons…
    ├── pages/                # Login, Register, Dashboard, Leads, LeadDetail,
    │                         #   Properties, FollowUps, Users, NotFound
    └── utils/                # alert (SweetAlert), constants, useDebounce
```

---

## How the data layer avoids re-render issues

1. **Single source of truth** — RTK Query stores server state in the Redux
   cache; components subscribe only to the slices they read.
2. **Stable query keys** — list params are wrapped in `useMemo`, so identical
   filters don't trigger refetches.
3. **Tag invalidation** — mutations declare which tags they invalidate, so only
   the impacted queries refetch (e.g. creating a lead refetches the lead list +
   dashboard, nothing else).
4. **Debounced search** — `useDebounce` prevents a request per keystroke.
5. **Memoized components** — the sidebar is `memo`-ised; dropdowns close via
   refs without re-rendering the tree.

---

## Pages by role

| Page          | Super Admin | Staff | Agent | Customer |
|---------------|:-----------:|:-----:|:-----:|:--------:|
| Dashboard     | ✅ pipeline | ✅ team | ✅ assigned | ✅ enquiries |
| Leads list    | ✅ | ✅ | ✅ (own) | – |
| Lead detail   | ✅ full | ✅ | ✅ | ✅ (own) |
| Properties    | ✅ manage | ✅ view | ✅ view | ✅ + enquire |
| Follow-ups    | ✅ | ✅ | ✅ | – |
| Users         | ✅ | – | – | – |

---

## Deployment

```bash
npm run build          # outputs static files to dist/
```

Serve `dist/` with Nginx (the same server that reverse-proxies `/api` to the
Node backend). Set `VITE_API_URL` to your production API URL and
`VITE_GOOGLE_CLIENT_ID` to your OAuth client ID before building.

```
Nginx ──┬── /            → dist/  (this frontend)
        └── /api         → Node API (PM2) ── MongoDB Atlas
```

Because the app is a single-page app, configure Nginx to fall back to
`index.html` for unknown routes:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Workflow extensions (payments, documents, requirements)

This build wires the **complete CRM pipeline** to the backend and adds the
Razorpay payment flow. Nothing from the original app was removed.

### New / updated pages & nav
- **Payments** (`/payments`) — gateway payments list with status filter, scoped
  per role (admins/staff/agents see all in scope, customers see their own).
- **Lead detail** now hosts the full workflow: **Requirement analysis**,
  **Property matching + Share**, **KYC Documents** (upload / verify / reject /
  delete), **Agreement upload**, **Payments** (collect + refund), and
  **Sales-manager Approval → Final Sale**.
- **Property detail** gained an **Edit** action with full Cloudinary image
  management (add new photos, delete existing ones).
- **Profile** now calls the corrected `PATCH /profile` route.

### Razorpay payment flow (secure)
1. Frontend calls `POST /payments/order` → backend creates the order and returns
   `{ order, keyId }`.
2. `utils/razorpay.js` loads Razorpay Checkout and opens it with that `keyId`.
   The **publishable key comes from the backend** — it is never hard-coded, and
   the **key_secret never touches the browser**.
3. On success, the frontend calls `POST /payments/verify`; the backend verifies
   the signature (the webhook is the source of truth as well).

Razorpay Checkout is loaded from `https://checkout.razorpay.com`. If your
deployment uses a strict Content-Security-Policy, allow that origin for
`script-src` and `frame-src`.

### Cloudinary (already secure)
Image and document uploads go through the backend as `multipart/form-data`; the
server streams them to Cloudinary. The Cloudinary secret is **only** on the
server, so the browser never sees it. The frontend validates type/size before
upload purely for UX.

### Email (SMTP) — backend-driven
Transactional emails (enquiry received, lead assigned, site-visit reminder,
payment receipt, booking confirmed, shared properties) are sent by the backend
automatically when the matching action runs in the UI. There is no email
credential in the frontend.

### Modal accessibility & responsiveness
`components/Modal.jsx` now renders through a **portal to `document.body`** (so a
transformed ancestor can no longer clip or mis-place it), traps focus, locks
body scroll without layout shift, respects iOS safe areas, and renders as a
bottom-sheet on mobile / centered card on desktop with a sticky header and an
independently scrollable body.

### New environment variable
- `VITE_RAZORPAY_KEY_ID` *(optional)* — the backend already returns `key_id`, so
  this is usually left blank. Never store the Razorpay **secret** here.
