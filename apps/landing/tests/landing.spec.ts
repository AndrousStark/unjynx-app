import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Page load & meta
// ---------------------------------------------------------------------------
test.describe('Page load & meta', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(
      'UNJYNX - Break the satisfactory. Unjynx your productivity.',
    );
  });

  test('has correct meta description', async ({ page }) => {
    await page.goto('/');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute(
      'content',
      /UNJYNX.*TODO app.*WhatsApp.*Telegram/,
    );
  });
});

// ---------------------------------------------------------------------------
// Hero section
// ---------------------------------------------------------------------------
test.describe('Hero section', () => {
  test('hero is visible with heading and tagline', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();

    // Main heading
    await expect(hero.locator('h1')).toContainText('UNJYNX');

    // Tagline
    await expect(hero).toContainText(
      'Break the satisfactory. Unjynx your productivity.',
    );
  });

  test('CTA buttons are present', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('#hero');
    const appStoreBtn = hero.locator('a', {
      hasText: 'Download on App Store',
    });
    const playStoreBtn = hero.locator('a', {
      hasText: 'Get it on Google Play',
    });

    await expect(appStoreBtn).toBeVisible();
    await expect(playStoreBtn).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Features grid
// ---------------------------------------------------------------------------
test.describe('Features grid', () => {
  test('renders 6 feature cards', async ({ page }) => {
    await page.goto('/');

    const features = page.locator('#features');
    await expect(features).toBeVisible();

    // Each feature card is a div with an h3 inside the grid
    const cards = features.locator(
      '.grid > div',
    );
    await expect(cards).toHaveCount(6);
  });

  test('feature cards have titles', async ({ page }) => {
    await page.goto('/');

    const expectedTitles = [
      'Multi-Channel Reminders',
      'Smart Scheduling',
      'Ghost Mode',
      'Daily Wisdom',
      'Progress Dashboard',
      'Cross-Platform',
    ];

    for (const title of expectedTitles) {
      await expect(
        page.locator('#features').locator('h3', { hasText: title }),
      ).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Pricing table
// ---------------------------------------------------------------------------
test.describe('Pricing table', () => {
  test('shows Free, Pro, and Team columns', async ({ page }) => {
    await page.goto('/');

    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible();

    await expect(pricing.locator('h3', { hasText: 'Free' })).toBeVisible();
    await expect(pricing.locator('h3', { hasText: 'Pro' })).toBeVisible();
    await expect(pricing.locator('h3', { hasText: 'Team' })).toBeVisible();
  });

  test('Pro plan is highlighted as most popular', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.locator('#pricing').locator('text=Most Popular'),
    ).toBeVisible();
  });

  test('annual/monthly toggle switches prices', async ({ page }) => {
    await page.goto('/');

    // Default is monthly - Pro should show 6.99
    const proPrice = page
      .locator('#pricing .price-value')
      .nth(1);
    await expect(proPrice).toHaveText('6.99');

    // Click annual toggle
    await page.locator('#toggle-annual').click();
    await expect(proPrice).toHaveText('4.99');

    // Click monthly toggle to go back
    await page.locator('#toggle-monthly').click();
    await expect(proPrice).toHaveText('6.99');
  });
});

// ---------------------------------------------------------------------------
// FAQ accordion
// ---------------------------------------------------------------------------
test.describe('FAQ accordion', () => {
  test('FAQ items expand and collapse on click', async ({ page }) => {
    await page.goto('/');

    const faqSection = page.locator('#faq');
    await expect(faqSection).toBeVisible();

    // Get the first FAQ <details> element
    const firstFaq = faqSection.locator('details').first();

    // Initially closed - the answer paragraph should not be visible
    const answer = firstFaq.locator('div > p');
    await expect(answer).not.toBeVisible();

    // Click to expand
    await firstFaq.locator('summary').click();
    await expect(answer).toBeVisible();

    // Click to collapse
    await firstFaq.locator('summary').click();
    await expect(answer).not.toBeVisible();
  });

  test('FAQ has at least 5 questions', async ({ page }) => {
    await page.goto('/');

    const faqItems = page.locator('#faq details');
    const count = await faqItems.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
test.describe('Footer', () => {
  test('footer links are present', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Product links
    await expect(footer.locator('a', { hasText: 'Features' })).toBeVisible();
    await expect(footer.locator('a', { hasText: 'Pricing' })).toBeVisible();

    // Company links
    await expect(footer.locator('a', { hasText: 'Blog' })).toBeVisible();
    await expect(footer.locator('a', { hasText: 'Support' })).toBeVisible();

    // Legal links
    await expect(
      footer.locator('a', { hasText: 'Privacy Policy' }),
    ).toBeVisible();
    await expect(
      footer.locator('a', { hasText: 'Terms of Service' }),
    ).toBeVisible();
  });

  test('copyright notice is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toContainText('2026 UNJYNX');
  });
});

// ---------------------------------------------------------------------------
// Mobile responsive: hamburger menu
// ---------------------------------------------------------------------------
test.describe('Mobile responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger menu toggles mobile nav', async ({ page }) => {
    await page.goto('/');

    const mobileMenu = page.locator('#mobile-menu');
    const hamburger = page.locator('#mobile-menu-btn');

    // Mobile menu should be hidden initially
    await expect(mobileMenu).toBeHidden();

    // Hamburger button should be visible on small viewport
    await expect(hamburger).toBeVisible();

    // Click to open
    await hamburger.click();
    await expect(mobileMenu).toBeVisible();

    // Click a link to close
    await mobileMenu.locator('a').first().click();
    await expect(mobileMenu).toBeHidden();
  });

  test('desktop nav links are hidden on mobile', async ({ page }) => {
    await page.goto('/');

    // The desktop links container (hidden md:flex) should not be visible
    const desktopNav = page.locator('nav .hidden.md\\:flex');
    await expect(desktopNav).toBeHidden();
  });
});

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------
test.describe('Performance', () => {
  test('page loads in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(3_000);
  });
});

// ---------------------------------------------------------------------------
// SEO: Open Graph meta tags
// ---------------------------------------------------------------------------
test.describe('SEO', () => {
  test('Open Graph meta tags are present', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'website',
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /UNJYNX/,
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /og-image/,
    );
    await expect(
      page.locator('meta[property="og:site_name"]'),
    ).toHaveAttribute('content', /METAminds/);
  });

  test('Twitter Card meta tags are present', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      /UNJYNX/,
    );
  });

  test('canonical URL is set', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /.+/,
    );
  });

  test('structured data (JSON-LD) is present', async ({ page }) => {
    await page.goto('/');
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// Accessibility: main landmarks
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('main landmarks exist (header/nav, main, footer)', async ({ page }) => {
    await page.goto('/');

    // <nav> serves as the header landmark
    await expect(page.locator('nav').first()).toBeVisible();

    // <main> element
    await expect(page.locator('main')).toBeVisible();

    // <footer> element
    await expect(page.locator('footer')).toBeVisible();
  });

  test('images and interactive elements have accessible labels', async ({
    page,
  }) => {
    await page.goto('/');

    // Mobile menu button has aria-label
    await expect(page.locator('#mobile-menu-btn')).toHaveAttribute(
      'aria-label',
      /menu/i,
    );

    // Social links in footer have aria-label
    const socialLinks = page.locator('footer a[aria-label]');
    const count = await socialLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
