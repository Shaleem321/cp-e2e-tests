import { LocatorInfo } from "@interfaces/locator.info.interface";
import { expect, Page, test, TestInfo } from "@playwright/test";
import { PlaywrightActionFactory } from "@utilities/playwright.actions.utils";

export class  PlaywrightVerificationFactory {
  private readonly page: Page;
  private readonly testInfo: TestInfo;
  private readonly playwrightActionsFactory: PlaywrightActionFactory;

  /**
   * @param page
   * @param testInfo
   */
  public constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.playwrightActionsFactory = new PlaywrightActionFactory(page, testInfo);
  }

  public maskValue(value: string): string {
    return "*".repeat(value.length); // Masks the value with asterisks
  }

  public async waitForVisibility(locatorInfo: LocatorInfo, timeout: number = 30000): Promise<void> {
    const effectiveTimeout = typeof timeout === "number" ? timeout : 30000;

    await test.step(
      `⏳ Waiting for "${locatorInfo.description}" to be visible (timeout: ${effectiveTimeout}ms)`,
      async (): Promise<void> => {
        await locatorInfo.locator.waitFor({ state: "visible", timeout: effectiveTimeout });
        await this.testInfo.attach(`⏳ "${locatorInfo.description}" is visible`, {
          body: `⏳ "${locatorInfo.description}" is visible`,
          contentType: "text/plain",
        });
      },
    );
  }

  public async expectElementExist(locatorInfo: LocatorInfo): Promise<void> {
    await test.step(`🧪 Verifying if "${locatorInfo.description}" exists`, async (): Promise<void> => {
      const isVisible = await locatorInfo.locator.isVisible();
      if (isVisible) {
        await this.playwrightActionsFactory.embedFullPageScreenshot(
          `✅ "${locatorInfo.description}" exists and is visible - Screenshot`
        );
        await this.testInfo.attach(`✅ "${locatorInfo.description}" exists and is visible`, {
          body: `✅ "${locatorInfo.description}" exists and is visible`,
          contentType: "text/plain",
        });
      } else {
        await this.playwrightActionsFactory.embedFullPageScreenshot(
          `💥 "${locatorInfo.description}" does NOT exist or is not visible - Screenshot`
        );
        await this.testInfo.attach(`💥 "${locatorInfo.description}" does NOT exist or is not visible`, {
          body: `💥 "${locatorInfo.description}" does NOT exist or is not visible`,
          contentType: "text/plain",
        });
      }
      await expect(locatorInfo.locator).toBeVisible();
    });
  }
  

  public async waitForSelector(locatorInfo: LocatorInfo, timeout?: number): Promise<void> {
    const effectiveTimeout = typeof timeout === "number" ? timeout : 30000;

    await test.step(
      `⏳ Waiting for "${locatorInfo.description}" to be visible (timeout: ${effectiveTimeout}ms)`,
      async (): Promise<void> => {
        await locatorInfo.locator.waitFor({ state: "attached", timeout: effectiveTimeout });
        await this.testInfo.attach(`⏳ "${locatorInfo.description}" is visible`, {
          body: `⏳ "${locatorInfo.description}" is visible`,
          contentType: "text/plain",
        });
      },
    );
  }

  public async getText(locatorInfo: LocatorInfo): Promise<null | string> {
    const elementTextContent = await test.step(`🐾 "${locatorInfo.description}" text is obtained`, async (): Promise<
      null | string
    > => {
      return locatorInfo.locator.textContent();
    });
    return elementTextContent;
  }

  public async verifyText(locatorInfo: LocatorInfo, strExpectedText: string, mask = false): Promise<void> {
    const displayedText = mask ? this.maskValue(strExpectedText) : strExpectedText;

    await test.step(`🧪 Verifying if "${locatorInfo.description}" text is displayed`, async (): Promise<void> => {
      const actualText: null | string = await this.getText(locatorInfo);

      if (actualText?.includes(strExpectedText)) {
        await this.playwrightActionsFactory.embedFullPageScreenshot(
          `✅ "${locatorInfo.description}" text is displayed as Expected = "${displayedText}" ;
           Actual = "${actualText}" - Screenshot`
        );
        await this.testInfo.attach(
          `✅ "${locatorInfo.description}" text is displayed as Expected = "${displayedText}" ;
           Actual = "${actualText}"`,
          {
            body: `✅ "${locatorInfo.description}" text is displayed as expected = "${displayedText}" ;
             actual = "${actualText}"`,
            contentType: "text/plain",
          }
        );
      } else {
        await this.playwrightActionsFactory.embedFullPageScreenshot(
          `💥 "${locatorInfo.description}" text is NOT displayed as Expected = "${displayedText}" ;
           Actual = "${actualText}" - Screenshot`
        );
        await this.testInfo.attach(
          `💥 "${locatorInfo.description}" text is NOT displayed as Expected = "${displayedText}" ;
           Actual = "${actualText}"`,
          {
            body: `💥 "${locatorInfo.description}" text is NOT displayed as expected = "${displayedText}" ;
             actual = "${actualText}"`,
            contentType: "text/plain",
          }
        );
      }

      await expect.soft(locatorInfo.locator).toContainText(strExpectedText);
    });
  }

  public async verifyNotExist(locatorInfo: LocatorInfo): Promise<void> {
    await test.step(`🧪 Verifying if "${locatorInfo.description}" does NOT exist`, async (): Promise<void> => {
      const isVisible = await locatorInfo.locator.isVisible();
      if (isVisible) {
        await this.playwrightActionsFactory.embedFullPageScreenshot(`💥 "${locatorInfo.description}" exists when it should NOT - Screenshot`);
        await this.testInfo.attach(`💥 "${locatorInfo.description}" exists when it should NOT`, {
          body: `💥 "${locatorInfo.description}" exists when it should NOT`,
          contentType: 'text/plain',
        });

        // Fail the test if the element is visible
        throw new Error(`❌ "${locatorInfo.description}" was found but it should NOT exist.`);
      } else {
        await this.playwrightActionsFactory.embedFullPageScreenshot(`✅ "${locatorInfo.description}" does NOT exist - Screenshot`);
        await this.testInfo.attach(`✅ "${locatorInfo.description}" does NOT exist`, {
          body: `✅ "${locatorInfo.description}" does NOT exist`,
          contentType: 'text/plain',
        });
      }

      await expect(locatorInfo.locator).toBeHidden();
    });
  } 

  public async assertAreEqual(
    expected: number | number[] | string | string[],
    actual: number | number[] | string | string[],
    message?: string,
  ): Promise<void> {
    await test.step(`🧪 Verifying if "${expected}" equals "${actual}"`, async (): Promise<void> => {
      try {
        await expect(actual, message).toEqual(expected);

        // ✅ Log success and attach screenshot
        await this.playwrightActionsFactory.embedFullPageScreenshot('✅ Assertion passed - Screenshot');
        await this.testInfo.attach('✅ Assertion Passed', {
          body: `✅ Expected: "${expected}"\n✅ Actual: "${actual}"`,
          contentType: 'text/plain',
        });
      } catch (error) {
        const errorMessage = `💥 Assertion failed: Expected "${expected}", but got "${actual}"`;

        // 💥 Capture a screenshot and attach the failure message
        await this.playwrightActionsFactory.embedFullPageScreenshot('💥 Assertion failed - Screenshot');
        await this.testInfo.attach('💥 Assertion Failed', {
          body: errorMessage,
          contentType: 'text/plain',
        });

        // Re-throw error to ensure the test fails
        throw new Error(errorMessage);
      }
    });
  }

  public async assertAreNotEqual(
    expected: number | number[] | string | string[],
    actual: number | number[] | string | string[],
    message?: string,
  ): Promise<void> {
    await test.step(`🧪 Verifying if "${expected}" does not equal "${actual}"`, async (): Promise<void> => {
      try {
        await expect(actual, message).not.toEqual(expected);

        // ✅ Log success and attach screenshot
        await this.playwrightActionsFactory.embedFullPageScreenshot('✅ Assertion passed - Screenshot');
        await this.testInfo.attach('✅ Assertion Passed', {
          body: `✅ Expected: "${expected}" not to equal "${actual}"`,
          contentType: 'text/plain',
        });
      } catch (error) {
        const errorMessage = `💥 Assertion failed: Expected "${expected}" not to equal "${actual}"`;

        // 💥 Capture a screenshot and attach the failure message
        await this.playwrightActionsFactory.embedFullPageScreenshot('💥 Assertion failed - Screenshot');
        await this.testInfo.attach('💥 Assertion Failed', {
          body: errorMessage,
          contentType: 'text/plain',
        });

        // Re-throw error to ensure the test fails
        throw new Error(errorMessage);
      }
    });
  }
}
