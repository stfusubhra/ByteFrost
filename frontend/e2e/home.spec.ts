import { test, expect } from "@playwright/test";

test.describe("Home page (/)", () => {
  test("renders hero, header, and footer", async ({ page }) => {
    await page.goto("/");

    // Announcement bar
    await expect(page.locator(".prem-announce")).toContainText(
      "Direct market intelligence"
    );

    // Header with wordmark and auth links
    await expect(page.locator(".prem-header")).toBeVisible();
    await expect(page.locator(".prem-header .prem-wordmark")).toContainText("KisanSetu");
    await expect(page.locator(".prem-header a[href='/login']")).toContainText("Sign in");
    await expect(page.locator(".prem-header a[href='/signup']")).toContainText("Sign up");

    // Hero
    const hero = page.locator(".prem-hero");
    await expect(hero).toBeVisible();
    await expect(hero.locator("h1")).toContainText("A clearer market");
    await expect(hero.locator("h1")).toContainText("every harvest");
    await expect(hero.locator("a[href='/marketplace']").first()).toContainText(
      "Explore the marketplace"
    );
    await expect(hero.locator("a[href='/market-match']").first()).toContainText(
      "Find your market match"
    );

    // Hero image loads
    const heroImg = hero.locator("img[alt*='Farmer working']");
    await expect(heroImg).toBeVisible();
    await expect(heroImg).toHaveJSProperty("complete", true);
  });

  test("hero CTA links navigate to the right pages", async ({ page }) => {
    await page.goto("/");

    await page.locator(".prem-hero a[href='/marketplace']").first().click();
    await expect(page).toHaveURL(/\/marketplace$/);
    await expect(page.locator(".market-hero h1")).toContainText("Produce");

    await page.goto("/");
    await page.locator(".prem-hero a[href='/market-match']").first().click();
    await expect(page).toHaveURL(/\/market-match$/);
    await expect(page.locator(".match-intro h1")).toContainText("market");
  });

  test("mobile menu opens and links work", async ({ page }) => {
    await page.goto("/");

    await page.locator(".prem-menu-btn").click();
    const menu = page.locator(".prem-menu");
    await expect(menu).toBeVisible();
    await expect(menu.locator("a[href='/marketplace']")).toContainText("Marketplace");
    await expect(menu.locator("a[href='/story']")).toContainText("Our story");

    await menu.locator("a[href='/faq']").click();
    await expect(page).toHaveURL(/\/faq$/);
  });

  test("scroll progress indicator updates on scroll", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator(".prem-scrollbar");
    // Initially scaleX(0) -> zero width, hidden
    await expect(bar).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    const transform = await bar.evaluate((el) => el.style.transform);
    expect(transform).not.toBe("scaleX(0)");
    // After scrolling, the bar becomes visible
    await expect(bar).toBeVisible();
  });

  test("count-up stats animate when scrolled into view", async ({ page }) => {
    await page.goto("/");
    await page.locator(".prem-match").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    const stats = page.locator(".prem-match-stats strong");
    await expect(stats.first()).toHaveText("92%");
    await expect(stats.nth(1)).toHaveText("28 km");
    await expect(stats.nth(2)).toHaveText("700 kg");
  });
});