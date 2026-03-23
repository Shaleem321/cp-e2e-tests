import { Cookie } from "@playwright/test";
import fs from "fs";
import path from "path";

const FILE_BASE_PATH = `e2e/data/files/`;

export function getValueFromCookies(
  filename: 'super_admin',
  cookieKeyName: 'token',
): string | undefined {
  const storageStateDir = path.resolve(__dirname, '../cookies');
  const filePath = path.join(storageStateDir, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return undefined;
  }
  try {
    const fileContents = fs.readFileSync(filePath, 'utf-8');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cookiesData: { cookies: Cookie[] } = JSON.parse(fileContents);

    // Find the cookie object with the specified name and return its value
    const foundCookie = cookiesData.cookies.find((c: Cookie) => c.name === cookieKeyName);
    return foundCookie?.value;
  } catch (error: unknown) {
    console.error(`Error reading or parsing file ${filePath}:`, error);
    return undefined;
  }
}
/**
 * Constructs and returns the full path to a file.
 *
 * @param filePath - The relative path from the base directory to the file, including any folders.
 * @returns The full file path as a string.
 */
export const getDataFilePath = (filePath: string): string => {
  return `${FILE_BASE_PATH}${filePath}`;
};


export const convertFileToBase64 = (fileName: string): string => {
  const filePath = getDataFilePath(fileName); // Get the full file path using the getDataFilePath function
  const absFilePath = path.resolve(filePath);
  try {
    const fileBuffer = fs.readFileSync(absFilePath);
    return fileBuffer.toString("base64"); // Return the base64 encoded data
  } catch (err) {
    throw new Error(`Error reading the file: ${err.message}`);
  }
};
