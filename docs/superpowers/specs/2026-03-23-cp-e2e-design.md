# coffeeandpeppers.com E2E Test Suite — Design Spec
**Date:** 2026-03-23  
**Author:** Aidan (continuing from Shaleem Shahzad's foundation)  
**Repo:** https://github.com/Shaleem321/cp-e2e-tests

---

## Context

Shaleem built a solid Playwright + TypeScript + Allure foundation for coffeeandpeppers.com E2E testing. He implemented the full utility layer (`PlaywrightActionFactory`, `PlaywrightVerificationFactory`), the Page Object Model pattern, test fixtures, test data generation with Faker, and a working `beforeEach` that navigates to the site and dismisses the age gate. The spec body itself is a stub — `navigateToMenu()` is commented out and nothing beyond age gate dismissal is implemented.

This design picks up exactly where he left off and expands into a full-coverage suite, phased from basic to comprehensive.

---

## Goals

- Maximum automated coverage of coffeeandpeppers.com (customer-facing, eventually admin too)
- Phased delivery: Phase 1 = smoke + core checkout; Phase 2 = full regression; Phase 3 = admin/deep flows
- Tests run against production only (no staging environment exists)
- Zero permanent side effects on prod — test orders cleaned up immediately after each run
- Slot cleanly into Shaleem's existing architecture — no rewrites of his files

---

## Constraints

- **Prod only** — no staging or sandbox environment
- **Zelle payment** — no card processor; checkout flow ends with order confirmation (Zelle instructions page)
- **Research acknowledgment checkbox** — mandatory by WaaveCompliance / payment processor; removing it risks losing the merchant account; tests must verify it is required and cannot be bypassed
- **Order teardown required** — any placed test order must be deleted immediately via WP-CLI SSH; a 2-hour unconfirmed order alert fires to Dan, Colton, and Aidan
- **PowerShell** — local dev is Windows PowerShell; use semicolons not `&&` for command chaining; use base64 pipe for multi-line SSH writes
- **WP-CLI confirmed available** on the server (v2.12.0, running as `u748382507`, not root)
- **WC order CLI not available** — `wp wc order` is not registered; use `wp eval` approach instead

---

## Test Product on Production

Create one hidden WooCommerce product used by all checkout tests:

| Field | Value |
|---|---|
| Name | `E2E Test Item — DO NOT FULFILL` |
| Price | `$0.01` (not $0.00 — WooCommerce may skip payment method selection for zero-total orders) |
| Visibility | Hidden (not in shop, not searchable) |
| Stock | Always in stock, inventory tracking off |
| Type | Simple product (no variations — simplifies teardown path) |

URL stored in `config/.env.prod` as `TEST_PRODUCT_URL`.

**Important:** Verify manually after creating this product that the WooCommerce checkout still shows the Zelle payment method selection step and the research acknowledgment checkbox for a $0.01 order. If payment step is skipped, increase to $0.10.

---

## Architecture

Extends Shaleem's structure without modifying any of his existing files.

```
cp-e2e-tests/
├── config/
│   ├── .env.prod              # gitignored — see .env.example for required keys
│   └── .env.example           # committed template with placeholder values
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
│   └── cleanup-test-orders.ts  # standalone safety-net script (run manually or on schedule)
├── specs/
│   ├── setup/
│   │   └── e2e_checkout_flow.spec.ts  # Shaleem's stub — superseded by regression/checkout_flow.spec.ts; keep for reference
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
│   ├── playwright.actions.utils.ts          # Shaleem's — untouched
│   ├── playwright.verifications.utils.ts    # Shaleem's — untouched
│   ├── general.utils.ts                     # Shaleem's — untouched
│   ├── api.utils.ts                         # Shaleem's — untouched
│   ├── env.utils.ts                         # Shaleem's — untouched
│   ├── test.helper.utils.ts                 # Shaleem's — untouched
│   ├── testData.generate.utils.ts           # Shaleem's — untouched
│   └── wp.utils.ts                          # new: WP-CLI SSH order teardown
└── .github/
    └── workflows/
        ├── smoke.yml         # triggers on push to main
        └── regression.yml    # scheduled nightly 2am CT (08:00 UTC)
```

---

## Order Teardown Strategy

### Why `wp eval` not `wp post delete`

`wp wc order` is not available on this server. `wp post delete` is unreliable if HPOS (High-Performance Order Storage) is active or in sync mode. The correct approach is:

```bash
wp --path=/home/u748382507/domains/darkslategray-fish-207364.hostingersite.com/public_html \
  eval 'wc_get_order(ORDER_ID)->delete(true);'
```

`wc_get_order()` is WooCommerce-native and resolves the order regardless of storage backend (wp_posts or wp_wc_orders). `delete(true)` force-deletes (skips trash). This is HPOS-safe.

### Order ID Extraction

WooCommerce Thank You page URL with pretty permalinks:
```
/checkout/order-received/12345/?key=wc_order_abcdef
```

Regex to extract order ID: `/order-received\/(\d+)/`

WP CLI teardown uses the captured group (the integer order ID).

### Crash-Safe Safety Net

`afterEach` runs after every test (pass or fail), but if the Playwright process is killed or the SSH call itself throws, the order survives. Mitigations:

1. **`wp.utils.ts`** wraps the SSH delete in a try/catch and retries once before throwing
2. **`scripts/cleanup-test-orders.ts`** — a standalone script that queries WooCommerce for any order with the title matching `E2E Test Item` in the last 24 hours and deletes them. Run this manually after any CI incident, or add it as a nightly cron after the regression run.
3. **Naming convention** — the test product name `E2E Test Item — DO NOT FULFILL` makes orphaned orders easy to spot and delete manually from WP Admin if needed.

---

## Environment Config

### `config/.env.example` (committed to repo)

```
# Required — copy to .env.prod and fill in values
URL=https://coffeeandpeppers.com
cpURL=https://coffeeandpeppers.com
TEST_PRODUCT_URL=https://coffeeandpeppers.com/product/e2e-test-item-do-not-fulfill/
WP_PATH=/home/u748382507/domains/darkslategray-fish-207364.hostingersite.com/public_html
SSH_HOST=<hostinger-server-ip-or-hostname>
SSH_USER=u748382507
SSH_KEY_PATH=~/.ssh/id_rsa
IMAP_HOST=imap.gmail.com
IMAP_USER=coffeepepp@gmail.com
IMAP_PASS=<gmail-app-password>
IMAP_PORT=993
```

### CI SSH Authentication (GitHub Actions)

GitHub Actions runners have no `~/.ssh/config`. Two GitHub repository secrets required:

- `SSH_PRIVATE_KEY` — the private key corresponding to the public key added to `~/.ssh/authorized_keys` on the Hostinger server
- `SSH_KNOWN_HOSTS` — output of `ssh-keyscan <server-host>` for the server

Workflow setup step:
```yaml
- name: Configure SSH
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    echo "${{ secrets.SSH_KNOWN_HOSTS }}" >> ~/.ssh/known_hosts
```

`wp.utils.ts` in CI uses `SSH_HOST` and `SSH_USER` env vars directly rather than the `coffeeandpep` alias (which only exists in local `~/.ssh/config`).

---

## Phase 1 — Smoke Suite

All smoke specs tagged `@smoke`. Suite runs via `npm run test:smoke:prod`.

**`specs/smoke/homepage.spec.ts`** `@smoke`
- Page loads with no uncaught JS errors (check browser console)
- Hero section is visible
- Navigation bar is visible
- Footer is visible
- Age gate overlay is present before content interaction

**`specs/smoke/age_gate.spec.ts`** `@smoke`
- Age gate modal appears on first visit
- Clicking "I Am" dismisses the gate
- After dismissal, shop content is accessible
- Gate does not re-appear within the same session (page reload check)

**`specs/smoke/shop.spec.ts`** `@smoke`
- Shop page loads at `/shop`
- At least one product card is visible
- Clicking a product card navigates to the product detail page

> **Note:** A known bug exists where product images fail to load on desktop (1920×1080) due to a lazy-loading intersection observer issue. Asserting image visibility at this viewport would fail today and block the smoke gate. Image load verification is deferred to a separate `@bug` tagged test in the regression suite once the fix is confirmed deployed.

**`specs/smoke/product_page.spec.ts`** `@smoke`
- Navigate to a known in-stock product URL (hardcoded in test data, not random shop browsing)
- Product title and price are visible
- For variable products: variation selector (`<select>`) is present
- Add to Cart button is present

---

## Phase 1 — Core Checkout Regression

**`specs/regression/checkout_flow.spec.ts`** `@smoke @regression @checkout @e2e`

The primary end-to-end test. Uses the $0.01 test product. Steps:

1. Navigate directly to `TEST_PRODUCT_URL` (skip shop browsing — direct URL)
2. Accept age gate
3. Click "Add to Cart"
4. Navigate to `/cart`, verify "E2E Test Item" is present in the cart
5. Click "Proceed to Checkout"
6. Fill billing form:
   - First Name: `TestDataUtils.generateRandomFirstName()`
   - Last Name: `TestDataUtils.generateRandomLastName()`
   - Company: leave blank
   - Address: `TestDataUtils.generateRandomStreetAddress()`
   - City: hardcoded `"Phoenix"` (Faker city values may not match WooCommerce state pairings)
   - State: hardcoded `"AZ"` — WooCommerce renders state as a `<select>` dropdown; use `selectOption("AZ")`, NOT a Faker random value
   - ZIP: hardcoded `"85001"` (valid AZ ZIP)
   - Phone: `TestDataUtils.generateRandomMobile()`
   - Email: `TestDataUtils.generateRandomEmail()` scoped to a test domain (e.g., `test+{uuid}@coffeeandpeppers-test.com`)
7. Select Zelle as the payment method (click the Zelle radio button)
8. Check the research acknowledgment checkbox
9. Click "Place Order"
10. Assert current URL matches `/order-received/(\d+)/`
11. Assert "Thank you" text is visible on the page
12. Extract order ID from URL using regex `/order-received\/(\d+)/`
13. `afterEach`: call `wp.utils.deleteTestOrder(orderId)` — SSH executes `wp eval 'wc_get_order(ID)->delete(true);'`

---

## Phase 2 — Full Regression Suite

**`specs/regression/checkout_validation.spec.ts`** `@regression`
- Attempt Place Order with research checkbox unchecked → form is blocked, error message visible
- Attempt Place Order with First Name empty → inline validation error on First Name field
- Attempt Place Order with Email empty → inline validation error on Email field
- Attempt Place Order with Address empty → inline validation error on Address field
- (These are individual test cases, each starting from a filled form with one field cleared)

**`specs/regression/buy_now.spec.ts`** `@regression`
- Navigate to a variable product
- Before variation selected: Buy Now button (`.cp-buy-now-btn`) is disabled or absent
- Select an in-stock variation: Buy Now becomes enabled
- Select an out-of-stock variation (if available): Buy Now is disabled again
- Clicking enabled Buy Now navigates to checkout with item pre-loaded

**`specs/regression/cart.spec.ts`** `@regression`
- Add item to cart, navigate to `/cart`
- Increase quantity to 2 → cart total updates to 2x
- Remove item → cart shows empty state message
- Proceed to Checkout button is enabled when cart has items

**`specs/regression/coa_search.spec.ts`** `@regression`
- COA page loads
- Typing a product name into the search input filters the list in real time
- **Bug sentinel test (tagged `@bug`):** Search for a product whose name contains `&` — assert the result displays `&` (ampersand), not `&amp;` (HTML entity). This test is expected to FAIL until the bug is fixed. Tag `@bug` and document that a pass means the bug is resolved.
- Clearing the search restores all products

**`specs/regression/restock_status.spec.ts`** `@regression`
- Restock Status page loads without error
- At least one product status entry is visible
- "In Transit" label appears for products tagged as such

**`specs/regression/order_email.spec.ts`** `@regression`

Place a $0.01 test order (same as `checkout_flow.spec.ts`), then verify the WooCommerce confirmation email arrives.

IMAP polling details:
- Connect to Gmail via IMAP using `imap-simple` (dep already in `package.json`)
- Poll inbox every 5 seconds, up to 60 seconds total
- Search for unread emails with subject matching `Order #<orderId>`
- Assert at least one match found within the timeout
- Mark matched email as read
- Assert email body contains the order number
- `afterEach`: delete the test order via WP-CLI

De-duplication: each test run uses a unique email address (`test+{uuid}@...`) — the IMAP search filters by subject containing the specific order number, so prior test runs don't interfere.

---

## Phase 3 — Future (Not Scoped Now)

- Desktop image lazy-load bug verification (shop.spec.ts, once fix is deployed)
- WP Admin: login, order list, order status transitions
- WP Admin: inventory import via REST endpoint (`POST /wp-json/cp/v1/import-inventory`)
- Mobile viewport tests (375×812)
- Cross-browser: Firefox and WebKit (already commented in `playwright.config.ts`)
- Customer account creation and login flow (if applicable)
- Coupon code application in cart

---

## CI/CD

### `smoke.yml`

```yaml
on:
  push:
    branches: [main]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install chromium
      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          echo "${{ secrets.SSH_KNOWN_HOSTS }}" >> ~/.ssh/known_hosts
      - name: Create env file
        run: |
          echo "URL=${{ secrets.PROD_URL }}" > config/.env.prod
          echo "cpURL=${{ secrets.PROD_URL }}" >> config/.env.prod
          echo "TEST_PRODUCT_URL=${{ secrets.TEST_PRODUCT_URL }}" >> config/.env.prod
          echo "WP_PATH=${{ secrets.WP_PATH }}" >> config/.env.prod
          echo "SSH_HOST=${{ secrets.SSH_HOST }}" >> config/.env.prod
          echo "SSH_USER=${{ secrets.SSH_USER }}" >> config/.env.prod
      - run: npm run test:smoke:prod
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-results-smoke
          path: allure-results/
```

### `regression.yml`

```yaml
on:
  schedule:
    - cron: '0 8 * * *'   # 08:00 UTC = 2:00am CT (CST); shifts to 3:00am CT during CDT
jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      # same as smoke but runs: npm run test:prod
```

---

## Success Criteria for Phase 1

- [ ] `npm run test:smoke:prod` passes all 4 smoke specs without flakiness
- [ ] `npm run test:prod` runs smoke + `checkout_flow.spec.ts` end-to-end
- [ ] Test orders placed during the run are deleted from WooCommerce within 30s of test completion
- [ ] Allure report generates correctly with `npm run allure:generate`
- [ ] GitHub Actions smoke workflow triggers on push to `main` and reports pass/fail
- [ ] The $0.01 test product has been manually verified to show Zelle payment step and research checkbox
- [ ] SSH teardown verified manually: `wp eval 'wc_get_order(REAL_ORDER_ID)->delete(true);'` deletes the order cleanly
