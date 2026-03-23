import { test as base } from "@playwright/test";
import { CheckoutPage } from "@page/app/checkout/checkout.page";

type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
};

export const test = base.extend<CheckoutFixtures>({
  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page, base.info());
    await use(checkoutPage);
  },
});
