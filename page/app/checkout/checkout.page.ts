import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { CheckoutFormData } from '@interfaces/checkout.form.interface';
import { getEnvVariable } from '@utilities/env.utils';

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

      // WaaveCompliance KYC fields
      waaveCompanyName: {
        description: 'WaaveCompliance company/institution name',
        locator: this.page.locator('#waave_company_name'),
      },
      waaveResearchEntity: {
        description: 'WaaveCompliance research entity (select)',
        locator: this.page.locator('#waave_research_entity'),
      },
      waaveResearchProtocol: {
        description: 'WaaveCompliance research protocol (select)',
        locator: this.page.locator('#waave_research_protocol'),
      },
      researchAcknowledgmentToggle: {
        description: 'Research acknowledgment toggle (custom div)',
        locator: this.page.locator('#cp-ack-toggle'),
      },
      researchAcknowledgmentHidden: {
        description: 'Research acknowledgment hidden input',
        locator: this.page.locator('#cp_waave_ack_hidden'),
      },

      // Payment
      zellePaymentRadio: {
        description: 'Zelle payment method radio',
        locator: this.page.locator('#payment_method_cp_zelle, input[value="cp_zelle"]'),
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
    await test.step('Navigate to cart', async () => {
      await this.actions.navigateToURL(`${this.cpURL}/cart/`);
      await this.actions.waitForDomLoad();
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

  public async fillWaaveComplianceFields(data: CheckoutFormData): Promise<void> {
    await test.step('Fill WaaveCompliance KYC fields', async () => {
      await this.actions.waitForSelector(this.locators.waaveCompanyName);
      await this.actions.sendKeys(this.locators.waaveCompanyName, data.companyName);

      await test.step('Select research entity', async () => {
        await this.locators.waaveResearchEntity.locator.selectOption(data.researchEntity);
      });

      await test.step('Select research protocol', async () => {
        await this.locators.waaveResearchProtocol.locator.selectOption(data.researchProtocol);
      });
    });
  }

  public async selectZellePayment(): Promise<void> {
    await test.step('Select Zelle as payment method', async () => {
      await this.actions.waitForSelector(this.locators.zellePaymentRadio);
      await this.actions.click(this.locators.zellePaymentRadio);
    });
  }

  public async checkResearchAcknowledgment(): Promise<void> {
    await test.step('Check research acknowledgment', async () => {
      await this.actions.waitForSelector(this.locators.researchAcknowledgmentToggle);
      await this.locators.researchAcknowledgmentToggle.locator.scrollIntoViewIfNeeded();
      await this.actions.click(this.locators.researchAcknowledgmentToggle);

      const hiddenValue = await this.locators.researchAcknowledgmentHidden.locator.inputValue();
      if (hiddenValue !== '1') {
        throw new Error('Research acknowledgment was not accepted — hidden input value is not "1"');
      }
    });
  }

  public async placeOrder(): Promise<void> {
    await test.step('Click place order and wait for confirmation', async () => {
      await this.actions.waitForSelector(this.locators.placeOrderButton);
      await this.actions.click(this.locators.placeOrderButton);
      await this.page.waitForURL(/order-received/, { timeout: 45000 });
      await this.actions.waitForDomLoad();
    });
  }

  public async getOrderIdFromUrl(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/order-received\/(\d+)/);
    if (!match) {
      throw new Error(`Could not extract order ID from URL: ${url}`);
    }
    return match[1];
  }
}
