# Shoba Creations Frontend

## Overview

Shoba Creations is a heritage-inspired Indian fashion storefront with a customer shopping experience and a protected warehouse/admin workspace.

All business and editorial data — catalogue, stock, prices, carts, wishlists, orders, stories, testimonials and site imagery — is read from and written to the backend database API. There is no bundled seed data and no local copy of anything the server owns. The only data kept in the browser is a guest's cart and wishlist, and even that stores just enough to rebuild it after sign-in.

The interface uses a burgundy, antique-gold, ivory, and plum visual system with serif display typography and small uppercase editorial labels.

## Technology

- React 18 with strict TypeScript
- Vite 6
- React Router 6
- TanStack Query 5 for server state
- Plain CSS with shared design tokens
- Vitest for unit tests
- Backend: Node/Express + PostgreSQL, in a sibling `Shoba Creations - Backend` project

## Getting started

The backend must be running first: it serves both the API and, in development, the product image uploads.

```bash
# Shoba Creations - Backend
npm run db:migrate
npm run db:seed
npm run dev

# in this project
npm install
npm run dev
```

The API origin comes from `VITE_API_BASE_URL` (see `.env`), which defaults to `http://localhost:3000`.

### Signing in locally

Nothing in this app is usable anonymously past the cart and wishlist, so
signing in is the first thing worth trying after `db:seed`. This project holds no
credentials of its own — the accounts come from the backend's seed and admin
env values, so they only exist if the database has been seeded:

| Account | Email | Password |
| --- | --- | --- |
| Admin | `admin@shobacreations.com` | `Admin@2026` |
| Customer | `meera@example.com` | `Shoba@2026` |
| Customer | `orders@northlinestudio.co` | `Shoba@2026` |

The five seeded customers are `meera@example.com`, `jon.bell@example.com`,
`aisha.patel@example.com`, `orders@northlinestudio.co` and
`elena.rossi@example.com`, all with the same `Shoba@2026` password. They are
worth signing in as more than one of, because only Meera and Northline Studio
have enough order history for `/store/orders` and the admin dashboard to show
anything interesting.

The admin email and password come from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the
backend's `.env`, so the admin row's address is whatever that file says, not
necessarily the one above.

Available scripts:

```bash
npm run dev       # Start Vite development mode
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript without emitting files
npm test          # Run the Vitest suite once
npm run test:watch # Run Vitest in watch mode
npm run build     # Typecheck and create a production build
npm run preview   # Serve the production build locally
```

## Application structure

```text
src/
├── components/       Storefront, commerce, auth and admin UI
├── context/          Auth, cart, wishlist and UI state providers
├── hooks/            API-backed query and mutation hooks
├── layouts/          Storefront and admin shells
├── lib/              API client, query client and keys, guest storage, media, formatting
├── pages/            Storefront, customer and admin route components
├── services/         Typed wrappers around each API area
├── styles/           Base, storefront, commerce, admin and auth styles
├── types/            Backend-aligned DTOs (`api.ts`)
├── App.tsx           Providers, guards and route definitions
└── main.tsx          React entry point
```

There is no `src/data/` seed directory any more; the folder is empty and unused.

`src/styles.css` imports the five stylesheets in this order:

1. `base.css`
2. `storefront.css`
3. `commerce.css`
4. `admin.css`
5. `auth.css`

### Provider tree

`src/main.tsx` mounts `StrictMode` and `QueryClientProvider` around `<App />`. `App.tsx` then nests, outermost first:

```text
BrowserRouter
└── AuthProvider          API-backed session
    └── CommerceUIProvider  cart drawer / search overlay / mobile menu open flags
        └── CartProvider    guest + server cart adapter
            └── WishlistProvider
                └── Routes
```

The order matters: commerce state sits above cart and wishlist because the header badge, drawer and overlay all read both.

### The `xState.ts` + `xContext.tsx` split

Every context in `src/context/` follows one convention, so the same file name means the same kind of thing everywhere:

| File | Role |
| --- | --- |
| `authState.ts` | `createContext` call plus the `AuthContextValue` interface. No JSX. |
| `AuthContext.tsx` | The `AuthProvider` component that supplies the value. |
| `useAuth.ts` | The consumer hook. Throws if called outside the provider. |

The same split applies to `cartState.ts`/`CartContext.tsx`/`useCart.ts`,
`wishlistState.ts`/`WishlistContext.tsx`/`useWishlist.ts`, and
`commerceUIState.ts`/`CommerceUIContext.tsx`/`useCommerceUI.ts`.

Keeping the type and the `createContext` call in a `.ts` file means the
contract can be imported by a `.ts` test, and it is what allows the auth error
logic described below to live in a plain `authErrors.ts` and be unit tested
without a renderer.

### Components

Nothing in `src/components/` is route-level; each is used by at least one page
or layout.

| Component | Purpose |
| --- | --- |
| `RequireAdmin.tsx` | Route guard: waits for the session, redirects to `/admin/login`, passes `state.from` |
| `RequireCustomer.tsx` | Route guard: same, for `/store/login` |
| `HeritageImage.tsx` | Full-bleed editorial image with a shade overlay and copy block |
| `Ornament.tsx` | Decorative rule used to separate sections |
| `Reveal.tsx` | Scroll-triggered fade-in wrapper |
| `SectionHeading.tsx` | Eyebrow + title + optional link |
| `ProductCard.tsx` | Catalogue grid tile |
| `ProductGallery.tsx` | Product detail gallery with thumbnails |
| `ProductVisual.tsx` | Renders a product's `images[0]`, falling back to the placeholder |
| `ProductVisualPlaceholder.tsx` | Tone-based fallback for a product with no image |
| `QuantitySelector.tsx` | Bounded +/- stepper |
| `Rating.tsx` | Star display from `rating` and `review_count` |
| `DbImage.tsx` | Renders a `SiteImage` row, falling back to a tone-based placeholder |
| `CartDrawer.tsx` | Slide-out bag |
| `SearchOverlay.tsx` | Full-width search with live results |
| `EmptyState.tsx` | Shared "nothing here yet" panel |
| `StatusBadge.tsx` | Order status pill |
| `MetricCard.tsx` | Admin dashboard KPI tile |
| `AdminPagination.tsx` | Admin list pager |
| `MobileMenu.tsx` | Narrow-viewport navigation drawer |

## The data layer

### `src/lib/apiClient.ts`

The only place the browser talks to the backend. It:

- unwraps the `{ success, data }` / `{ success, error }` envelope, so callers only ever see `data` or a thrown `ApiError`
- always sends `credentials: 'include'`, without which the httpOnly session cookies are neither stored nor sent
- primes the CSRF cookie from `GET /api/auth/csrf` and echoes it as `X-CSRF-Token` on every non-GET request
- performs one silent `POST /api/auth/refresh` when the access cookie has expired, then replays the original request exactly once
- never sets `Content-Type` for a `FormData` upload, so the browser can pick its own multipart boundary

`ApiError` exposes `status`, `code`, `details`, `isUnauthenticated`, `isForbidden`, and `fieldErrors` (a `{ field: message }` map for forms).

The base URL is `VITE_API_BASE_URL` from `.env`, defaulting to
`http://localhost:3000`, with any trailing slashes stripped. The same value
doubles as the media origin; see `src/lib/media.ts` below.

#### Endpoints excluded from refresh-and-replay

`NO_REFRESH_PATHS` in `apiClient.ts` lists `/api/auth/login`,
`/api/auth/register` and `/api/auth/refresh`. A `401` from any of them is a
real answer, not an expired access cookie, so the client rethrows it
immediately instead of refreshing.

This matters more than it looks. The backend's `authRateLimiter` allows
**20 requests per 15 minutes per (IP + email) pair**, so every extra login POST
burns a real attempt. Without the exemption, a single wrong password would cost
two attempts out of the twenty and be silently replayed with the same
credentials — which is both pointless and, to a rate limiter, indistinguishable
from guessing.

`POST /api/auth/me` is *not* exempt, because an expired session there is exactly
the case the replay exists for. `useSession` in `src/hooks/useAuth.ts` catches
that `401` and resolves to `null` instead of throwing, so "signed out" is a
value the app renders rather than an error state every screen special-cases.

### `src/lib/queryClient.ts`

Defaults that matter:

| Option | Value | Reason |
| --- | --- | --- |
| `queries.retry` | one retry, never for status < 500 | A `4xx` is a legitimate answer; repeating it wastes a round trip |
| `queries.staleTime` | `30_000` | |
| `queries.refetchOnWindowFocus` | `false` | |
| `mutations.retry` | `false` | A failed sign-in must not repeat on its own |

### `src/lib/media.ts`

Uploaded images come back from the API as relative paths under `/uploads`.
A browser resolves those against the *page's* origin, which here is the Vite dev
server, not the API, so every such image would 404. `resolveMediaUrl` pins
relative paths to `API_BASE_URL` and passes absolute ones (seeded remote URLs,
blob previews, data URIs) through untouched. Every image in the app renders
through it, either directly or via `DbImage` / `ProductVisual`.

### `src/lib/format.ts`

Three `Intl`-based formatters: `formatCurrency` (INR, no minor units),
`formatCompactCurrency` (Indian `k`/`L`/`Cr` grouping, for dashboard tiles), and
`formatDate`.

### Queries

Server state lives in TanStack Query, keyed centrally in `src/lib/queryKeys.ts`. A signed-out visitor's cart and wishlist are the one exception: they are local, and are hydrated into products through a catalogue lookup rather than stored with their prices.

## Routes

### Public storefront

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/store` |
| `/store` | Storefront home page |
| `/store/shop` | Full catalogue with search, filters, and sorting |
| `/store/shop/:category` | Category-filtered catalogue |
| `/store/product/:slug` | Product detail page |
| `/store/journal/:slug` | Editorial story page |
| `/store/wishlist` | Saved products |
| `/store/cart` | Full shopping bag page |
| `/store/login` | Customer login |
| `/store/register` | Customer registration |
| `/admin/login` | Admin login |
| `*` | Not-found page |

### Customer-protected routes

| Route | Purpose |
| --- | --- |
| `/store/checkout` | Server-priced checkout; requires a customer session |
| `/store/orders` | Customer order history; requires a customer session |

### Admin-protected routes

| Route | Purpose |
| --- | --- |
| `/admin` | Warehouse dashboard |
| `/admin/products` | Catalogue product management |
| `/admin/inventory` | Stock control and stock adjustments |
| `/admin/orders` | Order management and status transitions |

The guards are `RequireCustomer` and `RequireAdmin`, which wait for the session query before deciding. They are a UX convenience only: the backend enforces authorization on every protected route independently.

## Authentication

Authentication is server-backed and cookie-based. `src/context/AuthContext.tsx` calls `GET /api/auth/me` on mount and exposes the resulting user; there are no local session records and no demo credentials in the code.

The two endpoints that create a session (`POST /api/auth/register`, `POST /api/auth/login`) return `{ user, cart, wishlist }`, and the context seeds the query cache from that response so the bag and wishlist are correct on the first render after sign-in.

### Auth error contract

These are the codes the login and register screens can actually receive, and
what the UI does with each:

| Backend response | Source | Shown as |
| --- | --- | --- |
| `401 INVALID_CREDENTIALS` — "Email or password is incorrect" | Well-formed email, wrong password or unknown account | `Email or password is incorrect` |
| `400 VALIDATION_ERROR` — "Validation failed" | Mailbox-shaped address that is not an email, or an empty password | `Email or password is incorrect` |
| `403 ACCOUNT_DISABLED` — "This account has been deactivated" | `users.is_active = false` | Verbatim — a typo is not the cause |
| `429 RATE_LIMITED` — "Too many requests. Please try again shortly." | `authRateLimiter`, 20 per 15 min per IP + email | Verbatim — retrying is not the fix |
| `400 VALIDATION_ERROR` + `details[]`, on **register** | Schema failure | Verbatim, plus `aria-invalid` on each named input |

A sixth code, `401 SESSION_EXPIRED` from `POST /api/auth/refresh`, is not shown
to the shopper: the client refreshes and replays silently, and only surfaces the
failure if the replay also fails.

The backend answers an unknown email and a wrong password identically, and
spends the same bcrypt time in both cases (it compares against a dummy hash),
so the login form cannot be used to discover which addresses have accounts. The
UI shows one message for both and does not attempt to distinguish them.

A third case is folded into that same message. `POST /api/auth/login` validates
its body with `z.string().email()` before it reaches the credentials check, so a
malformed address never produces `INVALID_CREDENTIALS` at all — it returns
`400 VALIDATION_ERROR` with the developer-facing message `Validation failed`.
`describeLoginError` maps that onto the same shopper-facing sentence, because
both mean "those details did not match an account", and drawing the distinction
is precisely what the enumeration defence is for. Registration keeps its real
per-field messages, where naming the offending input is the whole point.

`login.password` is validated as `min(1).max(72)` rather than enforcing the
8-character registration minimum, for the same reason: an 8-character floor on
the login path would reject a malformed password before the account was
consulted, which is a difference an attacker could measure.

### Surfacing a failed sign-in

`src/context/authErrors.ts` holds the pieces of this, kept out of the `.tsx`
file so they can be tested without a renderer:

- `resolveAuthError(login, registration)` picks which failed request to report,
  and returns `{ source, error }` so the caller knows which form it came from
- `describeAuthError(error)` turns any error into a sentence
- `describeLoginError(error)` collapses a rejected sign-in to one sentence
- `authFieldErrors(error, source)` maps a `400` onto `{ field: message }`,
  and returns `{}` for sign-in

`resolveAuthError` selects on **"which mutation settled with an error"**, not
"which one is running". This distinction is the whole mechanism: a mutation's
error only exists *after* it settles, and by then `isPending` is already
`false`. Selecting on `isPending` therefore reads a mutation that never failed
and silently drops the server's message — which is exactly the bug that made a
rejected sign-in show no banner at all while the API was answering correctly.
`src/context/authErrors.test.ts` pins this behaviour.

The `source` is what lets registration keep useful per-field feedback while
sign-in deliberately does without it. Marking the email input invalid while the
banner says "email or password is incorrect" would contradict the banner, so
`authFieldErrors` returns an empty map for login and both login pages no longer
read `fieldErrors` at all.

`AuthProvider` exposes `clearAuthError()`, which resets the login and register
mutations without touching the query cache. It is deliberately *not* the
`reset()` on `useLogin`, which calls `queryClient.clear()` and would sign the
shopper out. Both login pages call it on submit and on every keystroke, so a
stale message never sits under the form while the shopper edits.

`StoreLoginPage.tsx` and `AdminLoginPage.tsx` are deliberate near-duplicates:
they share a layout and a CSS class prefix but not a component, differing in
redirect target, button copy and which half of the app they reveal. Changing
sign-in behaviour means changing both.

### Error display convention

There is **no toast library** in this project and no plan to add one. Failures
are rendered inline as `<p className="auth-error" role="alert">` (or
`form-error` on admin forms), styled in `src/styles/auth.css`. `role="alert"` is
what makes a screen reader announce the arrival; nothing else is needed.

The same applies to validation: there is **no form library** and no schema
library. Native attributes (`type="email"`, `required`) are present on the
inputs but the forms carry `noValidate`, so validation is server-driven via
`fieldErrors`, plus a single hand-rolled check in `StoreRegisterPage.tsx`
(`MIN_PASSWORD_LENGTH`).

Because `signIn` is `mutateAsync`, a rejected sign-in returns a promise that
rejects. Both login pages absorb it with `.catch(() => undefined)` and render
from `error` instead, which avoids an unhandled rejection without needing a
second error path.

### Guest state and merging

A visitor who has not signed in still needs a bag, but `/api/cart` is a private endpoint, so the guest cart is held in the browser until sign-in. `src/lib/guestStore.ts` stores only:

```json
{ "productId": "…", "quantity": 2, "selectedColor": "Ivory", "selectedSize": "5.5 m" }
```

Deliberately **not** stored: prices, stock, names, images or any other product detail. Those are the server's to decide, and caching them in the browser is how a storefront ends up showing a shopper a price the API will then refuse. Guest lines are matched against the live catalogue for display, so a price change is reflected immediately.

On sign-in the contents are posted as `guestState` and the server merges them; the local copies are then cleared, because the server owns them from that point on.

Because localStorage is not reactive, the store keeps a revision counter and `subscribeToGuestState()`, which the cart and wishlist hooks read through `useSyncExternalStore`. That is what makes the bag badge and the bag page update the moment a guest adds something.

| Storage key | Contents |
| --- | --- |
| `shoba.guestCart` | Guest product IDs, quantities, and chosen variants |
| `shoba.guestWishlist` | Saved product IDs |

Storage failures — corrupt JSON, a full quota, private browsing — are all caught and degrade to an empty bag rather than a broken page.

## Storefront features

- Heritage editorial home page assembled from the database: hero, category cards, featured products, journal stories, testimonials and site imagery, in one `/api/content/home` request
- Product grid with category, price and stock filters, and featured/newest/price/name sorting
- Search overlay and search-query catalogue results, both server-side
- Product detail pages with gallery, ratings, pricing, descriptions, care details, related products, quantity selection, wishlist and add-to-bag
- Multiple colour choices with named swatches when colour metadata is present
- Optional size/length choices; products without sizes do not show a size selector
- Wishlist drawer and page
- Shopping bag page and slide-out cart drawer
- Server-priced checkout and customer order history
- Public storefront routes remain available without authentication

Editorial copy and imagery are rendered through `src/components/DbImage.tsx`, which reads a `SiteImage` row and falls back to a generated tone-based placeholder only when a row has no URL, so a missing image never breaks a layout.

## Admin workspace features

### Dashboard

The admin overview is driven by `GET /api/admin/dashboard`: revenue and order counts, recent orders, best sellers, low-stock items and catalogue totals. There is no local arithmetic.

### Product management

`/admin/products` supports:

- Search by product name, SKU or category, and category filtering
- Add and edit product forms
- Product name, category, price, stock, SKU and visual tone fields
- Multiple named colour options with editable swatches
- Optional dynamic sizes or lengths with add/remove controls
- Duplicate colour and size validation
- Image upload for a saved product, with previews, removal and reordering

A product is created first, then images are uploaded against its id, because the upload endpoint is keyed by product. New products therefore show a placeholder until an image is added.

### Inventory

`/admin/inventory` lists stock and reorder points from the admin product endpoint and uses `GET /api/admin/low-stock` as a ready-made watch list. Stock edits go through the same product update endpoint the storefront reads from.

### Orders

The order screens list and filter real orders, show the full detail, and offer only the status transitions the server reports as available for the order's current state, so the picker cannot offer a move that will be rejected. The server's state machine is `processing → packed → shipped → delivered`, with `cancelled` reachable from `processing` or `packed` and `cancelled → processing` allowed as a reinstatement that re-reserves stock.

### Archived products

`GET /api/admin/products` hides archived rows by default, the same as the
storefront. They appear only with `?includeInactive=true`, and `DELETE
/api/admin/products/:id` is a soft archive that sets `is_active = false`;
`POST .../:id/restore` reverses it. Permanent deletion needs `?force=true` when
the product appears in any order.

## Product and image workflow

1. An administrator creates or edits the product record.
2. The editor uploads images through `POST /api/admin/products/:id/images` as `FormData`.
3. The server validates the file type and signature, stores the file, and records the row.
4. Upload, reorder and delete all answer with the full updated product, so the client replaces its state from any of the three without re-fetching.
5. The storefront renders `images[0].src` via `ProductVisual`, falling back to `ProductVisualPlaceholder`.

Images are served from `/uploads` on the API origin, which is why `VITE_API_BASE_URL` matters for both data and media.

## Domain model

The API DTOs are defined in `src/types/api.ts` and mirror the backend exactly. Important product fields include:

- Identity: `id`, `slug`, `name`, `sku`
- Catalogue: `category`, `categorySlug`, `description`, `collection`, `region`, `artisan`
- Commerce: `price`, `compareAtPrice`, `stock`
- Media: `images` — each `{ id, src, alt, position }`, always an array ordered by `position`
- Options: `colors`, `colorOptions`, `sizes`, `fabric`, `occasion`
- Presentation: `tone`, `badge`, `isNew`, `isFeatured`, `isActive`

`ProductColorOption` stores a display `name` and a CSS-compatible swatch `hex`. `ProductTone` is constrained to the seven values the database allows: `burgundy`, `gold`, `emerald`, `ivory`, `plum`, `terracotta` and `ink`.

Cart line items are deliberately leaner than a full product, since a cart needs identity, price, stock and an image, not the editorial copy. Wishlist items are the exception: `GET /api/wishlist` returns full product rows, because a saved item is rendered from the same components as a catalogue tile.

## Testing

`npm test` runs the Vitest suite in a `jsdom` environment, matched by
`include: ['src/**/*.test.ts']` in `vite.config.ts`. Note the pattern is `.ts`
and not `.tsx`, and `@testing-library/react` is not installed — so component
tests are currently impossible, and logic worth testing has to live in a `.ts`
module. That constraint is why `authErrors.ts` and `media.ts` exist as separate
files.

57 tests across four files, covering the areas where the browser has behaviour
the backend cannot verify:

| File | Covers |
| --- | --- |
| `src/lib/apiClient.test.ts` | Envelope unwrapping, 204 handling, error and `fieldErrors` mapping, query-string building, credential sending, CSRF priming and racing, the single-refresh-then-replay rule, the endpoints excluded from it, 403 passthrough, and multipart bodies |
| `src/lib/guestStore.test.ts` | What is (and is not) persisted, variant merging, quantity clamping, corrupt and hostile storage values, and the exact merge payload sent at sign-in |
| `src/lib/media.test.ts` | Relative-vs-absolute URL resolution against the API origin |
| `src/context/authErrors.test.ts` | Which failed auth mutation gets reported, sign-in message collapsing across `INVALID_CREDENTIALS` and `VALIDATION_ERROR`, codes that must pass through unchanged, and per-source `fieldErrors` mapping |

The backend has its own suite: 8 files, 151 tests, 484 assertions, covering the
routes themselves. Between them, the seam is covered.

## Styling and responsive behaviour

- Global colour and typography tokens are in `src/styles/base.css`.
- Storefront composition and product visuals are in `src/styles/storefront.css`.
- Cart, checkout, and commerce primitives are in `src/styles/commerce.css`.
- Admin shell, dashboard, tables, inventory, and product editor are in `src/styles/admin.css`.
- Login screens and auth states are in `src/styles/auth.css`.
- Admin sidebar collapses to an icon rail below the tablet breakpoint.
- Admin account/logout controls align as a compact avatar, name, and action group in the top bar and collapse to an avatar on small screens.
- Product editor option builders and image previews have responsive admin styles.

## Important source files

- `src/lib/apiClient.ts` — envelope, cookies, CSRF and refresh replay
- `src/lib/queryClient.ts` — QueryClient defaults
- `src/lib/queryKeys.ts` — centralized cache keys
- `src/lib/guestStore.ts` — minimal guest bag and merge payload
- `src/lib/media.ts` — `/uploads` URL resolution against the API origin
- `src/lib/format.ts` — currency and date formatters
- `src/types/api.ts` — backend-aligned DTOs
- `src/services/` — one typed API wrapper per area
- `src/hooks/useAuth.ts` — session, login, register, logout, guest merge
- `src/hooks/useCatalog.ts` — public product and category queries
- `src/hooks/useCommerce.ts` — cart, guest hydration, wishlist, checkout, orders
- `src/hooks/useAdmin.ts` — admin queries and mutations
- `src/hooks/useEditorial.ts` — stories, testimonials, site images
- `src/context/AuthContext.tsx` — API-backed session provider
- `src/context/authErrors.ts` — which auth failure is reported, and as what
- `src/context/CartContext.tsx` — guest/server cart adapter
- `src/context/WishlistContext.tsx` — guest/server wishlist adapter
- `src/context/CommerceUIContext.tsx` — drawer, overlay and menu open flags
- `src/App.tsx` — provider tree, guards, and route declarations
- `src/components/DbImage.tsx` — database-backed editorial and site imagery
- `src/components/ProductVisualPlaceholder.tsx` — missing-image visual fallback
- `src/pages/AdminProductsPage.tsx` — product editor and image uploads

## Known limitations and accepted risks

### Dependency advisories

`npm audit` reports 4 moderate advisories, all of which are only fixable by a breaking major upgrade. They are accepted for now:

- `react-router` / `react-router-dom` (open redirect via backslash, arbitrary constructor injection). Fixed in 7.18.4. This app only ever navigates to its own internal route constants, never to a URL derived from user input, so the vulnerable paths are not reachable here. Revisit when React Router 7 is adopted for other reasons.
- `vitest` / `@vitest/mocker` (path traversal). Fixed in 5.x. This affects test tooling only, and the suite never runs untrusted code or templates.

Run `npm audit fix` after any major dependency bump, and do not use `npm audit fix --force` without a migration.

### Other limitations

- Totals, discounts, shipping cost and tax are whatever the server returns; the browser never recomputes them. There is no payment gateway, so orders are recorded without being charged. `payment_method` (`upi` / `card` / `cod`) and `payment_status` exist server-side; `cod` adds a handling fee, and none of it is collected here.
- Guest cart and wishlist do not follow a shopper between devices before sign-in, by design.
- `AdminInventoryPage` loads the first 100 products, which is the API's maximum page size. A catalogue larger than that would need paged loading.
- Checkout collects only the fields the `users` table holds (name, email, phone, city); a shipping address would need schema changes first. The `orders` table already carries the address fields, so only collection is missing.
- The generated `dist/` directory is build output and should not be treated as source code.
- The runtime dependency list is four packages: React, React DOM, React Router and TanStack Query. HTTP, storage, routing and validation are hand-rolled, which is why there is no axios, no toast library and no form library.
- `vite.config.ts` restricts tests to `src/**/*.test.ts` and `@testing-library/react` is not a dependency, so **no component or hook can be rendered in a test**. Adding either would be the first step toward testing the login pages themselves; today they are covered only by the type checker, `authErrors.test.ts` and manual use.
- `StoreLoginPage` and `AdminLoginPage` are duplicated rather than sharing a form component. Any sign-in change must be made twice.
- Cart quantity is capped at 10 per line by the server (`QUANTITY_LIMIT_EXCEEDED`), which is lower than the 99 the request schema permits.
- The backend rate-limits credential attempts to 20 per 15 minutes per IP + email. With no captcha and no account lockout, that is the only brute-force defence, and it does not survive a distributed attack.
- `npm audit` on the backend reports that `cookie-signature` is a declared dependency that nothing imports. It is dead weight.
