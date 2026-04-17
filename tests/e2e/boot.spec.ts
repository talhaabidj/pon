import { expect, test } from '@playwright/test';

test('starts at the desktop and transitions into the bedroom stub', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');
  await expect(page.getByTestId('desktop-title')).toHaveText('PON Night Shift');
  await page.getByTestId('start-shift').click();
  await expect(page.getByTestId('bedroom-title')).toHaveText('Bedroom Hub Stub');

  expect(consoleErrors).toEqual([]);
});
