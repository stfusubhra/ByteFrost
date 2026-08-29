import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("Story page (/story) renders content", async ({ page }) => {
    await page.goto("/story");
    await expect(page.locator(".story-hero h1")).toContainText("Less distance");
    await expect(page.locator(".story-hero h1 em")).toContainText("harvest and home");
    await expect(page.locator(".story-flow")).toContainText("THE PROBLEM");
    await expect(page.locator(".story-steps")).toContainText("THE KISANSETU APPROACH");
    await expect(page.locator(".story-copy a[href='/market-match']")).toContainText(
      "Find your market match"
    );
  });

  test("FAQ page (/faq) renders and has interactive items", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator(".faq-hero h1")).toContainText("answers");
    const items = page.locator(".faq-item");
    await expect(items.first()).toBeVisible();
    await expect(items).toHaveCount(6);

    // First item is open by default
    await expect(items.first()).toHaveClass(/open/);

    // Clicking toggles the item
    await items.first().locator("button").click();
    await expect(items.first()).not.toHaveClass(/open/);
    await items.first().locator("button").click();
    await expect(items.first()).toHaveClass(/open/);
  });

  test("Contact page (/contact) renders contact channels", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator(".contact-hero h1")).toContainText("market clearer");
    await expect(page.locator(".contact-details a[href='mailto:hello@kisansetu.in']")).toContainText(
      "hello@kisansetu.in"
    );
    await expect(page.locator(".contact-form")).toBeVisible();
  });

  test("Contact form validates required fields", async ({ page }) => {
    await page.goto("/contact");
    // Inputs are marked `required`, so the browser blocks submission with
    // native validation before React's handler runs. Assert no submission
    // happens (no success state, no demo note, page stays put).
    await page.locator(".contact-form button[type='submit']").click();
    await expect(page.locator(".contact-success")).toHaveCount(0);
    await expect(page.locator(".contact-demo-note")).toHaveCount(0);
    await expect(page.locator(".contact-form")).toBeVisible();
  });

  test("Contact form rejects invalid email", async ({ page }) => {
    await page.goto("/contact");
    await page.locator(".contact-form input").nth(0).fill("Test User");
    await page.locator(".contact-form input").nth(1).fill("not-an-email");
    await page.locator(".contact-form button[type='submit']").click();
    // `type="email"` triggers native validation; no submission occurs.
    await expect(page.locator(".contact-success")).toHaveCount(0);
    await expect(page.locator(".contact-form")).toBeVisible();
  });

  test("Contact form submits demo note successfully", async ({ page }) => {
    await page.goto("/contact");
    await page.locator(".contact-form input").nth(0).fill("Test User");
    await page.locator(".contact-form input").nth(1).fill("test@example.com");
    await page.locator(".contact-form select").selectOption({ index: 1 });
    await page.locator(".contact-form textarea").fill("Hello KisanSetu team!");
    await page.locator(".contact-form button[type='submit']").click();

    await expect(page.locator(".contact-status-success")).toContainText("Thank you");
    await expect(page.locator(".contact-success")).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.locator("h1")).toContainText("404");
    await expect(page.locator("h1 em")).toContainText("Route not found");
    await expect(page.locator(".public-hero .public-pill")).toContainText("Return to home");
  });

  test("404 page return-to-home link works", async ({ page }) => {
    await page.goto("/definitely-not-a-page");
    await page.locator(".public-hero .public-pill").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".prem-hero")).toBeVisible();
  });

  test("Dashboard entry (/dashboard) renders without auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator(".dashboard-hero h1")).toContainText("one view");
    await expect(page.locator(".dashboard-entry-grid article")).toHaveCount(3);
    await expect(page.locator(".dashboard-entry-grid article").first()).toContainText("DEMAND");
  });
});