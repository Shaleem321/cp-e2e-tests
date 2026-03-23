import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import dotenv from "dotenv";
import os from "node:os";

// Load environment variables
const env = process.env.NODE_ENV || "prod";
dotenv.config({ path: `./config/.env.${env}` });

const { URL } = process.env;

const config: PlaywrightTestConfig = {
  testDir: "./specs/",
  timeout: 90 * 1000,
  expect: {
    timeout: 60 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,

  reporter: [
    ["list", { printSteps: true }],
    [
      "allure-playwright",
      {
        detail: true,
        outputFolder: "allure-results",
        suiteTitle: true,
        environmentInfo: {
          OS: os.platform(),
          Architecture: os.arch(),
          NodeVersion: process.version,
          url: URL,
        },
        categories: [
          {
            name: "Missing file errors",
            messageRegex: /^ENOENT: no such file or directory/,
          },
        ],
      },
    ],
    ["html", { open: "never" }],
  ],

  use: {
    video: "retain-on-failure",
    actionTimeout: 45 * 1000,
    baseURL: URL,
    headless: process.env.CI ? true : false,
    trace: "on-first-retry",
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      args: ["--window-size=1920,1080", "--disable-resizable"],
    },
  },

  projects: [
    {
      name: "Chromium",
      testIgnore: ["**/*.setup.spec.ts"],
      use: {
        userAgent: devices["Desktop Chrome"].userAgent,
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ["--window-size=1920,1080", "--disable-resizable"],
        },
      },
    },
    // Uncomment and configure if needed
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //   },
    // },
    // {
    //   name: "webkit",
    //   use: {
    //     ...devices["Desktop Safari"],
    //   },
    // },
  ],
};

export default config;
