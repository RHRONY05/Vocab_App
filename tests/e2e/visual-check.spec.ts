import { test } from "@playwright/test";

test.describe("Visual Shell Check", () => {
  test("capture screenshots in light and dark mode", async ({ page, isMobile }) => {
    // Light mode
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.locator("main").waitFor({ state: "visible", timeout: 10000 });
    const mode = isMobile ? "mobile" : "desktop";
    await page.screenshot({ path: `tests/screenshots/${mode}-light.png`, fullPage: true });

    // Dark mode
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.locator("main").waitFor({ state: "visible", timeout: 10000 });
    await page.screenshot({ path: `tests/screenshots/${mode}-dark.png`, fullPage: true });
  });
});
