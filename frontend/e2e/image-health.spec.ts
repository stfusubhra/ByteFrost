import { test, expect } from "@playwright/test";

/**
 * Image-health check across every public route.
 *
 * The marketplace demo data references /manus-storage/... paths that require a
 * storage proxy (BUILT_IN_FORGE_API_URL/BUILT_IN_FORGE_API_KEY). When the proxy
 * is not configured those requests fail — but the UI must never show a broken
 * image icon. The ListingImage component swaps in a styled placeholder instead.
 *
 * This test asserts the user-visible contract: no <img> on the page is broken
 * (naturalWidth === 0), and failed images render the fallback placeholder.
 */
const ROUTES = ["/", "/marketplace", "/market-match", "/story", "/faq", "/contact", "/dashboard"];

test.describe("Image health across public routes", () => {
  for (const route of ROUTES) {
    test(`no broken images displayed on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(3000);

      // Any <img> that finished loading but has zero natural width is broken
      // and would render as a broken-image icon.
      const broken = await page.evaluate(() => {
        const out: string[] = [];
        document.querySelectorAll("img").forEach((img) => {
          if (img.complete && img.naturalWidth === 0) {
            out.push(img.src);
          }
        });
        return out;
      });

      console.log(`[${route}] broken <img> elements: ${JSON.stringify(broken)}`);
      expect(broken, `Broken images displayed on ${route}: ${broken.join(", ")}`).toEqual([]);
    });
  }

  test("marketplace failed listing images render the fallback placeholder", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator(".market-loading")).toHaveCount(0, { timeout: 20_000 });

    const cards = page.locator(".market-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Every card must show either a working image or the styled fallback.
    const fallbacks = await page.locator(".market-card .market-image-fallback").count();
    const workingImages = await page.evaluate(() => {
      let n = 0;
      document.querySelectorAll(".market-card img").forEach((img) => {
        if (img.complete && img.naturalWidth > 0) n++;
      });
      return n;
    });
    console.log(`cards=${count} workingImages=${workingImages} fallbacks=${fallbacks}`);
    expect(workingImages + fallbacks).toBe(count);
  });
});