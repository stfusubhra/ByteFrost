import { test, expect } from "@playwright/test";

/**
 * Console & runtime health checks across every public route.
 * Catches uncaught exceptions, React errors, and broken API wiring.
 */

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/marketplace",
  "/market-match",
  "/story",
  "/faq",
  "/contact",
  "/dashboard",
  "/404",
  "/no-such-route",
];

test.describe("Console & runtime health", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`no uncaught errors on ${route}`, async ({ page }) => {
      const errors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      await page.goto(route);
      // Give client-side code time to run and settle
      await page.waitForTimeout(2500);

      expect(pageErrors, `Uncaught page errors on ${route}`).toEqual([]);
      // Filter out expected network failures (backend not running) and
      // benign image-loading noise; anything else is a real bug.
      const realErrors = errors.filter(
        (e) =>
          !e.includes("Failed to load resource") &&
          !e.includes("net::ERR") &&
          !e.includes("404") &&
          !e.includes("favicon") &&
          !e.includes("manus-storage") &&
          !e.includes("ERR_CONNECTION_REFUSED") &&
          !e.includes("ERR_NETWORK")
      );
      expect(realErrors, `Console errors on ${route}: ${realErrors.join(" | ")}`).toEqual([]);
    });
  }

  test("no React error boundary fallback on any page", async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      await page.waitForTimeout(1500);
      const boundary = page.locator("[data-error-boundary], .error-boundary, .error-fallback");
      const count = await boundary.count();
      expect(count, `Error boundary triggered on ${route}`).toBe(0);
    }
  });
});