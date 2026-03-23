import { getValueFromCookies } from '@utilities/general.utils';
import { getEnvVariable } from './env.utils';

export async function getAPIHeaders(
  user: 'super_admin',
): Promise<{ [key: string]: string }> {
  const token = getValueFromCookies('super_admin', 'token');
  if (!token) {
    throw new Error('Token not found in cookies');
  }

  const headers = {
    accept: '*/*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
    origin: getEnvVariable('baseUrl'),
    priority: 'u=1, i',
    referer: `${getEnvVariable('baseUrl')}/`,
    'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  };
  return headers;
}
