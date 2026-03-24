import { execSync } from 'node:child_process';
import { getEnvVariable } from './env.utils';

/**
 * Deletes a WooCommerce test order via WP-CLI over SSH.
 * Uses wc_get_order()->delete(true) which is HPOS-safe.
 *
 * IMPORTANT: This is best-effort. A teardown failure will NOT fail the test —
 * it only prints a warning. If SSH is not configured, set up config/.env.prod
 * with SSH_HOST pointing to your SSH config alias (e.g. "coffeeandpep") or
 * the real server IP with SSH_PORT and SSH_KEY_PATH also set.
 *
 * If an order is left behind, run: npx ts-node scripts/cleanup-test-orders.ts
 */
export function deleteTestOrder(orderId: string): void {
  if (!orderId) return;

  let wpPath: string;
  let sshHost: string;
  try {
    wpPath  = getEnvVariable('WP_PATH');
    sshHost = getEnvVariable('SSH_HOST');
  } catch {
    console.warn(`[teardown] SSH env vars not configured — order #${orderId} was NOT deleted. Run cleanup-test-orders.ts manually.`);
    return;
  }

  const sshUser = getEnvVariable('SSH_USER', '');
  const sshPort = getEnvVariable('SSH_PORT', '');
  const sshKey  = getEnvVariable('SSH_KEY_PATH', '');

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
    console.log(`[teardown] Order #${orderId} deleted successfully.`);
  } catch (firstErr) {
    try {
      execSync(cmd, { stdio: 'pipe', timeout: 30000 });
      console.log(`[teardown] Order #${orderId} deleted on retry.`);
    } catch (retryErr) {
      // Best-effort — never fail the test over teardown
      console.warn(`[teardown] WARNING: Could not delete order #${orderId}. Run cleanup-test-orders.ts manually.`);
      console.warn(`[teardown] SSH command was: ${cmd}`);
      if (retryErr instanceof Error) console.warn(`[teardown] Error: ${retryErr.message}`);
    }
  }
}
