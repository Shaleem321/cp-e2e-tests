import { Page, TestInfo, test } from "@playwright/test";
import { PlaywrightActionFactory } from "@utilities/playwright.actions.utils";
import { PlaywrightVerificationFactory } from "@utilities/playwright.verifications.utils";
import { LocatorInfo } from "@interfaces/locator.info.interface";
import { getEnvVariable } from "@utilities/env.utils";

/**
 * CheckoutPage - E2E checkout flow for the Luxodd app.
 * Update the locators in selectFirstGame, clickPlayOrPurchase, etc. to match your app's DOM.
 */
export class CheckoutPage {
  private readonly page: Page;
  private readonly testInfo: TestInfo;
  private readonly playwrightActionsFactory: PlaywrightActionFactory;
  private readonly playwrightVerificationsFactory: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };
  private readonly cpURL: string;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.playwrightActionsFactory = new PlaywrightActionFactory(page, testInfo);
    this.playwrightVerificationsFactory = new PlaywrightVerificationFactory(page, testInfo);
    this.cpURL = getEnvVariable("cpURL");

    this.locators = {
      ageGateAcceptButton: {
        description: "Age gate accept button",
        locator: this.page.locator("//a[normalize-space()='I am']"),
      },
    };
  }

  public async navigateToCoffeeAndPeppers(): Promise<void> {
    await test.step("Navigate to Coffee and Peppers", async () => {
      await this.playwrightActionsFactory.navigateToURL(this.cpURL);
      await this.playwrightActionsFactory.waitForDomLoad();
    });
  }

  public async acceptAgeGate(): Promise<void> {
    await test.step("Accept the Age gate", async () => {
      await this.playwrightActionsFactory.waitForSelector(this.locators.ageGateAcceptButton);
      await this.playwrightVerificationsFactory.waitForVisibility(this.locators.ageGateAcceptButton);
      await this.playwrightActionsFactory.click(this.locators.ageGateAcceptButton);
    });
  }


}
