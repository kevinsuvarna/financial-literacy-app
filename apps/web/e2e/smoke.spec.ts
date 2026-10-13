import { expect, test } from '@playwright/test';

test('loads the starting screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Save the Savings Account')).toBeVisible();
});
