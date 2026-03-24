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
  const sshUser = getEnvVariable('SSH_USER', '');
  const sshPort = getEnvVariable('SSH_PORT', '');
  const sshKey  = getEnvVariable('SSH_KEY_PATH', '');

  // Build SSH args — only add flags that are explicitly set.
  // Locally, SSH_HOST is the alias name (e.g. "coffeeandpep") and ~/.ssh/config
  // handles port + identity automatically. In CI, SSH_HOST is the real IP and
  // SSH_PORT / SSH_KEY_PATH are set explicitly.
  const portFlag = sshPort ? `-p ${sshPort}` : '';
  const keyFlag  = sshKey  ? `-i ${sshKey}`  : '';
  const target   = sshUser ? `${sshUser}@${sshHost}` : sshHost;

  const cmd = [
    'ssh',
    '-o StrictHostKeyChecking=no',
    '-o ConnectTimeout=10',
    portFlag,
    keyFlag,
    target,
    `"cd ${wpPath} && wp eval 'wc_get_order(${orderId})->delete(true);'"`,

  ].filter(Boolean).join(' ');

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 30000 });
  } catch {
    execSync(cmd, { stdio: 'pipe', timeout: 30000 });
  }
}
