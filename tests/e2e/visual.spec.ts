import { test, expect } from "@playwright/test";
import { resetE2EUser, seedE2EWords } from "../helpers/reset";
import { WordCard } from "@/lib/schemas";

const sampleCard: WordCard = {
  word: "substantive",
  partOfSpeech: "adjective",
  meaningEn: "Having a firm basis in reality and being important, meaningful, or considerable.",
  meaningBn: "বাস্তব বা অর্থপূর্ণ",
  register: "formal",
  howUsed: "Common in academic, legal, and workplace contexts.",
  collocations: ["substantive discussion", "substantive progress"],
  patterns: ["substantive change in sth"],
  examples: [
    "The two leaders held substantive talks on trade.",
    "No substantive changes were made to the proposal.",
    "We need substantive evidence before proceeding.",
    "Her report offered substantive insights into the issue.",
  ],
  dontConfuse: [
    {
      word: "substantial",
      difference: "Substantial means large in size or amount. Substantive means meaningful in content.",
    },
  ],
  isRealWord: true,
  suggestion: null,
};

test.describe("Visual Regression Checks", () => {
  test.beforeEach(async () => {
    await resetE2EUser();
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`capture main screens in ${scheme} mode`, async ({ page, isMobile }) => {
      await page.emulateMedia({ colorScheme: scheme });
      const device = isMobile ? "mobile" : "desktop";

      // 1. Learn empty
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Met a new word?" })).toBeVisible();
      await page.screenshot({ path: `tests/screenshots/${device}-${scheme}-learn-empty.png`, fullPage: true });

      // 2. Learn with card
      await page.goto("/?q=substantive");
      await expect(page.getByRole("heading", { name: "substantive" })).toBeVisible();
      await page.screenshot({ path: `tests/screenshots/${device}-${scheme}-learn-card.png`, fullPage: true });

      // 3. Words page
      await seedE2EWords([{ word: "substantive", card: sampleCard, box: 1 }]);
      await page.goto("/words");
      await expect(page.locator(".wrow .w", { hasText: "substantive" })).toBeVisible();
      await page.screenshot({ path: `tests/screenshots/${device}-${scheme}-words.png`, fullPage: true });

      // 4. Review start
      await page.goto("/review");
      await expect(page.getByRole("heading", { name: "Practice" })).toBeVisible();
      await page.screenshot({ path: `tests/screenshots/${device}-${scheme}-review-start.png`, fullPage: true });
    });
  }
});
