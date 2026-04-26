/* eslint-disable testing-library/prefer-screen-queries */

const { expect, test } = require('@playwright/test');

async function openRiderRoute(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
}

test.describe('rider delivery browser flow', () => {
  test('accepts an assignment, confirms pickup, captures proof, and completes delivery', async ({
    page,
  }) => {
    await openRiderRoute(page, '/assignments');

    await expect(
      page.getByText('Accept or decline the next order')
    ).toBeVisible();
    await expect(page.getByText('Waiting for rider acceptance')).toBeVisible();

    await page.getByTestId('accept-assignment').click();
    await expect(
      page.getByText(
        'Assignment accepted. Head to the merchant and confirm pickup next.'
      )
    ).toBeVisible();

    await page.getByTestId('dock-tab-delivery').click();
    await expect(page).toHaveURL(/\/delivery(?:\?|$)/);
    await expect(
      page.getByText('Complete the order and capture proof')
    ).toBeVisible();
    await expect(page.getByText('Ready for pickup confirmation')).toBeVisible();

    await page.getByTestId('confirm-pickup').click();
    await expect(
      page.getByText(
        'Pickup confirmed. Capture proof before completing delivery.'
      )
    ).toBeVisible();
    await expect(page.getByText('Ready for delivery completion')).toBeVisible();

    await page.getByTestId('delivery-recipient-name').fill('Sara Al-Qahtani');
    await page
      .getByTestId('delivery-proof-notes')
      .fill('Delivered to the lobby desk and confirmed with the customer.');
    await page.getByTestId('delivery-proof-reference').fill('handoff-7782');
    await page.getByTestId('complete-delivery').click();

    await expect(
      page.getByText('Delivery completed and proof captured.')
    ).toBeVisible();
    await expect(
      page.getByText('Delivered', { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText(/Delivered to Sara Al-Qahtani/i)).toBeVisible();
  });
});
