import { TestCaseData } from "@interfaces/testcase.data.interface";

interface CheckoutTestCaseData {
  testCaseData: TestCaseData;
  skipFlag?: string;
}

const checkoutTestData: { [key: string]: CheckoutTestCaseData } = {
  "e2e-checkout-flow": {
    testCaseData: {
      tags: "@regression @smoke @checkout @e2e",
      testCase: "e2e-checkout-flow",
      testDescription: "Validate end-to-end checkout flow: browse game, add to cart, payment, and confirmation",
      testSummary: "Verify user can complete full checkout from game selection to order confirmation",
    },
    skipFlag: process.env.skipGlobalLogin ?? "false",
  },
};

export function getCheckoutData(testCase: string): CheckoutTestCaseData {
  const data = checkoutTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
