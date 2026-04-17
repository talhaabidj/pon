import { expect, test } from '@playwright/test';

test('plays through the first bedroom, shop, reveal, and report loop', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('desktop-title')).toHaveText('PON Night Shift');
  await page.getByTestId('start-shift').click();
  await expect(page.getByTestId('bedroom-title')).toContainText('Night 1');
  await page.getByTestId('bedroom-pc').click();
  await expect(page.getByTestId('pc-modal')).toBeVisible();
  await page.getByTestId('pc-close').click();
  await page.getByTestId('bedroom-door').click();
  await expect(page.getByTestId('shop-title')).toHaveText('Gacha Department Store');

  await page.locator('[data-task-id]').first().click();
  await page.getByTestId('convert-tokens').click();
  await page.locator('[data-machine-id="machine-neon-cats"]').click();
  await expect(page.getByTestId('reveal-card')).toBeVisible();
  await page.getByTestId('reveal-continue').click();
  await expect(page.getByTestId('shop-title')).toHaveText('Gacha Department Store');
  await page.getByTestId('end-shift').click();
  await expect(page.getByTestId('end-report')).toBeVisible();
  await page.getByTestId('return-bedroom').click();
  await expect(page.getByTestId('bedroom-title')).toContainText('Night 2');

  expect(consoleErrors).toEqual([]);
});
