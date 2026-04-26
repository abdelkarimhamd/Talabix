/* eslint-disable testing-library/prefer-screen-queries */

const { expect, test } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { PNG } = require('pngjs');

const demoMerchantId = '0dbcc17d-16c1-4df5-89ec-c32007ebd38c';
const demoBranchId = '2ea03ee8-f346-42c2-968d-ab4aeae7040d';
const demoOrderId = '4aa0f507-77b6-459c-adbe-ef8658cbdc51';
const designArchiveUrl = pathToFileURL(
  path.join(__dirname, 'design-archive', 'customer-app-ui-kit.html')
).href;
const visualDiffRatiosPath = path.join(
  __dirname,
  '..',
  'test-results',
  'visual-diff-ratios.jsonl'
);
// Shared visual budget after two stable CI artifacts. If one flow becomes noisy,
// widen only that flow with a per-screen maxDiffRatio override.
const initialVisualMaxDiffRatio = 0.2;

const designVisualFlows = [
  {
    appPath: '/?frame=phone',
    archiveScreen: 'home',
    maxDiffRatio: initialVisualMaxDiffRatio,
    name: 'home',
    readyText: 'What would you like?',
  },
  {
    appPath: `/merchants/${demoMerchantId}?frame=phone`,
    archiveScreen: 'merchant',
    maxDiffRatio: initialVisualMaxDiffRatio,
    name: 'merchant',
    readyText: 'Menu',
  },
  {
    appPath: '/cart?frame=phone',
    archiveScreen: 'cart',
    maxDiffRatio: initialVisualMaxDiffRatio,
    name: 'cart',
    readyText: 'Cart',
  },
  {
    appPath: `/orders/${demoOrderId}?frame=phone`,
    archiveScreen: 'tracking',
    maxDiffRatio: initialVisualMaxDiffRatio,
    name: 'tracking',
    readyText: 'Tracking your delivery',
  },
];

async function openCustomerRoute(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
}

async function expectPhoneFrameUrl(page) {
  await expect(page).toHaveURL(/(?:\?|&)frame=phone(?:&|$)/);
}

async function captureReadyScreenshot(page, url, readyText) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(readyText).first()).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);

  return page.screenshot({
    animations: 'disabled',
    fullPage: false,
  });
}

async function comparePngScreenshots({
  actual,
  expected,
  maxDiffRatio,
  name,
  testInfo,
}) {
  const { default: pixelmatch } = await import('pixelmatch');
  const actualPng = PNG.sync.read(actual);
  const expectedPng = PNG.sync.read(expected);

  expect(actualPng.width, `${name} screenshot width`).toBe(expectedPng.width);
  expect(actualPng.height, `${name} screenshot height`).toBe(
    expectedPng.height
  );

  const diff = new PNG({ width: actualPng.width, height: actualPng.height });
  const diffPixels = pixelmatch(
    actualPng.data,
    expectedPng.data,
    diff.data,
    actualPng.width,
    actualPng.height,
    {
      includeAA: false,
      threshold: 0.22,
    }
  );
  const diffRatio = diffPixels / (actualPng.width * actualPng.height);
  await testInfo.attach(`${name}-visual-diff-ratio`, {
    body: `${diffRatio}\n`,
    contentType: 'text/plain',
  });
  await testInfo.attach(`${name}-app-frame`, {
    body: actual,
    contentType: 'image/png',
  });
  await testInfo.attach(`${name}-design-archive`, {
    body: expected,
    contentType: 'image/png',
  });
  await fs.mkdir(path.dirname(visualDiffRatiosPath), { recursive: true });
  await fs.appendFile(
    visualDiffRatiosPath,
    `${JSON.stringify({
      diffRatio: Number(diffRatio.toFixed(6)),
      flow: name,
      threshold: maxDiffRatio,
    })}\n`
  );

  if (diffRatio > maxDiffRatio) {
    await testInfo.attach(`${name}-visual-diff`, {
      body: PNG.sync.write(diff),
      contentType: 'image/png',
    });
  }

  expect(
    diffRatio,
    `${name} phone frame visual diff ratio against design archive`
  ).toBeLessThanOrEqual(maxDiffRatio);
}

test.describe('customer prototype browser flows', () => {
  test('Home flow filters discovery and category selection', async ({ page }) => {
    await openCustomerRoute(page, '/');

    await expect(page.getByText('What would you like?')).toBeVisible();
    await expect(page.getByText('Talabix Demo Kitchen').first()).toBeVisible();

    await page.getByTestId('merchant-search').fill('Breakfast');
    await expect(page.getByText('Breakfast Bazaar').first()).toBeVisible();
    await expect(page.getByText('Talabix Demo Kitchen')).toHaveCount(0);

    await page.getByTestId('toggle-open-now').click();
    await expect(
      page.getByText('No merchants match the current address and filters.')
    ).toBeVisible();

    await page.getByTestId('merchant-search').fill('');
    await page.getByTestId('toggle-open-now').click();
    await page.getByTestId('category-market').click();
    await expect(page.getByText('Talabix Market').first()).toBeVisible();
  });

  test('Merchant flow adds an item and opens branch/cart paths', async ({
    page,
  }) => {
    await openCustomerRoute(page, `/merchants/${demoMerchantId}`);

    await expect(page.getByText('Store profile').first()).toBeVisible();
    await expect(page.getByText('Chicken Shawarma').first()).toBeVisible();

    await page.getByTestId('merchant-add-to-cart-shawarma').click();
    await expect(
      page.getByText('Chicken Shawarma added to cart.')
    ).toBeVisible();

    await page.getByText('Open cart').click();
    await expect(page).toHaveURL(/\/cart(?:\?|$)/);
    await expect(page.getByText('3 cart items')).toBeVisible();

    await openCustomerRoute(page, `/merchants/${demoMerchantId}`);
    await page.getByText('Browse branch catalog').click();
    await expect(page).toHaveURL(
      new RegExp(`/branches/${demoBranchId}/catalog(?:\\?|$)`)
    );
    await expect(page.getByText('Branch menu').first()).toBeVisible();

    await openCustomerRoute(page, `/merchants/${demoMerchantId}`);
    await page.getByTestId('merchant-back').click();
    await expect(page).toHaveURL(/\/(?:\?|$)/);
    await expect(page.getByText('What would you like?')).toBeVisible();
  });

  test('Cart flow updates quantity, notes, promo feedback, and checkout', async ({
    page,
  }) => {
    await openCustomerRoute(page, '/cart');

    await expect(page.getByText('Cart').first()).toBeVisible();
    await expect(page.getByText('Chicken Shawarma').first()).toBeVisible();

    await page.getByText('Add one').first().click();
    await expect(page.getByText('Qty 2').first()).toBeVisible();

    await page.getByTestId('cart-notes').fill('Leave with security');
    await expect(page.getByText('Checkout notes updated.')).toBeVisible();

    await page.getByTestId('cart-promo-code').fill('BADCODE');
    await page.getByTestId('apply-promo-code').click();
    await expect(
      page.getByText('Promo code is not valid for this cart.')
    ).toBeVisible();

    await page.getByTestId('cart-back').click();
    await expect(page).toHaveURL(/\/(?:\?|$)/);

    await openCustomerRoute(page, '/cart');
    await page.getByTestId('checkout-now').click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]+(?:\?|$)/i);
    await expect(page.getByText('Tracking your delivery')).toBeVisible();
  });

  test('Tracking flow shows compact status steps and returns home', async ({
    page,
  }) => {
    await openCustomerRoute(page, `/orders/${demoOrderId}`);

    await expect(page.getByText('Tracking your delivery')).toBeVisible();
    await expect(page.getByText('Live status updates')).toBeVisible();
    await expect(page.getByText('Rider assigned')).toBeVisible();
    await expect(page.getByText('Price breakdown')).toBeVisible();

    await page.getByTestId('tracking-home').click();
    await expect(page).toHaveURL(/\/(?:\?|$)/);
    await expect(page.getByText('What would you like?')).toBeVisible();
  });

  test('design-review phone frame survives internal navigation', async ({
    page,
  }) => {
    await openCustomerRoute(page, '/?frame=phone');
    await expectPhoneFrameUrl(page);

    await page.getByTestId(`open-merchant-${demoMerchantId}`).click();
    await expect(page).toHaveURL(/\/merchants\/[0-9a-f-]+/i);
    await expectPhoneFrameUrl(page);

    await page.getByText('Browse branch catalog').click();
    await expect(page).toHaveURL(
      new RegExp(`/branches/${demoBranchId}/catalog\\?frame=phone$`)
    );

    await page.getByText('Continue to cart', { exact: true }).click();
    await expect(page).toHaveURL(/\/cart\?frame=phone$/);

    await page.getByTestId('cart-back').click();
    await expect(page).toHaveURL(/\/\?frame=phone$/);

    await openCustomerRoute(page, `/orders/${demoOrderId}?frame=phone`);
    await page.getByTestId('tracking-home').click();
    await expect(page).toHaveURL(/\/\?frame=phone$/);
  });
});

test.describe('customer phone-frame design archive screenshots', () => {
  for (const flow of designVisualFlows) {
    test(`${flow.name} ?frame=phone matches archived prototype`, async ({
      baseURL,
      browser,
    }, testInfo) => {
      const context = await browser.newContext({
        baseURL,
        viewport: { width: 460, height: 920 },
      });
      const appPage = await context.newPage();
      const archivePage = await context.newPage();

      try {
        const [actual, expected] = await Promise.all([
          captureReadyScreenshot(appPage, flow.appPath, flow.readyText),
          captureReadyScreenshot(
            archivePage,
            `${designArchiveUrl}?screen=${flow.archiveScreen}`,
            flow.readyText
          ),
        ]);

        await comparePngScreenshots({
          actual,
          expected,
          maxDiffRatio: flow.maxDiffRatio,
          name: flow.name,
          testInfo,
        });
      } finally {
        await context.close();
      }
    });
  }
});
