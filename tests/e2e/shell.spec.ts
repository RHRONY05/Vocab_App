import { test, expect } from "@playwright/test";

test.describe("App Shell", () => {
  test("renders home page shell correctly", async ({ page, isMobile }) => {
    await page.goto("/");

    // Verify page title
    await expect(page).toHaveTitle(/Vocab/);

    if (isMobile) {
      // Mobile header and bottom tab bar should be visible
      const mobileHeader = page.locator(".m-header");
      await expect(mobileHeader).toBeVisible();

      const tabbar = page.locator(".tabbar");
      await expect(tabbar).toBeVisible();
      await expect(tabbar.getByText("Learn")).toBeVisible();
      await expect(tabbar.getByText("Words")).toBeVisible();
      await expect(tabbar.getByText("Review")).toBeVisible();
    } else {
      // Desktop topbar should be visible
      const topbar = page.locator(".topbar");
      await expect(topbar).toBeVisible();
      await expect(topbar.getByText("Vocab")).toBeVisible();
      await expect(topbar.getByRole("link", { name: "Learn" })).toBeVisible();
      await expect(topbar.getByRole("link", { name: "Words" })).toBeVisible();
      await expect(topbar.getByRole("link", { name: "Review" })).toBeVisible();
    }

    // Main Learn empty state heading
    await expect(page.getByText("Met a new word?")).toBeVisible();
  });
});
