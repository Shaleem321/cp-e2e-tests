/**
 * Safety-net cleanup script.
 *
 * Run this manually after any CI incident where the afterEach teardown may
 * have failed and left test orders on prod. Finds orders placed in the last
 * 24 hours whose billing email matches the test pattern
 * (test+<timestamp>@coffeeandpeppers-test.com) and deletes them.
 *
 * Usage:
 *   npx ts-node scripts/cleanup-test-orders.ts
 *
 * Requires WP_PATH, SSH_HOST, SSH_USER to be set in config/.env.prod.
 */

import { execSync } from 'node:child_process';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../config/.env.prod') });

const wpPath = process.env.WP_PATH;
const sshHost = process.env.SSH_HOST;
const sshUser = process.env.SSH_USER;

if (!wpPath || !sshHost || !sshUser) {
  console.error('Missing required env vars: WP_PATH, SSH_HOST, SSH_USER');
  process.exit(1);
}

const phpScript = `
$cutoff = time() - 86400;
$orders = wc_get_orders([
  'limit'        => 100,
  'date_created' => '>=' . date('Y-m-d', $cutoff),
  'return'       => 'ids',
]);
$deleted = 0;
foreach ($orders as $id) {
  $order = wc_get_order($id);
  $email = $order->get_billing_email();
  if (strpos($email, '@coffeeandpeppers-test.com') !== false) {
    $order->delete(true);
    echo "Deleted order #" . $id . " (email: " . $email . ")\\n";
    $deleted++;
  }
}
echo "Done. Deleted " . $deleted . " test order(s).\\n";
`;

const b64 = Buffer.from(phpScript).toString('base64');
const cmd = `ssh -o StrictHostKeyChecking=no ${sshUser}@${sshHost} "cd ${wpPath} && echo '${b64}' | base64 -d | wp eval-file -"`;

console.log('Running test order cleanup on prod...');
try {
  const output = execSync(cmd, { stdio: 'pipe', timeout: 60000 }).toString();
  console.log(output);
} catch (err) {
  console.error('Cleanup failed:', err);
  process.exit(1);
}
