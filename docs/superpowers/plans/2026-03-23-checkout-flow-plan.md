# Implementation Plan — Basic Checkout Flow
**Scope:** Complete the core add-to-cart → checkout → order confirmation E2E test  
**Repo:** C:\Users\aidan\cp-e2e-tests  
**Shaleem picks up:** buy-it-now test (tomorrow)

---

## Pre-flight (do once, manually)

- [ ] **P0** — Create the `$0.01` test product on coffeeandpeppers.com WP Admin:
  - Name: `E2E Test Item — DO NOT FULFILL`
  - Price: `$0.01`, Visibility: Hidden, Stock: In stock (no tracking)
  - Copy the product slug URL into `config/.env.prod` as `TEST_PRODUCT_URL`
  - Manually verify: add to cart → checkout → Zelle payment step appears → research checkbox appears
- [ ] **P0** — Verify SSH teardown works:
  - Place a real order on prod via browser
  - Run: `ssh coffeeandpep "cd /home/u748382507/domains/darkslategray-fish-207364.hostingersite.com/public_html; wp eval 'wc_get_order(ORDER_ID)->delete(true);'"`
  - Confirm the order disappears from WP Admin

---

## Step 1 — Config and Environment

**Files to create:**

`config/.env.example` (committed)
```
URL=https://coffeeandpeppers.com
cpURL=https://coffeeandpeppers.com
TEST_PRODUCT_URL=https://coffeeandpeppers.com/product/e2e-test-item-do-not-fulfill/
WP_PATH=/home/u748382507/domains/darkslategray-fish-207364.hostingersite.com/public_html
SSH_HOST=<hostinger-server-hostname-or-ip>
SSH_USER=u748382507
```

`config/.env.prod` (gitignored — fill in real values)

Update `.gitignore` to ensure `config/.env.prod` is excluded (add `config/.env.prod` if not already covered).

Update `playwright.config.ts` — change `dotenv.config` path from `./config/.env.${env}` (already correct) — confirm the `config/` directory is being found.

---

## Step 2 — WP-CLI Teardown Utility

**File:** `utilities/wp.utils.ts`

```typescript
import { execSync } from 'node:child_process';
import { getEnvVariable } from './env.utils';

export function deleteTestOrder(orderId: string): void {
  const wpPath = getEnvVariable('WP_PATH');
  const sshHost = getEnvVariable('SSH_HOST');
  const sshUser = getEnvVariable('SSH_USER');

  const phpSnippet = `wc_get_order(${orderId})->delete(true);`;
  const cmd = `ssh -o StrictHostKeyChecking=no ${sshUser}@${sshHost} "cd ${wpPath}; wp eval '${phpSnippet}'"`;

  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch {
    // retry once
    execSync(cmd, { stdio: 'pipe' });
  }
}
```

---

## Step 3 — Checkout Form Interface

**File:** `interfaces/checkout.form.interface.ts`

```typescript
export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;   // 'AZ' — used with selectOption()
  zip: string;
  phone: string;
  email: string;
}
```

---

## Step 4 — Expand CheckoutPage

**File:** `page/app/checkout/checkout.page.ts` — add new methods below the existing two.

New locators to add in constructor:
- `addToCartButton` — `button[name="add-to-cart"]` or `[data-product_id] .add_to_cart_button`
- `viewCartLink` — `.woocommerce-message a.button` (the "View Cart" link that appears after add to cart)
- `proceedToCheckoutButton` — `.checkout-button` or `a.checkout-button`
- `billingFirstName` — `#billing_first_name`
- `billingLastName` — `#billing_last_name`
- `billingAddress` — `#billing_address_1`
- `billingCity` — `#billing_city`
- `billingState` — `#billing_state` (select element)
- `billingZip` — `#billing_postcode`
- `billingPhone` — `#billing_phone`
- `billingEmail` — `#billing_email`
- `zellePaymentRadio` — `input[value="zelle"]` or similar (inspect live to confirm)
- `researchCheckbox` — inspect live to confirm selector (WaaveCompliance checkbox)
- `placeOrderButton` — `#place_order`
- `orderConfirmationHeading` — `.woocommerce-order-received h2` or `h1.entry-title`

New methods:
- `addToCart()` — click add to cart, wait for view cart link
- `goToCart()` — navigate to `/cart`
- `proceedToCheckout()` — click proceed to checkout button, wait for checkout form
- `fillBillingForm(data: CheckoutFormData)` — fill all billing fields; use `selectOption` for state
- `selectZellePayment()` — click Zelle radio button
- `checkResearchAcknowledgment()` — click the research acknowledgment checkbox
- `placeOrder()` — click Place Order, wait for URL to match `/order-received/`
- `getOrderIdFromUrl()` — extract order ID integer from current URL using regex

---

## Step 5 — Test Data

**File:** `data/app/checkout.data.ts`

Add a `checkout-flow-basic` test case entry with:
- tags: `@regression @smoke @checkout @e2e`
- testCase: `checkout-flow-basic`
- testDescription: describe the flow
- testSummary: one-liner

Import `TestDataUtils` to generate `CheckoutFormData`:
```typescript
export function generateCheckoutFormData(): CheckoutFormData {
  return {
    firstName: TestDataUtils.generateRandomFirstName(),
    lastName: TestDataUtils.generateRandomLastName(),
    address: TestDataUtils.generateRandomStreetAddress(),
    city: 'Phoenix',
    state: 'AZ',
    zip: '85001',
    phone: TestDataUtils.generateRandomMobile(),
    email: `test+${Date.now()}@coffeeandpeppers-test.com`,
  };
}
```

---

## Step 6 — Write the Spec

**File:** `specs/regression/checkout_flow.spec.ts`

```typescript
import { test } from '@fixtures/checkout.fixtures';
import { generateCheckoutFormData } from '@data/app/checkout.data';
import { deleteTestOrder } from '@utilities/wp.utils';
import { getEnvVariable } from '@utilities/env.utils';

let orderId: string | null = null;

test.beforeEach(async ({ checkoutPage }) => {
  await test.step('Navigate to test product', async () => {
    await checkoutPage.navigateToURL(getEnvVariable('TEST_PRODUCT_URL'));
  });
  await test.step('Accept age gate', async () => {
    await checkoutPage.acceptAgeGate();
  });
});

test.afterEach(async () => {
  if (orderId) {
    deleteTestOrder(orderId);
    orderId = null;
  }
});

test('@smoke @regression @checkout @e2e — basic checkout flow', async ({ checkoutPage }) => {
  const formData = generateCheckoutFormData();

  await test.step('Add to cart', async () => {
    await checkoutPage.addToCart();
  });

  await test.step('Go to cart and proceed to checkout', async () => {
    await checkoutPage.goToCart();
    await checkoutPage.proceedToCheckout();
  });

  await test.step('Fill billing form', async () => {
    await checkoutPage.fillBillingForm(formData);
  });

  await test.step('Select Zelle payment', async () => {
    await checkoutPage.selectZellePayment();
  });

  await test.step('Check research acknowledgment', async () => {
    await checkoutPage.checkResearchAcknowledgment();
  });

  await test.step('Place order and verify confirmation', async () => {
    await checkoutPage.placeOrder();
    orderId = await checkoutPage.getOrderIdFromUrl();
  });
});
```

---

## Step 7 — Update tsconfig paths

`tsconfig.json` already has path aliases. Confirm `@data/*` and `@utilities/*` resolve correctly. Add `@fixtures/*` if not present.

---

## Step 8 — Run and Verify

```powershell
cd C:\Users\aidan\cp-e2e-tests
npm install
npx playwright install chromium
npm run test:prod
```

Watch for:
1. Age gate dismissed
2. Product added to cart
3. Billing form filled
4. Zelle radio selected
5. Research checkbox checked
6. Order confirmation URL with order ID
7. SSH teardown deletes the order (check WP Admin to confirm)

---

## Step 9 — Commit and Push

```powershell
cd C:\Users\aidan\cp-e2e-tests
git add .
git commit -m "feat: implement basic checkout flow E2E test"
git push origin main
```

---

## Shaleem picks up next:
- `specs/regression/buy_now.spec.ts` — buy-it-now button test
- `page/app/product/product.page.ts` — product page object for variation selection
