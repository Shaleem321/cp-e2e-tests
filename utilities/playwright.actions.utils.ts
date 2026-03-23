import { LocatorInfo } from "@interfaces/locator.info.interface";
import { Page, test, TestInfo } from "@playwright/test";
import path from "path";

export class PlaywrightActionFactory {
  private readonly page: Page;
  private readonly testInfo: TestInfo;

  /**
   * @param page
   * @param testInfo
   */

  public constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
  }

  public maskValue(value: string): string {
    return "*".repeat(value.length); // Masks the value with asterisks
  }

  public async click(locatorInfo: LocatorInfo): Promise<void> {
    await test.step(`🐾 "${locatorInfo.description}" is clicked`, async (): Promise<void> => {
      await this.waitForSelector(locatorInfo);
      await locatorInfo.locator.scrollIntoViewIfNeeded();
      await locatorInfo.locator.click();
      await this.testInfo.attach(`🐾 "${locatorInfo.description}" is clicked`, {
        body: `🐾 "${locatorInfo.description}" is clicked`,
        contentType: "text/plain",
      });
    });
  }

  public async navigateToURL(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await this.testInfo.attach(`⏩ Navigated to URL: ${url}`, {
      body: `⏩ Navigated to URL: ${url}`,
      contentType: "text/plain",
    });
  }

  public async scrollIntoView(locatorInfo: LocatorInfo): Promise<void> {
    await test.step(`📜 Scrolling "${locatorInfo.description}" into view`, async (): Promise<void> => {
      await locatorInfo.locator.scrollIntoViewIfNeeded();
      await this.testInfo.attach(`📜 "${locatorInfo.description}" scrolled into view`, {
        body: `📜 "${locatorInfo.description}" scrolled into view`,
        contentType: "text/plain",
      });
    });
  }

  public async sendKeys(locatorInfo: LocatorInfo, strValue: string, mask = false): Promise<void> {
    const displayedValue = mask ? this.maskValue(strValue) : strValue;
    await test.step(`🐾 "${locatorInfo.description}" is entered with "${displayedValue}"`, async (): Promise<void> => {
      await locatorInfo.locator.scrollIntoViewIfNeeded();
      await locatorInfo.locator.fill(strValue);
      await this.testInfo.attach(`🐾 "${locatorInfo.description}" is entered with "${displayedValue}"`, {
        body: `🐾 "${locatorInfo.description}" is entered with "${displayedValue}"`,
        contentType: "text/plain",
      });
    });
  }

  public async sendKeysSequentially(locatorInfo: LocatorInfo, strValue: string, mask = false): Promise<void> {
    const displayedValue = mask ? this.maskValue(strValue) : strValue;
    await test.step(`🐾 "${locatorInfo.description}" is entered with "${displayedValue}"`, async (): Promise<void> => {
      await locatorInfo.locator.scrollIntoViewIfNeeded();
      await locatorInfo.locator.pressSequentially(strValue);
      await this.testInfo.attach(`🐾 "${locatorInfo.description}" is entered with "${displayedValue}"`, {
        body: `🐾 "${locatorInfo.description}" is entered with "${displayedValue}"`,
        contentType: "text/plain",
      });
    });
  }

  public async waitForDomLoad(timeout = 30000): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded", { timeout });
  }

  public async waitForNetworkIdle(timeout = 60000): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout });
  }

  public async waitForSec(seconds: number): Promise<void> {
    await test.step(`⏳ Waiting for ${seconds} second(s)`, async (): Promise<void> => {
      await this.page.waitForTimeout(seconds * 1000); // Convert seconds to milliseconds
      await this.testInfo.attach(`⏳ Waited for ${seconds} second(s)`, {
        body: `Waited for ${seconds} second(s)`,
        contentType: "text/plain",
      });
    });
  }

  public async expectElementNotExist(locatorInfo: LocatorInfo): Promise<void> {
    await test.step(`⏳ Waiting for "${locatorInfo.description}" to be not visible`, async (): Promise<void> => {
      await locatorInfo.locator.waitFor({ state: "detached" });
      await this.testInfo.attach(`⏳ "${locatorInfo.description}" is not visible`, {
        body: `⏳ "${locatorInfo.description}" is not visible`,
        contentType: "text/plain",
      });
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

  public async embedFullPageScreenshot(description: string): Promise<void> {
    await test.step(`📸 "${description} - Full page screenshot`.trim(), async (): Promise<void> => {
      const screenshot: Buffer = await this.page.screenshot({ fullPage: true });
      await this.testInfo.attach(`📸 ${description}`, {
        body: screenshot,
        contentType: "image/png",
      });
    });
  }

  public async searchAndSelect(locatorInfo: LocatorInfo, inputText: string, value?: string): Promise<void> {
    await test.step(`🐾 Enter "${inputText}" and select it from the dropdown`, async (): Promise<void> => {
      // Focus the input field
      await this.waitForSelector(locatorInfo);
      await locatorInfo.locator.focus();
      await locatorInfo.locator.clear();
      let dropdownOption;
      let exactMatchOption;

      // Wait for the dropdown to appear and contain the exact input text
      if (value?.includes("multiselect")) {
        await locatorInfo.locator.pressSequentially(inputText);
        dropdownOption = this.page.locator("ul.multiselect-options li", {
          hasText: inputText,
        });

        // Filter to match exact text for custom selects
        exactMatchOption = dropdownOption
          .filter({
            has: this.page.locator("span", { hasText: inputText }),
          })
          .first();
      } else {
        // Default behavior (exact matching)
        await locatorInfo.locator.fill(inputText);
        dropdownOption = this.page.locator("ul.form-element__autocomplete-list li", {
          hasText: inputText,
        });

        // Filter to match exact text
        exactMatchOption = dropdownOption
          .filter({
            has: this.page.locator("span", { hasText: inputText }),
          })
          .first();
      }

      try {
        // Wait for the match option to be visible
        await exactMatchOption.waitFor({ state: "visible", timeout: 15000 });

        // Scroll the element into view
        await exactMatchOption.scrollIntoViewIfNeeded();

        // Click the dropdown option
        await exactMatchOption.click({ force: true });

        // Attach a message to the test report
        await this.testInfo.attach(`🐾 Selected "${inputText}" from the dropdown`, {
          body: `Selected ${
            value?.includes("autocomplete") ? "first matching" : "exact matching"
          } item for "${inputText}" from the dropdown`,
          contentType: "text/plain",
        });
      } catch (error) {
        // Handle timeout or other errors
        if (error.message.includes("Timeout")) {
          throw new Error(
            `Option ${
              value?.includes("autocomplete") ? "containing" : "matching exactly"
            } "${inputText}" not found in the dropdown.`
          );
        } else {
          throw new Error(`An error occurred while selecting "${inputText}" from the dropdown: ${error.message}`);
        }
      }
    });
  }

  public async waitForURL(regex: RegExp, timeout = 30000): Promise<void> {
    await test.step(`⏳ Waiting for URL matching "${regex}"`, async (): Promise<void> => {
      await this.page.waitForURL(regex, { timeout, waitUntil: "domcontentloaded" });
      await this.testInfo.attach(`⏳ URL matching "${regex}" is loaded`, {
        body: `⏳ URL matching "${regex}" is loaded`,
        contentType: "text/plain",
      });
    });
  }

  public async getText(locatorInfo: LocatorInfo): Promise<null | string> {
    const elementTextContent = await test.step(`🐾 "${locatorInfo.description}" text is obtained`, async (): Promise<
      null | string
    > => {
      return locatorInfo.locator.textContent();
    });
    return elementTextContent;
  }

  public async getTextValue(locatorInfo: LocatorInfo): Promise<null | string> {
    const elementTextContent = await test.step(`🐾 "${locatorInfo.description}" text is obtained`, async (): Promise<
      null | string
    > => {
      return locatorInfo.locator.inputValue();
    });
    return elementTextContent;
  }

  
  public async selectFromDropdown(locatorInfo: LocatorInfo, optionText: string): Promise<void> {
    await test.step(`🐾 Select "${optionText}" from "${locatorInfo.description}" dropdown by text`, async (): Promise<void> => {
      await this.waitForSelector(locatorInfo);
      await locatorInfo.locator.scrollIntoViewIfNeeded();
      
      // Select the option by visible text
      await locatorInfo.locator.selectOption({ label: optionText });
      
      await this.testInfo.attach(`🐾 Selected "${optionText}" from "${locatorInfo.description}" dropdown by text`, {
        body: `🐾 Selected "${optionText}" from "${locatorInfo.description}" dropdown by text`,
        contentType: "text/plain",
      });
    });
  }
  public async selectRadioButtonOrCheckBox(locatorInfo: LocatorInfo): Promise<void> {
    await test.step(`🐾 "${locatorInfo.description}" is selected`, async (): Promise<void> => {
      try {
        await locatorInfo.locator.check();
        await this.testInfo.attach(`🐾 "${locatorInfo.description}" is selected`, {
          body: `🐾 "${locatorInfo.description}" is selected`,
          contentType: 'text/plain',
        });
      } catch (error) {
        await this.testInfo.attach(`🐾 "${locatorInfo.description}" is not selected - ` + error.message(), {
          body: `🐾 "${locatorInfo.description}" is not selected`,
          contentType: 'text/plain',
        });
      }
    });
  }

  public async uncheckRadioButtonOrCheckBox(locatorInfo: LocatorInfo): Promise<void> {
    await test.step(`🐾 "${locatorInfo.description}" is unchecked`, async (): Promise<void> => {
      try {
        await locatorInfo.locator.uncheck();
        await this.testInfo.attach(`🐾 "${locatorInfo.description}" is unchecked`, {
          body: `🐾 "${locatorInfo.description}" is unchecked`,
          contentType: 'text/plain',
        });
      } catch (error) {
        await this.testInfo.attach(`🐾 "${locatorInfo.description}" is not unchecked - ` + error.message(), {
          body: `🐾 "${locatorInfo.description}" is not unchecked`,
          contentType: 'text/plain',
        });
      }
    });
  }

  
  public async forceClick(locatorInfo: LocatorInfo): Promise<void> {
    await test.step(`🐾 "${locatorInfo.description}" is clicked`, async (): Promise<void> => {
      await this.waitForSelector(locatorInfo);
      await locatorInfo.locator.scrollIntoViewIfNeeded();
      await locatorInfo.locator.click({ force: true });
      await this.testInfo.attach(`🐾 "${locatorInfo.description}" is clicked`, {
        body: `🐾 "${locatorInfo.description}" is clicked`,
        contentType: 'text/plain',
      });
    });
  }

  public async waitForElementToDisappear(element: LocatorInfo, timeout: number = 200000): Promise<void> {
    await test.step(`⏳ Waiting for the ${element.description} to disappear`, async (): Promise<void> => {
      // Wait for the  element to either become hidden or be removed from the DOM
      await element.locator.waitFor({ state: 'detached', timeout });
      await this.testInfo.attach(`✅ ${element.description} has disappeared`, {
        body: `✅ ${element.description} has disappeared`,
        contentType: 'text/plain',
      });
    });
  }

  public getFilePath(fileName: string): string {
    return path.join(__dirname, "..", "data", "files", fileName);
  }
	
  public async uploadFiles(
    fileName: string,
    locatorInfo: LocatorInfo
  ): Promise<void> {
    const filePath = this.getFilePath(fileName);
    await test.step("uploading files", async (): Promise<void> => {
      await this.page.waitForTimeout(2000);
      await (await locatorInfo.locator).setInputFiles(filePath);
    });
  }
}
