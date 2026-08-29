import { test, expect } from "@playwright/test";

test.describe("Public shell navigation", () => {
  test("header nav links navigate to all public pages", async ({ page }) => {
    await page.goto("/marketplace");

    const nav = page.locator(".public-header .public-nav");
    await expect(nav.locator("a[href='/marketplace']")).toContainText("Marketplace");
    await expect(nav.locator("a[href='/market-match']")).toContainText("Find your match");
    await expect(nav.locator("a[href='/login']")).toContainText("Sign in");
    await expect(nav.locator("a[href='/signup']")).toContainText("Sign up");

    await nav.locator("a[href='/market-match']").click();
    await expect(page).toHaveURL(/\/market-match$/);

    await nav.locator("a[href='/login']").click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("drawer menu opens, lists all links, and closes", async ({ page }) => {
    await page.goto("/marketplace");

    await page.locator(".public-menu-trigger").click();
    const drawer = page.locator(".public-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute("aria-modal", "true");

    const links = drawer.locator(".public-drawer-links a");
    await expect(links).toHaveCount(8); // Home, Marketplace, Match, Story, FAQ, Contact, Sign in, Create account
    await expect(drawer.locator("a[href='/']")).toContainText("Home");
    await expect(drawer.locator("a[href='/contact']")).toContainText("Contact");

    // Close via X button
    await drawer.locator(".public-drawer-close").click();
    await expect(drawer).not.toBeVisible();
  });

  test("drawer link navigates to the target page", async ({ page }) => {
    await page.goto("/marketplace");
    await page.locator(".public-menu-trigger").click();
    await page.locator(".public-drawer a[href='/story']").click();
    await expect(page).toHaveURL(/\/story$/);
    await expect(page.locator(".story-hero h1")).toContainText("Less distance");
  });

  test("footer contains brand, explore links, and contact info", async ({ page }) => {
    await page.goto("/marketplace");
    const footer = page.locator(".public-footer");
    await expect(footer).toBeVisible();
    await expect(footer.locator(".public-wordmark").first()).toContainText("KisanSetu");
    await expect(footer.locator(".public-footer-col a[href='/marketplace']")).toContainText("Marketplace");
    await expect(footer.locator(".public-footer-col a[href='/market-match']")).toContainText("Market match");
    await expect(footer.locator("a[href='/login']")).toContainText("Sign in");
    await expect(footer.locator("a[href='/signup']")).toContainText("Create account");
    await expect(footer.locator("a[href='mailto:hello@kisansetu.in']").first()).toContainText(
      "hello@kisansetu.in"
    );
  });

  test("wordmark navigates back to home", async ({ page }) => {
    await page.goto("/faq");
    await page.locator(".public-header .public-wordmark").click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("logged-in state shows Dashboard link and Logout", async ({ page }) => {
    await page.goto("/marketplace");
    await page.evaluate(() => localStorage.setItem("kisansetu_token", "fake-token"));
    await page.reload();

    const nav = page.locator(".public-header .public-nav");
    await expect(nav.locator("a[href='/dashboard']")).toContainText("Dashboard");
    await expect(nav.locator("button")).toContainText("Logout");
    await expect(nav.locator("a[href='/login']")).toHaveCount(0);
  });

  test("logout clears token and returns to home", async ({ page }) => {
    await page.goto("/marketplace");
    await page.evaluate(() => localStorage.setItem("kisansetu_token", "fake-token"));
    await page.reload();

    await page.locator(".public-header .public-nav button").click();
    await expect(page).toHaveURL(/\/$/);
    const token = await page.evaluate(() => localStorage.getItem("kisansetu_token"));
    expect(token).toBeNull();
  });
});