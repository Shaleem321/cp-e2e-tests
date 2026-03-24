import { TestCaseData } from '@interfaces/testcase.data.interface';
import { CheckoutFormData } from '@interfaces/checkout.form.interface';
import { TestDataUtils } from '@utilities/testData.generate.utils';

interface CheckoutTestCase {
  testCaseData: TestCaseData;
}

const checkoutTestData: { [key: string]: CheckoutTestCase } = {
  'side-cart-view-cart': {
    testCaseData: {
      tags: '@regression @smoke @cart @side-cart',
      testCase: 'side-cart-view-cart',
      testDescription: 'Add product to cart, verify side cart panel opens and shows the item, click View Cart, verify cart page loads',
      testSummary: 'Side cart panel opens on add-to-cart and View Cart navigates correctly',
    },
  },
  'side-cart-checkout': {
    testCaseData: {
      tags: '@regression @smoke @cart @side-cart',
      testCase: 'side-cart-checkout',
      testDescription: 'Add product to cart, verify side cart panel opens and shows the item, click Checkout, verify checkout page loads',
      testSummary: 'Side cart panel opens on add-to-cart and Checkout navigates correctly',
    },
  },
  'checkout-flow-basic': {
    testCaseData: {
      tags: '@regression @smoke @checkout @e2e',
      testCase: 'checkout-flow-basic',
      testDescription: 'Validate end-to-end checkout: navigate to product, add to cart, fill billing and WaaveCompliance fields, select Zelle payment, accept research acknowledgment, place order, and verify confirmation page',
      testSummary: 'User can complete full checkout from product page to order confirmation',
    },
  },
};

export function getCheckoutData(testCase: string): CheckoutTestCase {
  const data = checkoutTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}

export function generateCheckoutFormData(): CheckoutFormData {
  return {
    firstName: TestDataUtils.generateRandomFirstName(),
    lastName: TestDataUtils.generateRandomLastName(),
    address: TestDataUtils.generateRandomStreetAddress(),
    city: 'Phoenix',
    state: 'AZ',
    zip: '85001',
    phone: TestDataUtils.generateRandomMobile(),
    // Timestamp in email makes each run unique and lets the cleanup script
    // identify test orders by email pattern if order ID teardown fails
    email: `test+${Date.now()}@coffeeandpeppers-test.com`,
    // WaaveCompliance KYC fields auto-filled by the site JS — still typed here
    // so the interface stays complete, but the test does not interact with them
    companyName: 'E2E Test Research Labs',
    researchEntity: 'lab_research',
    researchProtocol: 'exploratory',
  };
}
