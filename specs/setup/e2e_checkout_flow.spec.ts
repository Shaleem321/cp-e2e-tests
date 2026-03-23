import { logTestCaseData } from "@utilities/test.helper.utils";
import { getCheckoutData } from "@data/admin/checkout/checkout.data";
import { test } from "@fixtures/checkout.fixtures";

const checkoutScenario = getCheckoutData("e2e-checkout-flow");

test.beforeEach(async ({ checkoutPage }) => {
  await test.step("Navigate to the Coffee and Peppers", async () => {
    await checkoutPage.navigateToCoffeeAndPeppers();
  });

  await test.step("Accept the Age gate", async () => {
    await checkoutPage.acceptAgeGate();
  });
});

test(
  `
    Test case: '${checkoutScenario.testCaseData.testCase}'
    Description: '${checkoutScenario.testCaseData.testDescription}'
    Tags: '${checkoutScenario.testCaseData.tags}'
  `,
  async ({ checkoutPage }) => {
    logTestCaseData(test.info(), checkoutScenario.testCaseData);

    await test.step("Navigate to the Shop", async () => {
      // await checkoutPage.navigateToMenu();
    });
  }
);
