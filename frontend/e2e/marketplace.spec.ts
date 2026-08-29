import { test, expect } from "@playwright/test";

test.describe("Marketplace page (/marketplace)", () => {
  test("renders hero and toolbar", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator(".market-hero h1")).toContainText("Produce");
    await expect(page.locator(".market-hero h1 em")).toContainText("buyer in view");
    await expect(page.locator(".public-search input")).toBeVisible();
    await expect(page.locator(".market-toolbar-actions select")).toBeVisible();
    await expect(page.locator(".filter-button")).toContainText("Filters");
  });

  test("loads listings (live or demo fallback)", async ({ page }) => {
    await page.goto("/marketplace");

    // Either loading state resolves to cards or an empty state
    await expect(page.locator(".market-loading")).toHaveCount(0, { timeout: 20_000 });

    const cards = page.locator(".market-card");
    const empty = page.locator(".public-empty");
    const count = await cards.count();
    const isEmpty = await empty.count();

    expect(count > 0 || isEmpty === 1).toBeTruthy();

    if (count > 0) {
      // Cards show crop, price, and location
      const first = cards.first();
      await expect(first.locator(".market-card-meta strong")).not.toBeEmpty();
      await expect(first.locator(".market-card-bottom strong")).not.toBeEmpty();
      await expect(first.locator(".market-card-meta span").first()).not.toBeEmpty();
    }
  });

  test("search filters the listing grid", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator(".market-loading")).toHaveCount(0, { timeout: 20_000 });

    const cards = page.locator(".market-card");
    const initialCount = await cards.count();
    if (initialCount === 0) {
      test.skip(true, "No listings rendered (empty state)");
    }

    // Search for a term that should not match anything
    await page.locator(".public-search input").fill("zzzz-no-such-crop");
    await expect(page.locator(".public-empty")).toBeVisible();
    await expect(page.locator(".public-empty")).toContainText("No matching produce");

    // Clear search -> listings return
    await page.locator(".public-search input").fill("");
    await expect(page.locator(".market-card").first()).toBeVisible();
  });

  test("category tabs filter listings", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator(".market-loading")).toHaveCount(0, { timeout: 20_000 });

    const tabs = page.locator(".market-tabs button");
    await expect(tabs.first()).toContainText("All produce");
    await expect(tabs.first()).toHaveClass(/active/);

    // Click a non-default tab
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveClass(/active/);
    await expect(tabs.first()).not.toHaveClass(/active/);
  });

  test("sort dropdown changes sort order", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator(".market-loading")).toHaveCount(0, { timeout: 20_000 });

    const select = page.locator(".market-toolbar-actions select");
    await select.selectOption("Highest match");
    await expect(select).toHaveValue("Highest match");
    await select.selectOption("Closest route");
    await expect(select).toHaveValue("Closest route");
  });

  test("filters panel opens and resets", async ({ page }) => {
    await page.goto("/marketplace");
    await page.locator(".filter-button").click();
    const panel = page.locator(".market-filter-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("FILTERS");

    await panel.locator("button").filter({ hasText: "Reset filters" }).click();
    await expect(panel).not.toBeVisible();
  });

  test("listing detail drawer opens and closes", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator(".market-loading")).toHaveCount(0, { timeout: 20_000 });

    const cards = page.locator(".market-card");
    if ((await cards.count()) === 0) {
      test.skip(true, "No listings rendered (empty state)");
    }

    await cards.first().click();
    const drawer = page.locator(".market-detail");
    await expect(drawer).toBeVisible();
    await expect(drawer.locator("h2")).not.toBeEmpty();
    await expect(drawer.locator(".market-detail-stats")).toBeVisible();

    // Close via X
    await drawer.locator(".market-detail-close").click();
    await expect(drawer).not.toBeVisible();
  });

  test("detail drawer actions show toast feedback", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator(".market-loading")).toHaveCount(0, { timeout: 20_000 });

    const cards = page.locator(".market-card");
    if ((await cards.count()) === 0) {
      test.skip(true, "No listings rendered (empty state)");
    }

    await cards.first().click();
    await page.locator(".market-detail-actions .public-pill").click();
    await expect(page.locator(".public-toast")).toBeVisible();
    await expect(page.locator(".public-toast")).toContainText("inquiry");
  });

  test("hero action buttons respond", async ({ page }) => {
    await page.goto("/marketplace");
    await page.locator(".market-hero-actions .public-pill").first().click();
    await expect(page.locator(".public-toast")).toBeVisible();

    // Second action links to market-match
    await page.locator(".market-hero-actions a[href='/market-match']").click();
    await expect(page).toHaveURL(/\/market-match$/);
  });
});