import { test, expect } from "@playwright/test";
import { resetE2EUser } from "../helpers/reset";

test.describe("Words Page Flow", () => {
  test.beforeEach(async () => {
    await resetE2EUser();
  });

  test("empty state renders when no words are saved", async ({ page }) => {
    await page.goto("/words");
    await expect(page.getByText("No words yet")).toBeVisible();
    await expect(
      page.getByText("Look one up on the Learn tab and press Save.")
    ).toBeVisible();
  });

  test("displays words list, tabs with counts, and search filtering", async ({
    page,
  }) => {
    // Save two words first
    await page.goto("/?q=cohesive");
    await page.getByRole("button", { name: "Save cohesive" }).click();
    await expect(page.locator(".toast")).toContainText("Saved “cohesive”");

    await page.goto("/?q=substantive");
    await page.getByRole("button", { name: "Save substantive" }).click();
    await expect(page.locator(".toast")).toContainText("Saved “substantive”");

    // Go to Words page
    await page.goto("/words");

    // Check ProgressStrip stats
    const totalStat = page.locator(".stat:has-text('Total')");
    await expect(totalStat).toContainText("2");

    // Check tabs with counts
    const weekTab = page.getByRole("tab", { name: /Week/i });
    await expect(weekTab).toContainText("2");

    // Both words should be visible in list
    await expect(page.locator(".wrow:has-text('cohesive')")).toBeVisible();
    await expect(page.locator(".wrow:has-text('substantive')")).toBeVisible();

    // Filter using search box
    const searchInput = page.getByPlaceholder("Search words");
    await searchInput.fill("cohesive");

    // Wait for debounced search
    await expect(page.locator(".wrow:has-text('cohesive')")).toBeVisible();
    await expect(page.locator(".wrow:has-text('substantive')")).toBeHidden();

    // Clear search
    await searchInput.fill("");
    await expect(page.locator(".wrow:has-text('substantive')")).toBeVisible();
  });

  test("desktop selecting a row renders detail pane and delete dialog", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop two-pane view test");

    // Save word
    await page.goto("/?q=cohesive");
    await page.getByRole("button", { name: "Save cohesive" }).click();
    await expect(page.locator(".toast")).toContainText("Saved “cohesive”");

    await page.goto("/words");

    // First word is selected by default
    const detailHeadword = page.locator(".wc .headword");
    await expect(detailHeadword).toHaveText("cohesive");

    // WordStats progress and meter
    await expect(page.getByText("Progress")).toBeVisible();
    await expect(page.getByText("Box 0 of 5")).toBeVisible();
    await expect(page.getByText("Looked up")).toBeVisible();

    // Click Delete word
    const deleteBtn = page.getByRole("button", { name: "Delete word" });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Confirmation dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Delete “cohesive”?");
    await expect(dialog).toContainText("Its review history is deleted too.");

    // Click Cancel
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".wrow:has-text('cohesive')")).toBeVisible();

    // Click Delete again and confirm
    await deleteBtn.click();
    await dialog.getByRole("button", { name: "Delete" }).click();

    // Toast appears
    await expect(page.locator(".toast")).toContainText("Deleted “cohesive”");

    // List should now be empty
    await expect(page.getByText("No words yet")).toBeVisible();
  });

  test("mobile tapping a row opens /words/[id] with compact stats and delete", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Mobile detail view test");

    // Save word
    await page.goto("/?q=cohesive");
    await page.getByRole("button", { name: "Save cohesive" }).click();
    await expect(page.locator(".toast")).toContainText("Saved “cohesive”");

    await page.goto("/words");

    // Tap on word row
    await page.locator(".wrow:has-text('cohesive')").click();

    // Should navigate to /words/[id]
    await expect(page).toHaveURL(/\/words\/[a-f0-9-]+/);

    // Compact stats strip
    await expect(
      page.locator(".card").getByText(/box 0 of 5/i).first()
    ).toBeVisible();
    await expect(page.locator(".headword").first()).toHaveText("cohesive");

    // Delete button in header
    const deleteIconBtn = page.getByRole("button", { name: "Delete word" });
    await deleteIconBtn.click();

    // Dialog appears
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete" }).click();

    // Should redirect back to /words with toast
    await expect(page).toHaveURL(/\/words/);
    await expect(page.locator(".toast")).toContainText("Deleted “cohesive”");
  });
});
