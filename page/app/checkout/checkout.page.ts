import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { CheckoutFormData } from '@interfaces/checkout.form.interface';
import { getEnvVariable } from '@utilities/env.utils';

// WaaveCompliance note: company/entity/protocol KYC fields are CSS-hidden and
// auto-filled by the site on every updated_checkout event. Do not interact with them.

export class CheckoutPage {
  private readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };
  private readonly cpURL: string;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
    this.cpURL = getEnvVariable('cpURL');

    this.locators = {
      // Age gate
      ageGateAcceptButton: {
        description: 'Age gate accept button',
        locator: this.page.locator("//a[normalize-space()='I am']"),
      },

      // Product page
      addToCartButton: {
        description: 'Add to cart button',
        locator: this.page.locator('button[name="add-to-cart"], a.single_add_to_cart_button'),
      },
      viewCartLink: {
        description: 'View cart link (post add-to-cart notification)',
        locator: this.page.locator('.woocommerce-message a.button, .added_to_cart'),
      },

      // Cart page
      proceedToCheckoutButton: {
        description: 'Proceed to checkout button',
        locator: this.page.locator('a.checkout-button, .wc-proceed-to-checkout a'),
      },

      // Billing fields
      billingFirstName: {
        description: 'Billing first name',
        locator: this.page.locator('#billing_first_name'),
      },
      billingLastName: {
        description: 'Billing last name',
        locator: this.page.locator('#billing_last_name'),
      },
      billingAddress: {
        description: 'Billing address',
        locator: this.page.locator('#billing_address_1'),
      },
      billingCity: {
        description: 'Billing city',
        locator: this.page.locator('#billing_city'),
      },
      billingState: {
        description: 'Billing state (select)',
        locator: this.page.locator('#billing_state'),
      },
      billingZip: {
        description: 'Billing ZIP code',
        locator: this.page.locator('#billing_postcode'),
      },
      billingPhone: {
        description: 'Billing phone',
        locator: this.page.locator('#billing_phone'),
      },
      billingEmail: {
        description: 'Billing email',
        locator: this.page.locator('#billing_email'),
      },

      // WaaveCompliance acknowledgment:
      // Initial PHP render = child theme div#cp-ack-toggle (role=checkbox, controls a hidden input).
      // After every updated_checkout AJAX = plugin re-renders a real input[type=checkbox].
      // We always wait for networkIdle after Zelle selection so the AJAX-rendered checkbox is stable.
      researchAcknowledgmentToggle: {
        description: 'Research acknowledgment checkbox (post-AJAX plugin render)',
        locator: this.page.locator('input[type="checkbox"][name="waave_research_acknowledgment"]'),
      },

      // Payment
      zellePaymentRadio: {
        description: 'Zelle payment method radio',
        locator: this.page.locator('#payment_method_cp_zelle, input[value="cp_zelle"]'),
      },

      // WooCommerce terms and conditions checkbox (required to place order)
      termsAndConditionsCheckbox: {
        description: 'Terms and conditions checkbox',
        locator: this.page.locator('#terms, input[name="terms"]'),
      },

      // Place order
      placeOrderButton: {
        description: 'Place order button',
        locator: this.page.locator('#place_order'),
      },

      // Order confirmation
      orderConfirmationHeading: {
        description: 'Order confirmation heading',
        locator: this.page.locator('.woocommerce-order-received h2, h2.woocommerce-order-received__title, .entry-header h1'),
      },
    };
  }

  // ──────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────

  public async navigateToCoffeeAndPeppers(): Promise<void> {
    await test.step('Navigate to Coffee and Peppers', async () => {
      await this.actions.navigateToURL(this.cpURL);
      await this.actions.waitForDomLoad();
    });
  }

  public async navigateToTestProduct(): Promise<void> {
    await test.step('Navigate to test product', async () => {
      const productUrl = getEnvVariable('TEST_PRODUCT_URL');
      await this.actions.navigateToURL(productUrl);
      await this.actions.waitForDomLoad();
    });
  }

  // ──────────────────────────────────────────────
  // Age gate
  // ──────────────────────────────────────────────

  public async acceptAgeGate(): Promise<void> {
    await test.step('Accept the age gate', async () => {
      await this.actions.waitForSelector(this.locators.ageGateAcceptButton);
      await this.verify.waitForVisibility(this.locators.ageGateAcceptButton);
      await this.actions.click(this.locators.ageGateAcceptButton);
    });
  }

  // ──────────────────────────────────────────────
  // Product page → Cart
  // ──────────────────────────────────────────────

  public async addToCart(): Promise<void> {
    await test.step('Add product to cart', async () => {
      await this.actions.waitForSelector(this.locators.addToCartButton);
      await this.actions.click(this.locators.addToCartButton);
      await this.actions.waitForSelector(this.locators.viewCartLink, 15000);
    });
  }

  public async goToCart(): Promise<void> {
    await test.step('Navigate to cart page', async () => {
      // Navigate directly — more reliable than clicking the transient add-to-cart notification.
      // Site can be slow to DOMContentLoaded, so allow 60s.
      await this.page.goto(`${this.cpURL}/cart/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    });
  }

  public async proceedToCheckout(): Promise<void> {
    await test.step('Proceed to checkout', async () => {
      await this.actions.waitForSelector(this.locators.proceedToCheckoutButton);
      await this.actions.click(this.locators.proceedToCheckoutButton);
      await this.actions.waitForDomLoad();
      await this.actions.waitForSelector(this.locators.billingFirstName);
    });
  }

  // ──────────────────────────────────────────────
  // Checkout form
  // ──────────────────────────────────────────────

  public async fillBillingForm(data: CheckoutFormData): Promise<void> {
    await test.step('Fill billing form', async () => {
      await this.actions.sendKeys(this.locators.billingFirstName, data.firstName);
      await this.actions.sendKeys(this.locators.billingLastName, data.lastName);
      await this.actions.sendKeys(this.locators.billingAddress, data.address);
      await this.actions.sendKeys(this.locators.billingCity, data.city);

      await test.step('Select billing state', async () => {
        await this.locators.billingState.locator.selectOption(data.state);
      });

      await this.actions.sendKeys(this.locators.billingZip, data.zip);
      await this.actions.sendKeys(this.locators.billingPhone, data.phone);
      await this.actions.sendKeys(this.locators.billingEmail, data.email);
    });
  }

  public async checkTermsAndConditions(): Promise<void> {
    await test.step('Check terms and conditions', async () => {
      // Wait for any lingering blockUI overlays to clear before clicking T&C
      await this.page.locator('.blockUI').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
      await this.actions.waitForSelector(this.locators.termsAndConditionsCheckbox);
      // Force-click to bypass stability check — the T&C checkbox is in the payment section
      // which may have residual overlay from updated_checkout AJAX
      await this.locators.termsAndConditionsCheckbox.locator.click({ force: true });
    });
  }

  public async selectZellePayment(): Promise<void> {
    await test.step('Select Zelle as payment method', async () => {
      await this.actions.waitForSelector(this.locators.zellePaymentRadio);
      await this.actions.click(this.locators.zellePaymentRadio);
      // WooCommerce fires updated_checkout AJAX and blocks the form with .blockUI.
      // Wait for the block overlay to appear then disappear — reliable signal AJAX is done.
      // Catch: overlay may appear/disappear faster than our check, so both are optional.
      await this.page.locator('.blockUI').first().waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
      await this.page.locator('.blockUI').first().waitFor({ state: 'detached', timeout: 20000 });
    });
  }

  public async checkResearchAcknowledgment(): Promise<void> {
    await test.step('Check research acknowledgment', async () => {
      await this.actions.waitForSelector(this.locators.researchAcknowledgmentToggle);
      await this.actions.click(this.locators.researchAcknowledgmentToggle);
    });
  }

  public async placeOrder(): Promise<void> {
    await test.step('Click place order and wait for confirmation', async () => {
      // Ensure no WooCommerce blockUI overlay is active before submitting
      await this.page.locator('.blockUI').first().waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
      await this.actions.waitForSelector(this.locators.placeOrderButton);
      await this.actions.click(this.locators.placeOrderButton);
      // The Zelle gateway redirects to /zelle-payment/?order_id=... (not /order-received/).
      // Standard WC thank-you page uses /order-received/. Match both.
      await this.page.waitForURL(/order-received|zelle-payment/, { timeout: 45000 });
      await this.actions.waitForDomLoad();
    });
  }

  public async getOrderIdFromUrl(): Promise<string> {
    const url = this.page.url();
    // /checkout/order-received/12345/?key=...
    const pathMatch = url.match(/order-received\/(\d+)/);
    if (pathMatch) return pathMatch[1];
    // /zelle-payment/?order_id=12345&key=...
    const paramMatch = url.match(/[?&]order_id=(\d+)/);
    if (paramMatch) return paramMatch[1];
    throw new Error(`Could not extract order ID from URL: ${url}`);
  }
}
