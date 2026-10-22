import { test, expect } from "@playwright/test";
import { resetE2EUser } from "../helpers/reset";

test.describe("Learn Page", () => {
  test.beforeEach(async ({ page }) => {
    await resetE2EUser();
    // Clear chat history before each test to start fresh on empty state
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("vocab_chat"));
    await page.reload();
  });

  test("lookup 'substantive' renders full card with all sections", async ({ page }) => {
    await page.goto("/");

    const input = page.getByRole("textbox", { name: "Look up a word" });
    await expect(input).toBeVisible();

    await input.fill("substantive");
    await page.locator("button.send").click();

    // WordCard should appear
    const headword = page.locator(".headword");
    await expect(headword).toHaveText("substantive");

    // Check sections
    await expect(page.getByText("Having real importance, value or effect")).toBeVisible();
    await expect(page.locator(".bangla")).toBeVisible();
    await expect(page.getByText("How it's used")).toBeVisible();
    await expect(page.getByText("Collocations")).toBeVisible();
    await expect(page.locator(".collocs").getByText("substantive changes")).toBeVisible();
    await expect(page.getByText("Patterns")).toBeVisible();
    await expect(page.getByText("Examples")).toBeVisible();
    await expect(page.getByText("Don't confuse")).toBeVisible();
    await expect(page.getByText("substantial")).toBeVisible();

    // Check examples have highlighted headword
    const marks = page.locator("mark.w");
    await expect(marks.first()).toBeVisible();

    // Check pronunciation sound button exists and can be clicked
    const soundBtn = page.getByRole("button", { name: /listen to pronunciation of substantive/i });
    await expect(soundBtn).toBeVisible();
    await soundBtn.click();
  });

  test("follow-up 'is it formal?' renders reply bubble with currentWord", async ({ page }) => {
    await page.goto("/");

    const input = page.getByRole("textbox", { name: "Look up a word" });
    await input.fill("substantive");
    await page.locator("button.send").click();

    await expect(page.locator(".headword")).toHaveText("substantive");

    // Ask follow-up
    await input.fill("is it formal?");
    await page.locator("button.send").click();

    // Reply bubble should appear with who label
    const reply = page.locator(".bubble-reply");
    await expect(reply).toBeVisible();
    await expect(reply.locator(".who")).toContainText("Reply · substantive");
    await expect(reply).toContainText("Yes, it's formal.");
  });

  test("typo 'recieve' shows 'Did you mean receive?' banner", async ({ page }) => {
    await page.goto("/");

    const input = page.getByRole("textbox", { name: "Look up a word" });
    await input.fill("recieve");
    await page.locator("button.send").click();

    // Typo banner
    const typoBanner = page.locator(".banner-warn");
    await expect(typoBanner).toBeVisible();
    await expect(typoBanner).toContainText("isn't a word. Did you mean");

    // Clicking suggestion 'receive' triggers lookup
    const suggestionBtn = typoBanner.getByRole("button", { name: "receive" });
    await expect(suggestionBtn).toBeVisible();
  });

  test("bangla toggle hides the Bangla line and survives page reload", async ({ page }) => {
    await page.goto("/");

    const input = page.getByRole("textbox", { name: "Look up a word" });
    await input.fill("substantive");
    await page.locator("button.send").click();

    // Initially Bangla line is visible
    const bangla = page.locator(".bangla");
    await expect(bangla).toBeVisible();

    // Toggle Bangla switch off
    const banglaSwitch = page.locator("label.switch:has-text('Bangla')");
    await banglaSwitch.click();

    // Bangla line should now be hidden
    await expect(bangla).toBeHidden();

    // Reload page
    await page.reload();

    // Bangla line should still be hidden because preference is saved in localStorage
    await expect(page.locator(".bangla")).toBeHidden();

    // Toggle back on
    await page.locator("label.switch:has-text('Bangla')").click();
    await expect(page.locator(".bangla")).toBeVisible();
  });

  test("/?q=cohesive runs lookup on load", async ({ page }) => {
    await page.goto("/?q=cohesive");

    // Should automatically run lookup and render cohesive card
    const headword = page.locator(".headword");
    await expect(headword).toHaveText("cohesive", { timeout: 10000 });
    await expect(page.getByText("Forming a united whole")).toBeVisible();
  });

  test("'/' shortcut focuses input on desktop", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop-only keyboard shortcut");

    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Look up a word" });

    // Click outside to blur
    await page.locator("h1.serif").click();
    await expect(input).not.toBeFocused();

    // Press '/' key
    await page.keyboard.press("/");
    await expect(input).toBeFocused();
  });
});
