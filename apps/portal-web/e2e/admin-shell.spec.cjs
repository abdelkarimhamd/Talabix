/* global document, URL, window */

const { expect, test } = require('@playwright/test');

const opsAbilities = [
  'ops:dashboard.read',
  'ops:merchants.manage',
  'ops:dispatch.manage',
  'ops:settlements.read',
  'ops:settlements.manage',
  'ops:support.manage',
  'ops:users.manage',
];

const authSession = {
  token: 'admin-shell-smoke-token',
  user: {
    uuid: '7c2502bd-35e0-4f2b-9d4c-6aa03eb2c9c3',
    name: 'Talabix Super Admin',
    email: 'admin-shell@talabix.test',
    phone: null,
    account_status: 'active',
    roles: ['ops_admin'],
    abilities: opsAbilities,
  },
};

const merchantConfigurations = [
  {
    uuid: 'ad83d7b6-d5c6-456b-a40f-c9c7aa9ef110',
    name: 'Demo merchant',
    slug: 'demo-merchant',
    status: 'active',
    platform_commission_bps: 1200,
    branches: [
      {
        uuid: '12c63732-a94a-40b5-8936-36c021ef9159',
        merchant_uuid: 'ad83d7b6-d5c6-456b-a40f-c9c7aa9ef110',
        name: 'Olaya branch',
        city: 'Riyadh',
        address_line: 'Olaya Street',
        status: 'active',
        latitude: 24.7136,
        longitude: 46.6753,
        accepts_orders: true,
        service_zones: [
          {
            uuid: 'd2fbbfa4-e6c7-4630-8ba6-2e098ffb2e63',
            name: 'Central Riyadh',
            city: 'Riyadh',
            postal_code: '12211',
            center_latitude: 24.7136,
            center_longitude: 46.6753,
            radius_meters: 5000,
            is_active: true,
          },
        ],
        fee_bands: [
          {
            uuid: 'c3085732-9d53-414c-a2da-753312fbd01e',
            min_distance_meters: 0,
            max_distance_meters: 5000,
            fee_minor: 1500,
          },
        ],
      },
    ],
  },
];

const mapsProviderConfiguration = {
  provider: 'google_maps',
  google_maps: {
    api_key_configured: false,
    api_key_source: 'none',
    api_key_preview: null,
    region: 'sa',
    location_bias: 'circle:50000@24.7136,46.6753',
    timeout_seconds: 2.5,
    fallback_to_demo: true,
  },
  runtime: {
    ready: false,
    fallback_active: true,
    message:
      'Google Maps is selected and will use demo fallback until an API key is configured.',
  },
};

test('admin shell preserves desktop, RTL, and mobile structure', async ({
  page,
}, testInfo) => {
  await mockPortalApi(page);

  await page.goto('/ops/configuration');
  await page.getByLabel('Email address').fill('admin-shell@talabix.test');
  await page.getByLabel('Password').fill('password-for-smoke');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByRole('heading', { level: 1, name: 'Ops Configuration' })
  ).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.topbar')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Control commissions, branch order-taking, service zones, and fees',
    })
  ).toBeVisible();

  await expectShellMetrics(page, {
    sidebarMinWidth: 240,
    topbarMinHeight: 64,
  });
  await attachScreenshot(page, testInfo, 'admin-shell-desktop');

  await page.locator('.language-switcher button').nth(1).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(
    page.getByRole('heading', {
      name: 'التحكم في العمولات واستقبال طلبات الفروع ونطاقات الخدمة والرسوم',
    })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Control commissions, branch order-taking, service zones, and fees',
    })
  ).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ops/configuration');
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.topbar')).toBeVisible();
  await expectShellMetrics(page, {
    sidebarMinWidth: 0,
    topbarMinHeight: 56,
  });
  await attachScreenshot(page, testInfo, 'admin-shell-mobile');
});

async function mockPortalApi(page) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname
      .replace(/^\/api\/v1\/?/, '')
      .replace(/^ops\//, '');

    if (request.method() === 'POST' && path === 'auth/login') {
      await route.fulfill(jsonResponse(authSession));
      return;
    }

    if (request.method() === 'GET' && path === 'configuration/merchants') {
      await route.fulfill(jsonResponse(merchantConfigurations));
      return;
    }

    if (request.method() === 'GET' && path === 'configuration/maps-provider') {
      await route.fulfill(jsonResponse(mapsProviderConfiguration));
      return;
    }

    await route.fulfill(
      jsonResponse(
        { message: `Unhandled admin shell smoke route: ${path}` },
        404
      )
    );
  });
}

function jsonResponse(data, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify({ data }),
  };
}

async function expectShellMetrics(page, { sidebarMinWidth, topbarMinHeight }) {
  const metrics = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar')?.getBoundingClientRect();
    const topbar = document.querySelector('.topbar')?.getBoundingClientRect();

    return {
      sidebarWidth: Math.round(sidebar?.width ?? 0),
      topbarHeight: Math.round(topbar?.height ?? 0),
      scrollWidth: Math.ceil(document.documentElement.scrollWidth),
      viewportWidth: window.innerWidth,
    };
  });

  expect(metrics.sidebarWidth).toBeGreaterThanOrEqual(sidebarMinWidth);
  expect(metrics.topbarHeight).toBeGreaterThanOrEqual(topbarMinHeight);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

async function attachScreenshot(page, testInfo, name) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}
