/**
 * Smoke test — Verifies the game loads and the core flow works.
 *
 * Checks: loading screen appears → fades → desktop scene renders →
 * "Start Shift" button is clickable.
 */

import { test, expect, type Page } from '@playwright/test';

async function bootToDesktop(page: Page) {
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#loading-start-btn')).toBeVisible({ timeout: 5000 });
  await page.locator('#loading-start-btn').click();
  await page.locator('#loading-screen').waitFor({ state: 'hidden', timeout: 20000 });
}

test.describe('Catchapon Smoke Test', () => {
  test('loads the game and shows the desktop scene', async ({ page }) => {
    await bootToDesktop(page);

    // Canvas should be present (Three.js renderer)
    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // UI root should exist
    const uiRoot = page.locator('#ui-root');
    await expect(uiRoot).toBeAttached();
  });

  test('desktop scene has start shift button', async ({ page }) => {
    await bootToDesktop(page);

    // Desktop UI should mount with the start button
    const startBtn = page.locator('#btn-start-shift');
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await expect(startBtn).toContainText(/night shift/i);
  });

  test('enters bedroom directly without showing the old start gate', async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('pageerror', (error) => {
      browserErrors.push(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        browserErrors.push(message.text());
      }
    });

    await bootToDesktop(page);

    await page.locator('#btn-start-shift').click();
    await expect(page.locator('#bedroom-ui')).toBeAttached({ timeout: 5000 });
    await expect(page.locator('#bedroom-shift-start-overlay')).toHaveCount(0);
    await expect(page.locator('#interact-prompt-text')).toContainText(
      /Start Night Shift/i,
      { timeout: 5000 },
    );

    expect(browserErrors).toEqual([]);
  });

  test('bedroom door transitions into the shop scene', async ({ page }) => {
    await bootToDesktop(page);

    await page.locator('#btn-start-shift').click();
    await expect(page.locator('#bedroom-ui')).toBeAttached({ timeout: 5000 });
    await expect(page.locator('#interact-prompt-text')).toContainText(
      /Start Night Shift/i,
      { timeout: 5000 },
    );

    await page.locator('#canvas-container canvas').click({ position: { x: 640, y: 360 } });
    await page.waitForTimeout(250);
    await page.keyboard.press('KeyE');
    await expect(page.locator('#shop-hud')).toBeAttached({ timeout: 15000 });
    await expect(page.locator('#task-list .task-item').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('pause menu toggles with ESC and supports Resume action', async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('pageerror', (error) => {
      browserErrors.push(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        browserErrors.push(message.text());
      }
    });

    await bootToDesktop(page);
    await page.locator('#btn-start-shift').click();
    await expect(page.locator('#bedroom-ui')).toBeAttached({ timeout: 5000 });
    await page.locator('#canvas-container canvas').click({ position: { x: 640, y: 360 } });
    await page.waitForTimeout(250);

    await page.keyboard.press('Escape');
    const pauseMenu = page.locator('#pause-menu');
    await expect(pauseMenu).toHaveAttribute('data-open', 'true', {
      timeout: 5000,
    });
    await expect(page.locator('#pause-status')).toContainText(/ESC|Resume/i);

    // ESC quick-resume should close the pause menu.
    await page.keyboard.press('Escape');
    await expect(pauseMenu).toHaveAttribute('data-open', 'false', {
      timeout: 5000,
    });
    const clickResumeGate = page.locator('#pause-click-resume-overlay');
    await expect(clickResumeGate).toBeVisible({ timeout: 5000 });
    await clickResumeGate.click();

    const gateDismissed = await clickResumeGate.isHidden();
    if (!gateDismissed) {
      // Headless automation can deny pointer lock, which keeps the
      // click-to-resume gate visible by design.
      await expect(clickResumeGate).toBeVisible({ timeout: 5000 });
      expect(browserErrors).toEqual([]);
      return;
    }

    // Open pause again and ensure explicit Resume still works.
    await page.keyboard.press('Escape');
    await expect(pauseMenu).toHaveAttribute('data-open', 'true', {
      timeout: 5000,
    });

    await page.locator('#pause-resume-btn').click();
    await expect(pauseMenu).toHaveAttribute('data-open', 'false', {
      timeout: 5000,
    });
    await expect(clickResumeGate).toBeVisible({ timeout: 5000 });
    expect(browserErrors).toEqual([]);
  });

  test('page has correct title and meta', async ({ page }) => {
    await page.goto('/');

    // Title check
    await expect(page).toHaveTitle(/Catchapon/);

    // Meta description
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute('content', /gacha/i);
  });
});
