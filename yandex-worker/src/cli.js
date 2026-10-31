import path from 'node:path';
import { TechnicalAccountRuntime } from './technical-account-runtime.js';

const [command, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const accountId = args.account ?? 'yandex-agent-01';
const sessionDirectory = path.resolve(args['session-dir'] ?? process.env.YANDEX_SESSION_STATE_DIR ?? 'runtime/yandex-sessions');
const runtime = new TechnicalAccountRuntime({
  accountId,
  sessionDirectory,
  encryptionSecret: process.env.YANDEX_SESSION_STATE_ENCRYPTION_KEY,
  writeHeadersProvider: () => ({
    'x-csrf-token': process.env.YANDEX_REQUEST_CSRF_TOKEN,
    'X-Yandex-ICookie': process.env.YANDEX_I_COOKIE
  })
});

try {
  await runtime.start({ headless: process.env.YANDEX_BROWSER_HEADLESS === 'true' });
  if (command === 'login') {
    await runtime.openManualLogin();
    console.log('Complete Yandex login in the opened browser, then press Ctrl+C. Session state is saved on shutdown.');
    await new Promise((resolve) => process.once('SIGINT', resolve));
  }
  if (command === 'check') print(await runtime.checkConnection());
  if (command === 'organizations') print({ organizations: await runtime.execute(() => runtime.client.discoverOrganizations(args.filter ?? '')) });
  if (command === 'locations') print(await runtime.execute(() => runtime.client.discoverLocations({
    chainId: required(args, 'chain-id'),
    chainPermalink: required(args, 'chain-permalink'),
    geoId: args['geo-id'],
    page: Number(args.page ?? 1)
  })));
  if (command === 'reviews') print(await runtime.execute(() => runtime.client.listReviews({ locationId: required(args, 'location-id'), page: Number(args.page ?? 1), ranking: args.ranking ?? 'by_time' })));
  if (command === 'reply') {
    if (args['allow-write'] !== 'true') throw new Error('Controlled write is disabled; pass --allow-write true after explicit approval.');
    print(await runtime.execute(() => runtime.client.writeReply({ locationId: required(args, 'location-id'), reviewId: required(args, 'review-id'), text: required(args, 'text') })));
  }
  if (!['login', 'check', 'organizations', 'locations', 'reviews', 'reply'].includes(command)) usage();
} finally {
  await runtime.stop().catch(() => {});
}

function parseArgs(values) {
  return Object.fromEntries(values.filter((_, index) => index % 2 === 0).map((key, index) => [key.replace(/^--/, ''), values[index * 2 + 1]]));
}

function required(values, key) {
  if (!values[key]) throw new Error(`--${key} is required`);
  return values[key];
}

function print(value) {
  // Mapper results intentionally exclude cookies and CSRF values.
  console.log(JSON.stringify(value, null, 2));
}

function usage() {
  throw new Error('Usage: npm start -- <login|check|organizations|locations|reviews|reply> [--account ID]');
}
