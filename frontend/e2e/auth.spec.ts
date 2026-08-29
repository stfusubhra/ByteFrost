import { test, expect } from "@playwright/test";

test.describe("Login page (/login)", () => {
  test("renders the auth form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator(".auth-form-head h1")).toContainText("Welcome back");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator(".auth-submit")).toContainText("Sign in");
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/login");
    const password = page.locator("#password");
    await password.fill("secret123");

    // Initially hidden
    await expect(password).toHaveAttribute("type", "password");

    // Toggle to show
    await page.locator(".auth-input-toggle").click();
    await expect(password).toHaveAttribute("type", "text");

    // Toggle back to hide
    await page.locator(".auth-input-toggle").click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("demo access toggle reveals and prefills demo buttons", async ({ page }) => {
    await page.goto("/login");

    // Hidden by default
    await expect(page.locator(".auth-demo")).toHaveCount(0);

    // Reveal demo access
    await page.locator(".auth-demo-toggle").click();
    const demo = page.locator(".auth-demo");
    await expect(demo).toBeVisible();

    await demo.locator("button").filter({ hasText: "Farmer demo" }).click();
    await expect(page.locator("#email")).toHaveValue("farmer.demo@kisansetu.in");
    await expect(page.locator("#password")).toHaveValue("demo123456");

    await demo.locator("button").filter({ hasText: "Buyer demo" }).click();
    await expect(page.locator("#email")).toHaveValue("buyer.demo@kisansetu.in");
  });

  test("submitting with empty fields shows inline error", async ({ page }) => {
    await page.goto("/login");
    await page.locator(".auth-submit").click();
    await expect(page.locator(".auth-error")).toContainText(
      "Email address is required."
    );
  });

  test("link to signup works", async ({ page }) => {
    await page.goto("/login");
    await page.locator(".auth-switch a[href='/signup']").click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.locator(".auth-form-head h1")).toContainText("Create account");
  });
});

test.describe("Signup page (/signup)", () => {
  test("renders the registration form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator(".auth-form-head h1")).toContainText("Create account");
    await expect(page.locator("#fullName")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
    await expect(page.locator(".auth-submit")).toContainText("Create account");
  });

  test("role selector switches active role", async ({ page }) => {
    await page.goto("/signup");
    const roles = page.locator(".auth-role-opt");

    // Default farmer
    await expect(roles.nth(0)).toHaveClass(/active/);
    await expect(roles.nth(0)).toHaveAttribute("aria-pressed", "true");

    // Switch to buyer
    await roles.nth(1).click();
    await expect(roles.nth(1)).toHaveClass(/active/);
    await expect(roles.nth(0)).not.toHaveClass(/active/);

    // Switch to FPO
    await roles.nth(2).click();
    await expect(roles.nth(2)).toHaveClass(/active/);
  });

  test("mismatched passwords show inline error", async ({ page }) => {
    await page.goto("/signup");
    await page.locator("#fullName").fill("Test Farmer");
    await page.locator("#email").fill("test@farm.in");
    await page.locator("#password").fill("secret123");
    await page.locator("#confirmPassword").fill("different456");
    await page.locator(".auth-submit").click();

    await expect(page.locator(".auth-error")).toContainText(
      "Passwords do not match"
    );
  });

  test("short password shows inline error", async ({ page }) => {
    await page.goto("/signup");
    await page.locator("#fullName").fill("Test Farmer");
    await page.locator("#email").fill("test@farm.in");
    await page.locator("#password").fill("123");
    await page.locator("#confirmPassword").fill("123");
    await page.locator(".auth-submit").click();

    await expect(page.locator(".auth-error")).toContainText(
      "at least 6 characters"
    );
  });

  test("password visibility toggles work for both fields", async ({ page }) => {
    await page.goto("/signup");
    const password = page.locator("#password");
    const confirm = page.locator("#confirmPassword");
    await password.fill("secret123");
    await confirm.fill("secret123");

    const toggles = page.locator(".auth-input-toggle");
    await expect(toggles).toHaveCount(2);

    await toggles.nth(0).click();
    await expect(password).toHaveAttribute("type", "text");
    await toggles.nth(1).click();
    await expect(confirm).toHaveAttribute("type", "text");
  });

  test("link to login works", async ({ page }) => {
    await page.goto("/signup");
    await page.locator(".auth-switch a[href='/login']").click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator(".auth-form-head h1")).toContainText("Welcome back");
  });
});