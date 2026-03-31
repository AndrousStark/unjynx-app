import { test, expect } from '@playwright/test';

// These tests verify pages return correct HTTP status codes.
// Full authenticated flows require Logto test accounts.

test.describe('Public pages load', () => {
  test('login returns 200', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
  });

  test('signup returns 200', async ({ page }) => {
    const response = await page.goto('/signup');
    expect(response?.status()).toBe(200);
  });

  test('forgot-password returns 200', async ({ page }) => {
    const response = await page.goto('/forgot-password');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Protected pages redirect to login', () => {
  const protectedRoutes = [
    '/',
    '/tasks',
    '/board',
    '/calendar',
    '/timeline',
    '/table',
    '/projects',
    '/sprints',
    '/messaging',
    '/goals',
    '/analytics',
    '/ai-team',
    '/ai',
    '/settings',
    '/settings/mode',
    '/settings/members',
    '/settings/fields',
    '/settings/workflows',
    '/create-org',
    '/onboarding',
    '/profile',
    '/progress',
    '/focus',
    '/plan',
    '/templates',
    '/channels',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /login`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  }
});

test.describe('API health check', () => {
  test('backend health endpoint', async ({ request }) => {
    const response = await request.get('https://api.unjynx.me/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.status).toBe('ok');
  });
});
