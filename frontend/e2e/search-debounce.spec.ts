import { test, expect } from "@playwright/test";

/**
 * Checks whether typing in the marketplace search box fires an API request
 * per keystroke (missing debounce) or only after settling.
 */
test("marketplace search does not fire an API call per keystroke", async ({ page }) => {
  const apiCalls: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/")) apiCalls.push(req.url());
  });

  await page.goto("/marketplace");
  await expect(page.locator(".market-loading")).toHaveCount(0, { timeout: 20_000 });
  apiCalls.length = 0; // reset after initial load

  const search = page.locator(".public-search input");
  await search.fill("t");
  await search.fill("to");
  await search.fill("tom");
  await search.fill("toma");
  await search.fill("tomat");
  await search.fill("tomato");
  await page.waitForTimeout(1500);

  console.log(`API calls while typing 6 chars: ${apiCalls.length}`);
  console.log(JSON.stringify(apiCalls, null, 2));

  // A debounced search would fire 0-1 calls; firing 6 means no debounce.
  expect(apiCalls.length, "Search should be debounced").toBeLessThanOrEqual(2);
});