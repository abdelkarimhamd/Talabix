/* global process */

const port = Number(process.env.CUSTOMER_APP_E2E_PORT ?? 8091);
const baseURL = process.env.CUSTOMER_APP_URL ?? `http://127.0.0.1:${port}`;
const browserChannel =
  process.env.PLAYWRIGHT_BROWSER_CHANNEL ??
  (process.platform === 'win32' ? 'chrome' : undefined);

module.exports = {
  testDir: './e2e',
  testMatch: /customer-four-flow\.spec\.js/,
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
    trace: 'retain-on-failure',
    viewport: {
      width: 460,
      height: 920,
    },
  },
  webServer: process.env.CUSTOMER_APP_URL
    ? undefined
    : {
        command: `npx expo start --web --port ${port} --non-interactive`,
        reuseExistingServer: true,
        timeout: 120_000,
        url: baseURL,
      },
};
