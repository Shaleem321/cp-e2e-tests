import { faker } from '@faker-js/faker';

export class TestDataUtils {
  // Generate a unique random name using faker.js and a unique test identifier
  public static generateRandomFirstName(): string {
    const randomFirstName = faker.person.firstName();
    return `${randomFirstName}`;
  }
  public static generateRandomLastName(): string {
    const randomLastName = faker.person.lastName();
    return `${randomLastName}`;
  }

  /** Returns a US-format phone number: (XXX) XXX-XXXX */
  public static generateRandomMobile(): string {
    const areaCode = faker.number.int({ min: 200, max: 999 });
    const exchange = faker.number.int({ min: 200, max: 999 });
    const subscriber = faker.number.int({ min: 0, max: 9999 });
    return `(${areaCode}) ${exchange}-${subscriber.toString().padStart(4, '0')}`;
  }
  public static generateRandomEthnicity(): string {
    const randomEthnicity = faker.person.bio();
    // Remove emojis using regex pattern
    const withoutEmojis = randomEthnicity.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{200D}]|[\u{FE0F}]/gu, '');
    return `${withoutEmojis}`.trimEnd();
  }

  public static generateRandomStreetAddress(): string {
    const streetAddress = faker.location.streetAddress();
    return `${streetAddress}`;
  }
  public static generateRandomZip(): string {
    const zip = faker.location.zipCode();
    return `${zip}`;
  }
  public static generateRandomString(length: number): string {
    const randomString = faker.string.alphanumeric(length);
    return `${randomString}`;
  }
  public static generateRandomNumber(length: number): string {
    const randomNumber = faker.number.int({ min: 10000, max: 99999 });
    return `${randomNumber}`;
  }

  /** Returns one of "M", "F", or "O". */
  public static generateRandomGender(): string {
    return faker.helpers.arrayElement(["M", "F", "O"]);
  }

  /** Returns a birth date in YYYY-MM-DD format. */
  public static generateRandomDateOfBirth(): string {
    const randomDateOfBirth = faker.date.birthdate().toISOString().slice(0, 10);
    return `${randomDateOfBirth}`;
  }
}
