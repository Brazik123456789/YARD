import path from 'node:path';
import { TechnicalAccountRuntime } from './technical-account-runtime.js';

const [command, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const accountId = args.account ?? 'yandex-agent-01';
const sessionDirectory = path.resolve(args['session-dir'] ?? process.env.YANDEX_SESSION_STATE_DIR ?? 'runtime/yandex-sessions');
const headless = process.env.YANDEX_BROWSER_HEADLESS === 'true';
const runtime = new TechnicalAccountRuntime({
  accountId,
  sessionDirectory,
  encryptionSecret: process.env.YANDEX_SESSION_STATE_ENCRYPTION_KEY
});

try {
  if (command === 'request-state-diagnostic' && headless) throw new Error('Request-state diagnostic requires a headed authenticated browser session.');
  await runtime.start({ headless });
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
  if (command === 'm0-read') print(await runManualRead(runtime, args));
  if (command === 'restore-check') print({
    restored: true,
    organizations: (await runtime.execute(() => runtime.client.discoverOrganizations())).length
  });
  if (command === 'request-state-diagnostic') print(await runtime.diagnoseWriteRequestState());
  if (command === 'reply') {
    requireControlledWriteApproval(args);
    const captured = await runtime.refreshWriteRequestState();
    if (!captured) throw new Error('Controlled write remains disabled: the authenticated Yandex Business page did not expose fresh request state. Record only redacted evidence; do not supply request headers manually.');
    print(await runtime.execute(() => runtime.client.writeReply({
      locationId: required(args, 'location-id'),
      reviewId: required(args, 'review-id'),
      text: required(args, 'text'),
      page: Number(required(args, 'page'))
    })));
  }
  if (!['login', 'check', 'organizations', 'locations', 'reviews', 'm0-read', 'restore-check', 'request-state-diagnostic', 'reply'].includes(command)) usage();
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
  throw new Error('Usage: npm start -- <login|check|organizations|locations|reviews|m0-read|restore-check|request-state-diagnostic|reply> [--account ID]');
}

async function runManualRead(runtime, values) {
  const chainId = required(values, 'chain-id');
  const chainPermalink = required(values, 'chain-permalink');
  const organizations = await runtime.execute(() => runtime.client.discoverOrganizations());
  const chain = organizations.find((organization) => organization.chainId === String(chainId) || organization.permanentId === String(chainPermalink));
  if (!chain) throw new Error('The requested chain was not returned by organization discovery. Do not continue with location reads.');
  const branches = await runtime.execute(() => runtime.client.discoverLocations({ chainId, chainPermalink, page: 1 }));
  if (branches.locations.length < 2) throw new Error('The discovered branch page must contain at least two locations for M0.');
  const [first, second] = branches.locations;
  const firstPage = await runtime.execute(() => runtime.client.listReviews({ locationId: first.externalLocationId, page: 1 }));
  const secondPage = await runtime.execute(() => runtime.client.listReviews({ locationId: first.externalLocationId, page: 2 }));
  const otherLocation = await runtime.execute(() => runtime.client.listReviews({ locationId: second.externalLocationId, page: 1 }));
  return {
    organizations: organizations.length,
    chainId: chain.chainId,
    discoveredLocations: [first.externalLocationId, second.externalLocationId],
    firstPage: firstPage.pager,
    secondPage: secondPage.pager,
    otherLocation: otherLocation.pager
  };
}

function requireControlledWriteApproval(values) {
  if (process.env.YANDEX_MANUAL_TESTS !== 'true' || process.env.YANDEX_CONTROLLED_WRITE_APPROVED !== 'true' || values['approved-real-write'] !== 'true') {
    throw new Error('Controlled write is disabled. It requires YANDEX_MANUAL_TESTS=true, YANDEX_CONTROLLED_WRITE_APPROVED=true, and --approved-real-write true after explicit approval.');
  }
}
