export interface TestCaseData {
  tags: string;
  testCase: string;
  testDescription: string;
  testSummary: string;
}

export interface JiraMetaData {
  jiraStoryId: string;
  jiraTestId: string;
}

export interface EditProfileData {
  firstName?: string;
  lastName?: string;
  zipCode?: string;
  ethnicity?: string;
  gameHandle?: string;
  address?: string;
  gender?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
 
}
export interface PinCard {
  currentPin?: string;
  newPin?: string;
  confirmPin?: string;
}
