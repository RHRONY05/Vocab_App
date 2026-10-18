import { test, expect } from "@playwright/test";

// Run isolated from saved session
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication flow", () => {
  const email = process.env.E2E_EMAIL || "e2e+vocab@gmail.com";
  const password = process.env.E2E_PASSWORD || "TestPassword123!";

  test("logged out user visiting / is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Vocab" })).toBeVisible();
    await expect(page.getByText("Sign in to continue")).toBeVisible();
  });

  test("entering wrong password displays error banner", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("wrongpassword_12345");
    await page.getByRole("button", { name: "Sign in" }).click();

    const banner = page.locator(".banner-danger");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Wrong email or password. Try again.");
  });

  test("valid credentials signs in to Learn page, and user can log out", async ({ page, isMobile }) => {
    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should redirect to Learn (/)
    await page.waitForURL("/", { timeout: 15000 });
    await expect(page.getByText("Met a new word?")).toBeVisible();

    // Log out flow
    if (isMobile) {
      // Open mobile account menu
      await page.locator(".m-header button[aria-label='Account menu']").click();
      await page.getByRole("button", { name: "Log out" }).click();
    } else {
      // Open desktop account menu
      await page.locator(".topbar button[aria-label='User menu']").click();
      await page.getByRole("button", { name: "Log out" }).click();
    }

    // Should redirect back to /login
    await page.waitForURL("**/login", { timeout: 15000 });
    await expect(page.getByText("Sign in to continue")).toBeVisible();
  });
});
