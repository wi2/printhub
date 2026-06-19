import { test, expect } from '@playwright/test';

test.describe('unavailable combination', () => {
  test('greys out TPU and keeps generate disabled when no validated profile exists', async ({
    page,
  }) => {
    await page.goto('/configure');

    await page.getByLabel('Printer').click();
    await page.getByRole('option', { name: 'Bambu Lab A1 Mini' }).click();

    const tpuRadio = page.getByRole('radio', { name: 'TPU (95A)' });
    await expect(tpuRadio).toBeDisabled();

    const materialGroup = page.getByRole('group', { name: 'Material' });
    await materialGroup.getByText('TPU (95A)').click({ force: true });
    await expect(tpuRadio).not.toBeChecked();

    await expect(page.getByRole('button', { name: 'Generate profile' })).toBeDisabled();
  });
});
