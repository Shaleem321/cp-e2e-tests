# coffeeandpeppers.com E2E Test Suite — Design Spec
**Date:** 2026-03-23  
**Author:** Aidan (continuing from Shaleem Shahzad's foundation)  
**Repo:** https://github.com/Shaleem321/cp-e2e-tests

---

## Context

Shaleem built a solid Playwright + TypeScript + Allure foundation for coffeeandpeppers.com E2E testing. He implemented the full utility layer (`PlaywrightActionFactory`, `PlaywrightVerificationFactory`), the Page Object Model pattern, test fixtures, test data generation with Faker, and a working `beforeEach` that navigates to the site and dismisses the age gate. The spec body itself is a stub — `navigateToMenu()` is commented out and nothing beyond age gate dismissal is implemented.

This design picks up exactly where he left off and expands into a full-coverage suite.

---

## Goals

- Maximum automated coverage of coffeeandpeppers.com (customer-facing, eventually admin too)
- Phased delivery: start with smoke/basic, layer in regression, then admin panel
- Tests run against production only (no staging environment exists)
- Zero permanent side effects on prod — test orders cleaned up immediately after each run
- Slot cleanly into Shaleem's existing architecture — no rewrites

---

## Constraints

- **Prod only** — no staging or sandbox environment
- **Zelle payment** — no card processor; checkout flow ends with Zelle selection, not real payment capture
- **Research acknowledgment checkbox** — mandatory by WaaveCompliance / payment processor; tests must verify it is required and cannot be bypassed
- **Order teardown required** — any placed test order must be deleted immediately via WP-CLI SSH before alerts fire (2-hour unconfirmed order alert goes to Dan, Colton, and Aidan)
- **PowerShell** — local dev is Windows PowerShell; use semicolons not `&&` for command chaining; use base64 pipe for multi-line SSH writes

---

## Test Product on Production

Create one hidden WooCommerce product used by all checkout tests:

| Field | Value |
|---|---|
| Name | `E2E Test Item — DO NOT FULFILL` |
| Price | `$0.00` |
| Visibility | Hidden (not in shop, not searchable) |
| Stock | Always in stock, inventory tracking off |
| Variable | No (simple product to avoid variation selection in teardown path) |

URL stored in `config/.env.prod` as `TEST_PRODUCT_URL`. All checkout spec files navigate directly to this URL — no shop browsing needed for the order placement path.

---

## Architecture

Extends Shaleem's structure without modifying his existing files.

```
cp-e2e-tests/
├── config/
│   ├── .env.prod              # URL, cpURL, TEST_PRODUCT_URL, IMAP creds, SSH details
│   └── .env.example           # committed template showing required keys
├── data/
│   ├── admin/checkout/        # Shaleem's — untouched
│   └── app/
│       ├── homepage.data.ts
│       ├── shop.data.ts
│       ├── product.data.ts
│       ├── cart.data.ts
│       ├── checkout.data.ts   # expands Shaleem's checkout data
│       └── coa.data.ts
├── fixtures/
│   ├── checkout.fixtures.ts   # Shaleem's — untouched
│   └── base.fixtures.ts       # shared fixture wiring all page objects
├── interfaces/
│   ├── locator.info.interface.ts       # Shaleem's — untouched
│   ├── testcase.data.interface.ts      # Shaleem's — untouched
│   └── checkout.form.interface.ts      # new: typed checkout form fields
├── page/app/
│   ├── checkout/checkout.page.ts  # Shaleem's — expanded with new methods
│   ├── homepage/homepage.page.ts
│   ├── shop/shop.page.ts
│   ├── product/product.page.ts
│   ├── cart/cart.page.ts
│   └── coa/coa.page.ts
├── scripts/
│   └── teardown.ts            # WP-CLI SSH order deletion utility
├── specs/
│   ├── setup/
│   │   └── e2e_checkout_flow.spec.ts  # Shaleem's stub — will be replaced by regression/checkout_flow.spec.ts
│   ├── smoke/
│   │   ├── homepage.spec.ts
│   │   ├── age_gate.spec.ts
│   │   ├── shop.spec.ts
│   │   └── product_page.spec.ts
│   └── regression/
│       ├── checkout_flow.spec.ts
│       ├── checkout_validation.spec.ts
│       ├── buy_now.spec.ts
│       ├── cart.spec.ts
│       ├── coa_search.spec.ts
│       ├── restock_status.spec.ts
│       └── order_email.spec.ts
├── utilities/
│   ├── playwright.actions.utils.ts     # Shaleem's — untouched
│   ├── playwright.verifications.utils.ts # Shaleem's — untouched
│   ├── general.utils.ts                # Shaleem's — untouched
│   ├── api.utils.ts                    # Shaleem's — untouched
│   ├── env.utils.ts                    # Shaleem's — untouched
│   ├── test.helper.utils.ts            # Shaleem's — untouched
│   ├── testData.generate.utils.ts      # Shaleem's — untouched
│   └── wp.utils.ts                     # new: WP-CLI SSH teardown helpers
└── .github/
    └── workflows/
        ├── smoke.yml          # triggers on push to main
        └── regression.yml     # scheduled nightly 2am CT
```

---

## Phase 1 — Delivered Now (Basic / Smoke)

### Smoke Suite

**`specs/smoke/homepage.spec.ts`** `@smoke`
- Page loads with HTTP 200
- No console errors on load
- Hero section, navigation, and footer visible
- Age gate appears before content is accessible

**`specs/smoke/age_gate.spec.ts`** `@smoke`
- Age gate modal is visible on first visit
- "I Am" button dismisses the gate
- After dismissal, shop content is accessible
- Gate does not re-appear within the same session

**`specs/smoke/shop.spec.ts`** `@smoke`
- Shop page loads at `/shop`
- At least one product card is visible
- Product images load at 1920×1080 viewport (validates the known lazy-loading desktop bug)
- Clicking a product card navigates to the product detail page

**`specs/smoke/product_page.spec.ts`** `@smoke`
- Product detail page loads
- Product title and price are visible
- For variable products: variation selector is present
- Add to Cart button is visible (and disabled/enabled based on variation selection)

### Phase 1 Regression (Core Checkout)

**`specs/regression/checkout_flow.spec.ts`** `@smoke @regression @checkout @e2e`  
The primary end-to-end test. Uses the `$0` test product.

Steps:
1. Navigate to `TEST_PRODUCT_URL` directly
2. Accept age gate
3. Click "Add to Cart"
4. Navigate to cart, verify item present
5. Click "Proceed to Checkout"
6. Fill billing form using `TestDataUtils` (Faker-generated: name, email, phone, address, city, state, ZIP)
7. Select Zelle as payment method
8. Check the research acknowledgment checkbox
9. Click "Place Order"
10. Assert Thank You page loads with an order number in the URL (`/checkout/order-received/{id}/`)
11. Capture order ID from URL
12. `afterEach`: call `wp.utils.ts` to SSH-delete the order via WP-CLI

---

## Phase 2 — Regression Suite (Queued)

**`specs/regression/checkout_validation.spec.ts`** `@regression`
- Attempt to place order without checking research acknowledgment → form blocked, error shown
- Attempt to place order with empty required fields (name, email, address) → inline field errors
- Verify each required field individually triggers validation

**`specs/regression/buy_now.spec.ts`** `@regression`
- Buy Now button (`cp-buy-now-btn`) is disabled when no variation selected
- Enabled when in-stock variation selected (`variation.is_purchasable && variation.is_in_stock`)
- Remains disabled or hidden when out-of-stock variation selected
- Clicking Buy Now on in-stock variation navigates directly to checkout with item pre-loaded

**`specs/regression/cart.spec.ts`** `@regression`
- Add item to cart, navigate to cart
- Update quantity → total updates
- Remove item → cart shows empty state
- Proceed to Checkout button active when cart has items

**`specs/regression/coa_search.spec.ts`** `@regression`
- COA page loads
- Search input filters product list in real time (client-side)
- Searching for a product with `&` in its name returns correct results (not `&amp;`)
- Clearing the search shows all products

**`specs/regression/restock_status.spec.ts`** `@regression`
- Restock Status page loads
- Page displays at least one product status entry
- In-Transit products show the correct status label

**`specs/regression/order_email.spec.ts`** `@regression`
- Place a $0 test order (same flow as `checkout_flow.spec.ts`)
- Wait for IMAP confirmation email to arrive (timeout: 60s)
- Verify email subject contains the order number
- Verify email is addressed to the test email used in the form
- `afterEach`: delete the test order via WP-CLI

---

## Phase 3 — Future (Admin Panel + Deep Flows)

- WP Admin: login, order list loads, order status transitions
- WP Admin: inventory import via REST endpoint
- Admin order management: mark order Processing, generate label flow
- Customer account flows (if applicable)
- Mobile viewport tests
- Cross-browser (Firefox, WebKit — currently commented out in config)

---

## Order Teardown Utility (`wp.utils.ts`)

```typescript
// Pseudocode — actual implementation uses node:child_process to ssh
export async function deleteTestOrder(orderId: string): Promise<void> {
  // SSH to coffeeandpep server
  // Run: wp post delete {orderId} --force --allow-root
  // Verify: exit code 0
  // Throw if deletion fails (fail loudly — don't silently leave orders)
}
```

The order ID is extracted from the Thank You page URL pattern:  
`/checkout/order-received/{orderId}/view-order/{key}/`

---

## Environment Config (`config/.env.prod`)

```
URL=https://coffeeandpeppers.com
cpURL=https://coffeeandpeppers.com
TEST_PRODUCT_URL=https://coffeeandpeppers.com/product/e2e-test-item/
IMAP_HOST=imap.gmail.com
IMAP_USER=coffeepepp@gmail.com
IMAP_PASS=<app-password>
SSH_ALIAS=coffeeandpep
WP_PATH=/home/u748382507/domains/darkslategray-fish-207364.hostingersite.com/public_html
```

`.env.prod` is gitignored. `config/.env.example` (committed) shows all required keys with placeholder values.

---

## CI/CD

**`.github/workflows/smoke.yml`**
- Trigger: push to `main`
- Runs: `npm run test:smoke:prod`
- Reports: Allure results uploaded as artifact

**`.github/workflows/regression.yml`**
- Trigger: `schedule` — `0 8 * * *` (2am CT / 8am UTC)
- Runs: `npm run test:prod`
- Reports: Allure results uploaded as artifact
- On failure: GitHub Actions email notification

---

## Playwright Config Updates Required

The current `playwright.config.ts` is missing a `config/` directory reference. Update `dotenv.config` path to `./config/.env.${env}` (it already reads this correctly — just need the directory to exist).

The existing `projects` array only has `Chromium`. No changes needed for Phase 1. Firefox/WebKit are already commented in and can be uncommented for Phase 3.

---

## Success Criteria for Phase 1

- [ ] `npm run test:smoke:prod` runs and passes all 4 smoke specs
- [ ] `npm run test:prod` runs the smoke + basic regression suite
- [ ] Test orders placed during regression are deleted from WooCommerce within 30s of test completion
- [ ] Allure report generates correctly with `npm run allure:generate`
- [ ] GitHub Actions smoke workflow runs on push and reports pass/fail
