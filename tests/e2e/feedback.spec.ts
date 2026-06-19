import { test, expect } from '@playwright/test';

const SLUG = 'bambu-a1-mini-pla-04mm-balanced';

async function openProfilePage(page: import('@playwright/test').Page) {
  await page.route('**/api/feedback', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
  );
  await page.goto(`/profile/${SLUG}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test.describe('feedback prompt', () => {
  test('shows thank-you after submitting Yes', async ({ page }) => {
    await openProfilePage(page);

    await page.getByRole('button', { name: 'Yes — it worked' }).click();

    await expect(page.getByRole('status')).toHaveText(
      'Thanks. This helps us improve the profile for everyone.',
    );
    await expect(page.getByRole('button', { name: 'Yes — it worked' })).not.toBeVisible();
  });

  test('shows failure form then thank-you after submitting No with a reason', async ({ page }) => {
    await openProfilePage(page);

    await page.getByRole('button', { name: 'No — it failed' }).click();
    await expect(page.getByText('What went wrong?')).toBeVisible();

    await page.getByRole('checkbox', { name: 'Stringing or oozing' }).check();
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('status')).toHaveText(
      "Thanks for the report. We'll review this combination.",
    );
  });

  test('shows not-yet message after submitting I have not printed yet', async ({ page }) => {
    await openProfilePage(page);

    await page.getByRole('button', { name: "I haven't printed yet" }).click();

    await expect(page.getByRole('status')).toHaveText(
      'No problem — come back after your print and let us know how it went.',
    );
  });
});
