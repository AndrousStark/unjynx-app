import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/UNJYNX/);
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('signup page renders correctly', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('text=Create')).toBeVisible();
  });

  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('text=Reset')).toBeVisible();
  });
});
