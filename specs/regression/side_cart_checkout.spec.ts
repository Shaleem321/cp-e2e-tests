import { test } from '@fixtures/checkout.fixtures';
import { logTestCaseData } from '@utilities/test.helper.utils';
import { getCheckoutData } from '@data/app/checkout.data';

const scenario = getCheckoutData('side-cart-checkout');

test.beforeEach(async ({ checkoutPage }) => {
  await test.step('Navigate to test product', async () => {
    await checkoutPage.navigateToTestProduct();
  });

  await test.step('Accept age gate', async () => {
    await checkoutPage.acceptAgeGate();
  });
});

test(
  `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
  async ({ checkoutPage }, testInfo) => {
    logTestCaseData(testInfo, scenario.testCaseData);

    await test.step('Add product to cart', async () => {
      await checkoutPage.addToCart();
    });

    await test.step('Verify side cart panel opens with item', async () => {
      await checkoutPage.waitForSideCartToOpen();
    });

    await test.step('Click Checkout from side cart panel', async () => {
      await checkoutPage.clickCheckoutFromSideCart();
    });

    await test.step('Verify checkout page loaded', async () => {
      await checkoutPage.verifyCurrentUrlContains('/checkout/');
    });
  }
);
