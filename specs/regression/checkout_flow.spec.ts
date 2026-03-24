import { test } from '@fixtures/checkout.fixtures';
import { logTestCaseData } from '@utilities/test.helper.utils';
import { getCheckoutData, generateCheckoutFormData } from '@data/app/checkout.data';
import { deleteTestOrder } from '@utilities/wp.utils';

const checkoutScenario = getCheckoutData('checkout-flow-basic');
let orderId: string | null = null;

test.beforeEach(async ({ checkoutPage }) => {
  await test.step('Navigate to test product', async () => {
    await checkoutPage.navigateToTestProduct();
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

test(
  `
    Test case: '${checkoutScenario.testCaseData.testCase}'
    Description: '${checkoutScenario.testCaseData.testDescription}'
    Tags: '${checkoutScenario.testCaseData.tags}'
  `,
  async ({ checkoutPage }, testInfo) => {
    logTestCaseData(testInfo, checkoutScenario.testCaseData);

    const formData = generateCheckoutFormData();

    await test.step('Add product to cart', async () => {
      await checkoutPage.addToCart();
    });

    await test.step('Go to cart and proceed to checkout', async () => {
      await checkoutPage.goToCart();
      await checkoutPage.proceedToCheckout();
    });

    await test.step('Fill billing details', async () => {
      await checkoutPage.fillBillingForm(formData);
    });

    await test.step('Select Zelle payment method', async () => {
      await checkoutPage.selectZellePayment();
    });

    await test.step('Accept research acknowledgment', async () => {
      await checkoutPage.checkResearchAcknowledgment();
    });

    await test.step('Accept terms and conditions', async () => {
      await checkoutPage.checkTermsAndConditions();
    });

    await test.step('Place order and verify confirmation', async () => {
      await checkoutPage.placeOrder();
      orderId = await checkoutPage.getOrderIdFromUrl();
    });
  }
);
