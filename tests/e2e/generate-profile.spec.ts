import { test, expect } from '@playwright/test';

/** Launch combination validated in the manifest — used across E2E specs. */
const SLUG = 'bambu-a1-mini-pla-04mm-balanced';
const PROFILE_TITLE = 'Bambu Lab A1 Mini · PLA · 0.4mm · Balanced';

/**
 * Fills all four configure inputs for the Bambu A1 Mini PLA 0.4mm Balanced launch combo.
 * Waits for manifest-driven availability checks before enabling generate.
 */
async function fillLaunchCombination(page: import('@playwright/test').Page) {
  await page.getByLabel('Printer').click();
  await page.getByRole('option', { name: 'Bambu Lab A1 Mini' }).click();

  const materialGroup = page.getByRole('group', { name: 'Material' });
  await expect(materialGroup.getByText('PLA', { exact: true })).toBeVisible();
  await materialGroup.getByText('PLA', { exact: true }).click();

  await page.getByRole('group', { name: 'Nozzle Size' }).getByText('0.4mm').click();
  await page.getByRole('group', { name: 'Print Goal' }).getByText('Balanced', { exact: true }).click();

  await expect(page.getByRole('button', { name: 'Generate profile' })).toBeEnabled();
}

test.describe('primary generate flow', () => {
  test.beforeEach(async ({ page }) => {
    // Feedback API is fire-and-forget in the app; intercept so E2E does not depend on it.
    await page.route('**/api/feedback', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
    );
  });

  test('generates a profile from home through download and import guide', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Generate my profile' }).click();
    await expect(page).toHaveURL('/configure');

    await fillLaunchCombination(page);
    await page.getByRole('button', { name: 'Generate profile' }).click();

    await expect(page).toHaveURL(`/profile/${SLUG}`, { timeout: 5_000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(PROFILE_TITLE);

    const highlightsSection = page.getByRole('heading', { name: 'Key settings in this profile' }).locator('..');
    const highlights = highlightsSection.getByRole('listitem');
    await expect(highlights).toHaveCount(3);
    await expect(highlights.first()).toContainText('200mm/s');

    await page.getByRole('button', { name: 'Download profile' }).click();

    await expect(page.getByRole('status')).toHaveText('Download started');
    await expect(
      page.getByRole('heading', { name: /how to import your profile into bambu studio \/ orca slicer/i }),
    ).toBeVisible();
  });
});
