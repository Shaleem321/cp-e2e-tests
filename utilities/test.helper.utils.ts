import { TestInfo } from "@playwright/test";

interface TestCaseData {
  tags: string;
  testCase: string;
  testDescription: string;
  testSummary: string;
}

export async function logTestCaseData(testInfo: TestInfo, scenario: TestCaseData): Promise<void> {
  testInfo.annotations.push({ description: `Test case: ${scenario.testCase}`, type: "info" });
  testInfo.annotations.push({ description: `Test Summary: ${scenario.testSummary}`, type: "info" });
  testInfo.annotations.push({ description: `Description: ${scenario.testDescription}`, type: "info" });
  testInfo.annotations.push({ description: `Tags: ${scenario.tags}`, type: "info" });
}
