import { test, expect } from "@playwright/test";
import { resetE2EUser } from "../helpers/reset";

test.describe("Save Word Flow", () => {
  test.beforeEach(async ({ page }) => {
    await resetE2EUser();
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("vocab_chat"));
    await page.reload();
  });

  test("lookup and save 'cohesive' updates UI and toast", async ({ page }) => {
    await page.goto("/?q=cohesive");

    // Wait for card to render
    const headword = page.locator(".headword");
    await expect(headword).toHaveText("cohesive", { timeout: 10000 });

    // Save button should be visible with 'Save' and shortcut
    const saveButton = page.getByRole("button", { name: "Save cohesive" });
    await expect(saveButton).toBeVisible();

    // Click Save
    await saveButton.click();

    // Save button changes to "Saved" badge
    await expect(page.locator("span.btn-saved")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("span.btn-saved")).toContainText("Saved");

    // Toast should show "Saved “cohesive”"
    await expect(page.locator(".toast")).toBeVisible();
    await expect(page.locator(".toast")).toContainText("Saved “cohesive”");

    // Navigate to Words tab
    await page.goto("/words");

    // "cohesive" should appear in list
    const cohesiveRow = page.locator(".wrow:has-text('cohesive')");
    await expect(cohesiveRow).toBeVisible();

    // Check Today count is at least 1
    const todayTab = page.getByRole("tab", { name: /Today/i });
    await expect(todayTab).toContainText("1");
  });

  test("saving again updates existing word without duplicating rows", async ({ page }) => {
    // Save cohesive the first time
    await page.goto("/?q=cohesive");
    const saveButton = page.getByRole("button", { name: "Save cohesive" });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await expect(page.locator("span.btn-saved")).toBeVisible();
    await expect(page.locator(".toast")).toContainText("Saved “cohesive”");

    // Clear chat and look up cohesive again
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("vocab_chat"));
    await page.goto("/?q=cohesive");

    // When looked up again, it's already saved, so it shows the Saved status and banner
    await expect(page.locator("span.btn-saved")).toBeVisible({ timeout: 10000 });
    const banner = page.locator(".banner-neutral, .banner-accent");
    await expect(banner).toBeVisible();

    // Go to Words page and verify only 1 row exists
    await page.goto("/words");
    const cohesiveRows = page.locator(".wrow:has-text('cohesive')");
    await expect(cohesiveRows).toHaveCount(1);
  });

  test("Ctrl+S shortcut saves the latest looked-up word on desktop", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop keyboard shortcut test");

    await page.goto("/?q=substantive");
    await expect(page.locator(".headword")).toHaveText("substantive");

    // Press Control+S
    await page.keyboard.press("Control+s");

    // Should trigger save and show toast and Saved status
    await expect(page.locator("span.btn-saved")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".toast")).toContainText("Saved “substantive”");
  });
});
