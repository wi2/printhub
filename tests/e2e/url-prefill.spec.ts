import { test, expect } from '@playwright/test';

test.describe('configure URL pre-fill', () => {
  test('activates generate immediately when all four params are valid', async ({ page }) => {
    await page.goto(
      '/configure?printer=bambu-a1-mini&material=pla&nozzle=0.4&goal=balanced',
    );

    await expect(page.getByLabel('Printer')).toHaveValue('Bambu Lab A1 Mini');
    await expect(page.getByRole('radio', { name: 'PLA' })).toBeChecked();
    await expect(page.getByRole('radio', { name: '0.4mm' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Balanced' })).toBeChecked();

    await expect(page.getByRole('button', { name: 'Generate profile' })).toBeEnabled();
  });
});
