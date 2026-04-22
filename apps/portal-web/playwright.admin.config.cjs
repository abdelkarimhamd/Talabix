/* global process */

const port = Number(process.env.PORTAL_APP_E2E_PORT ?? 5178);
const baseURL = process.env.PORTAL_APP_URL ?? `http://127.0.0.1:${port}`;
const browserChannel =
  process.env.PLAYWRIGHT_BROWSER_CHANNEL ??
  (process.platform === 'win32' ? 'chrome' : undefined);

module.exports = {
  testDir: './e2e',
  testMatch: /admin-shell\.spec\.cjs/,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL,
    ...(browserChannel ? { channel: browserChannel } : {}),
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: {
      width: 1366,
      height: 900,
    },
  },
  webServer: process.env.PORTAL_APP_URL
    ? undefined
    : {
        command: `npm --workspace @talabix/portal-web run dev -- --host 127.0.0.1 --port ${port}`,
        reuseExistingServer: true,
        timeout: 120_000,
        url: baseURL,
      },
};
