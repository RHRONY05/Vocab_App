import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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

test.describe("Accessibility (A11y) Audits", () => {
  test.beforeEach(async () => {
    await resetE2EUser();
  });

  test("Login page has no serious or critical a11y violations", async ({ browser }) => {
    // Unauthenticated context (override project storageState)
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(severe).toEqual([]);
    await context.close();
  });

  test("Learn page with a card has no serious or critical a11y violations", async ({ page }) => {
    await page.goto("/?q=substantive");
    await expect(page.getByRole("heading", { name: "substantive" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(severe).toEqual([]);
  });

  test("Words page has no serious or critical a11y violations", async ({ page }) => {
    await seedE2EWords([
      {
        word: "substantive",
        card: sampleCard,
        box: 1,
      },
    ]);

    await page.goto("/words");
    await expect(page.locator(".wrow .w", { hasText: "substantive" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(severe).toEqual([]);
  });

  test("Review question has no serious or critical a11y violations", async ({ page }) => {
    await seedE2EWords([
      {
        word: "substantive",
        card: sampleCard,
        quiz: [
          {
            kind: "meaning",
            prompt: "What does substantive mean?",
            options: ["Meaningful and real", "Fake and empty", "Very fast", "Extremely tiny"],
            answerIndex: 0,
            explanation: "Substantive means meaningful in content.",
          },
          {
            kind: "fill_blank",
            prompt: "They made a ____ contribution to the project.",
            options: ["substantive", "slight", "shaky", "silent"],
            answerIndex: 0,
            explanation: "Substantive means important and meaningful.",
          },
        ],
        box: 0,
        dueNow: true,
      },
    ]);

    await page.goto("/review");
    await page.getByRole("button", { name: "Start review" }).click();
    await expect(page.locator("button.option").first()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(severe).toEqual([]);
  });
});
