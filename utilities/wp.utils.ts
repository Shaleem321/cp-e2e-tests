import { execSync } from 'node:child_process';
import { getEnvVariable } from './env.utils';

/**
 * Deletes a WooCommerce test order via WP-CLI over SSH.
 * Uses wc_get_order()->delete(true) which is HPOS-safe (works regardless of
 * whether orders live in wp_posts or wp_wc_orders).
 *
 * Call this in afterEach for any test that places a real order on prod.
 */
export function deleteTestOrder(orderId: string): void {
  if (!orderId) return;

  const wpPath = getEnvVariable('WP_PATH');
  const sshHost = getEnvVariable('SSH_HOST');
  const sshUser = getEnvVariable('SSH_USER');

  const phpSnippet = `wc_get_order(${orderId})->delete(true);`;
  const cmd = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${sshUser}@${sshHost} "cd ${wpPath} && wp eval '${phpSnippet}'"`;

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 30000 });
  } catch {
    execSync(cmd, { stdio: 'pipe', timeout: 30000 });
  }
}
