/* global document, window */

const { expect, test } = require('@playwright/test');
const { installAdminApiMock } = require('./admin-api-mock.cjs');

const designedAdminRoutes = [
  {
    path: '/ops/dashboard',
    heading: 'Ops Dashboard',
    content: 'Marketplace KPI view across orders, finance, and rider earnings',
  },
  {
    path: '/ops/account',
    heading: 'Account Security',
    content: 'Change your ops password',
  },
  {
    path: '/ops/users',
    heading: 'Ops Users',
    content: 'Invite and disable ops users',
  },
  {
    path: '/ops/configuration',
    heading: 'Ops Configuration',
    content:
      'Control commissions, branch order-taking, service zones, and fees',
  },
  {
    path: '/ops/catalog',
    heading: 'Merchant Catalog',
    content: 'Merchant-owned menu with branch overrides',
  },
  {
    path: '/ops/dispatch',
    heading: 'Dispatch Board',
    content: 'Auto-assignment with manual override',
  },
  {
    path: '/ops/promotions',
    heading: 'Promotion Offers',
    content: 'Manage promo-code and auto-apply offers',
  },
  {
    path: '/ops/settlements',
    heading: 'Settlement Ledger',
    content: 'Ledger-based reconciliation and manual adjustments',
  },
  {
    path: '/ops/support',
    heading: 'Support Console',
    content: 'Search orders, add notes, and watch outbound comms',
  },
];

test('designed admin routes render through the browser shell', async ({
  page,
}) => {
  const context = await setupAdminPage(page, '/ops/dashboard');

  for (const route of designedAdminRoutes) {
    await page.goto(route.path);
    await expect(
      page.getByRole('heading', { level: 1, name: route.heading })
    ).toBeVisible();
    await expect(page.getByText(route.content)).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page.locator('.nav-link.active')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }

  await expectCleanAdminPage(context);
});

test('ops users page supports invite and disable clicks', async ({ page }) => {
  const context = await setupAdminPage(page, '/ops/users');
  const inviteForm = page.getByTestId('ops-user-invite-form');

  await expect(
    page.getByRole('heading', { name: 'Invite and disable ops users' })
  ).toBeVisible();

  await inviteForm.getByLabel('Name').fill('Browser Support');
  await inviteForm
    .getByLabel('Email address')
    .fill('browser.support@talabix.test');
  await inviteForm.getByLabel('Phone number').fill('+966500000099');
  await inviteForm
    .getByLabel('Temporary password', { exact: true })
    .fill('TempPass123');
  await inviteForm
    .getByLabel('Confirm temporary password')
    .fill('TempPass123');
  await inviteForm.getByRole('button', { name: 'Invite ops user' }).click();

  await expect(page.getByRole('status')).toContainText(
    'Browser Support was invited.'
  );
  await expect(
    page.getByTestId('ops-user-browser.support@talabix.test')
  ).toBeVisible();

  const dispatchUser = page.getByTestId('ops-user-fahad.dispatch@talabix.test');
  await dispatchUser.getByRole('button', { name: 'Disable user' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Fahad Dispatch was updated.'
  );
  await expect(dispatchUser).toContainText('Suspended');

  await expectCleanAdminPage(context);
});

test('ops configuration page supports store, fee, zone, and maps clicks', async ({
  page,
}) => {
  const context = await setupAdminPage(page, '/ops/configuration');

  await expect(
    page.getByText(
      'Control commissions, branch order-taking, service zones, and fees'
    )
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add store' }).click();
  const storeForm = page.locator('.first-store-form');

  await storeForm.getByLabel('Store name').fill('Browser Bistro');
  await storeForm.getByLabel('Branch name').fill('Browser Branch');
  await storeForm.getByLabel('City').fill('Riyadh');
  await storeForm.getByLabel('Branch address').fill('Browser Street 12');
  await storeForm.getByRole('button', { name: 'Create store' }).click();

  await expect(page.getByRole('status')).toContainText(
    'Browser Bistro store was created.'
  );
  await page
    .getByLabel('Select merchant configuration')
    .selectOption({ label: 'Browser Bistro' });

  await page.getByLabel('Merchant platform commission bps').fill('1450');
  await page
    .getByRole('button', { name: 'Save merchant configuration' })
    .click();
  await expect(page.getByRole('status')).toContainText(
    'Browser Bistro commission saved at 14.50%.'
  );

  await page.getByLabel('Branch accepts orders').uncheck();
  await page.getByRole('button', { name: 'Save branch configuration' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Browser Branch branch settings saved.'
  );

  await page.getByLabel('Service zone name').fill('Browser Zone');
  await page.getByLabel('Service zone postal code').fill('12212');
  await page.getByLabel('Service zone radius meters').fill('9000');
  await page.getByRole('button', { name: 'Create service zone' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Browser Zone service zone saved.'
  );

  await page.getByLabel('Fee band maximum distance meters').fill('18000');
  await page.getByLabel('Fee band fee minor').fill('2100');
  await page.getByRole('button', { name: 'Create fee band' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Fee band 0-18000 meters saved.'
  );

  await page.getByLabel('Google Maps API key').fill('AIzaSyBrowserOnly1234');
  await page
    .getByRole('button', { name: 'Save maps provider configuration' })
    .click();
  await expect(page.getByRole('status')).toContainText(
    'Google Maps configuration saved.'
  );
  await expect(page.getByText('Configured via admin')).toBeVisible();

  await expectCleanAdminPage(context);
});

test('dispatch page supports manual reassignment clicks', async ({ page }) => {
  const context = await setupAdminPage(page, '/ops/dispatch');
  const assignmentCard = page.getByTestId(
    'dispatch-assignment-3bdb4618-3d6c-4736-b94f-c7e17f0ff972'
  );

  await expect(assignmentCard).toBeVisible();
  await assignmentCard.getByRole('button', { name: 'Manual reassign' }).click();
  await assignmentCard
    .getByLabel('New rider')
    .selectOption('ff10916f-9ec0-412f-b6c6-bd8f436f4002');
  await assignmentCard
    .getByLabel('Reassignment reason')
    .selectOption('sla_risk');
  await assignmentCard
    .getByLabel('Reassignment note')
    .fill('Move to the closer rider before SLA breach.');
  await assignmentCard
    .getByRole('button', { name: 'Confirm reassignment' })
    .click();

  await expect(page.getByRole('status')).toContainText(
    'Reassigned 3BDB4618 to Reem Al-Shehri for Sla Risk.'
  );

  await expectCleanAdminPage(context);
});

test('support page supports search, case, note, cancel, and retry clicks', async ({
  page,
}) => {
  const context = await setupAdminPage(page, '/ops/support');

  await expect(
    page.getByText('Search orders, add notes, and watch outbound comms')
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Search support orders' }).fill('Sara');
  await expect(
    page.getByTestId('support-order-4aa0f507-77b6-459c-adbe-ef8658cbdc51')
  ).toBeVisible();

  await page.getByRole('button', { name: 'Retry notification' }).click();
  await expect(page.getByText(/Notification retry completed for 4AA0F507/)).toBeVisible();

  await page
    .getByLabel('Support case summary')
    .fill('Merchant callback required before cancellation.');
  await page.getByLabel('Support case issue type').selectOption('merchant_issue');
  await page.getByRole('button', { name: 'Save support case' }).click();
  await expect(page.getByText(/Support case .* saved as/)).toBeVisible();

  await page
    .getByRole('textbox', { name: 'Support note body' })
    .fill('Customer confirmed they can take the handoff downstairs.');
  await page.getByRole('button', { name: 'Add support note' }).click();
  await expect(page.getByText('Support note added for 4AA0F507.')).toBeVisible();

  await page
    .getByLabel('Support cancellation note')
    .fill('Browser smoke cancellation drill.');
  await page.getByRole('button', { name: 'Cancel order' }).click();
  await expect(page.getByText(/Support cancelled order 4AA0F507/)).toBeVisible();

  await expectCleanAdminPage(context);
});

test('settlements page supports export and adjustment clicks', async ({
  page,
}) => {
  const context = await setupAdminPage(page, '/ops/settlements');

  await expect(
    page.getByText('Ledger-based reconciliation and manual adjustments')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Export ledger CSV' }).click();
  await expect(page.getByText(/ledger-export\.csv prepared/)).toBeVisible();

  await page
    .getByRole('textbox', { name: 'Settlement adjustment amount' })
    .fill('-375');
  await page
    .getByRole('textbox', { name: 'Settlement adjustment notes' })
    .fill('Customer compensation after late rider arrival.');
  await page
    .getByRole('button', { name: 'Issue settlement adjustment' })
    .click();

  await expect(page.getByText(/Adjustment -3\.75 SAR recorded/)).toBeVisible();

  await expectCleanAdminPage(context);
});

async function setupAdminPage(page, path) {
  const runtimeErrors = collectRuntimeErrors(page);
  const mock = await installAdminApiMock(page);

  await page.goto(path);
  await page.getByLabel('Email address').fill('admin-routes@talabix.test');
  await page.getByLabel('Password').fill('password-for-route-smoke');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.portal-shell')).toBeVisible();

  return {
    mock,
    runtimeErrors,
  };
}

function collectRuntimeErrors(page) {
  const errors = [];

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  return errors;
}

async function expectCleanAdminPage({ mock, runtimeErrors }) {
  await expect
    .poll(() => runtimeErrors, {
      message: 'browser runtime errors',
      timeout: 500,
    })
    .toEqual([]);
  expect(mock.unhandledRequests).toEqual([]);
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: Math.ceil(document.documentElement.scrollWidth),
    viewportWidth: window.innerWidth,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}
