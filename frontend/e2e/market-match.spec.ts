import { test, expect } from "@playwright/test";

test.describe("Market Match page (/market-match) — demo flow (no auth)", () => {
  test("renders intro with demo disclaimer", async ({ page }) => {
    await page.goto("/market-match");
    await expect(page.locator(".match-intro h1")).toContainText("right market");
    await expect(page.locator(".match-demo-disclaimer")).toContainText("DEMO FLOW");
  });

  test("walks through all 4 demo steps to a result", async ({ page }) => {
    await page.goto("/market-match");

    const options = page.locator(".match-options button");
    const steps = [
      "What are you growing?",
      "How much is ready?",
      "Where is it?",
      "When can it move?",
    ];

    for (let i = 0; i < steps.length; i++) {
      await expect(page.locator(".match-question h2")).toHaveText(steps[i]);
      await expect(options).toHaveCount(3);
      await options.nth(0).click();
    }

    // Result screen
    await expect(page.locator(".match-result")).toBeVisible();
    await expect(page.locator(".match-result h2")).toContainText("Tomatoes");
    await expect(page.locator(".match-result-grid strong").first()).toContainText("92%");
    await expect(page.locator(".match-result")).toContainText("demo data");
  });

  test("back button returns to previous step", async ({ page }) => {
    await page.goto("/market-match");
    await page.locator(".match-options button").nth(0).click();
    await expect(page.locator(".match-question h2")).toHaveText(
      "How much is ready?"
    );

    await page.locator(".back-button").click();
    await expect(page.locator(".match-question h2")).toHaveText(
      "What are you growing?"
    );
  });

  test("start again resets the flow", async ({ page }) => {
    await page.goto("/market-match");
    for (let i = 0; i < 4; i++) {
      await page.locator(".match-options button").nth(0).click();
    }
    await expect(page.locator(".match-result")).toBeVisible();

    await page.locator(".match-result .text-button").click();
    await expect(page.locator(".match-question h2")).toHaveText(
      "What are you growing?"
    );
  });

  test("result links to marketplace", async ({ page }) => {
    await page.goto("/market-match");
    for (let i = 0; i < 4; i++) {
      await page.locator(".match-options button").nth(0).click();
    }
    await page.locator(".match-result a[href='/marketplace']").click();
    await expect(page).toHaveURL(/\/marketplace$/);
  });
});