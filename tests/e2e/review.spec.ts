import { test, expect } from "@playwright/test";
import { resetE2EUser, seedE2EWords } from "../helpers/reset";
import { WordCard, QuizQuestion } from "@/lib/schemas";

const sampleCardCohesive: WordCard = {
  word: "cohesive",
  partOfSpeech: "adjective",
  meaningEn: "Forming a united whole.",
  meaningBn: "সুসংহত বা ঐক্যবদ্ধ",
  register: "neutral",
  howUsed: "Common in technical writing and teamwork.",
  collocations: ["cohesive team", "cohesive unit"],
  patterns: ["be cohesive"],
  examples: [
    "The team was cohesive under pressure.",
    "A cohesive architecture simplifies maintenance.",
    "The chapters form a cohesive story.",
    "Units must remain cohesive.",
  ],
  dontConfuse: [],
  isRealWord: true,
  suggestion: null,
};

const sampleQuizCohesive: QuizQuestion[] = [
  {
    kind: "meaning",
    prompt: "What is the primary meaning of cohesive?",
    options: [
      "Forming a united whole",
      "Separated into pieces",
      "Moving very quickly",
      "Extremely fragile",
    ],
    answerIndex: 0,
    explanation: "Cohesive describes elements that fit closely together.",
  },
  {
    kind: "fill_blank",
    prompt: "The new engineering team became a ____ unit within months.",
    options: ["cohesive", "coarse", "costly", "casual"],
    answerIndex: 0,
    explanation: "'Cohesive' fits the context of team unity.",
  },
];

const sampleCardMorph: WordCard = {
  word: "morph",
  partOfSpeech: "verb",
  meaningEn: "To change gradually from one form into another.",
  meaningBn: "ধীরে ধীরে রূপান্তরিত হওয়া",
  register: "neutral",
  howUsed: "Used in everyday, technical and media English.",
  collocations: ["morph into sth"],
  patterns: ["morph from A into B"],
  examples: [
    "The project morphed into a full commercial product.",
    "Caterpillars morph into butterflies.",
    "His hobby morphed into a business.",
    "The interface morphed dynamically.",
  ],
  dontConfuse: [],
  isRealWord: true,
  suggestion: null,
};

test.describe("Review Flow", () => {
  test.beforeEach(async () => {
    await resetE2EUser();
  });

  test("empty / all caught up review screen when no words are due", async ({ page }) => {
    await page.goto("/review");
    await expect(page.getByText("All caught up")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Practice" })).toBeVisible();
    // Start review button should not be present
    await expect(page.getByRole("button", { name: "Start review" })).not.toBeVisible();
  });

  test("full daily review flow with retries and end screen", async ({ page, isMobile }) => {
    // Seed 2 due words: 1 MCQ and 1 Recall
    await seedE2EWords([
      {
        word: "cohesive",
        card: sampleCardCohesive,
        quiz: sampleQuizCohesive,
        box: 0,
        dueNow: true,
      },
      {
        word: "morph",
        card: sampleCardMorph,
        quiz: [], // Empty quiz forces recall fallback
        box: 1,
        dueNow: true,
      },
    ]);

    await page.goto("/review");

    // Review start verification
    await expect(page.getByText("words due today")).toBeVisible();
    await expect(page.locator("section.card .serif.num")).toHaveText("2");

    const startBtn = page.getByRole("button", { name: /Start review/i });
    await expect(startBtn).toBeVisible();

    if (isMobile) {
      await startBtn.click();
    } else {
      // Desktop: test keyboard shortcut Enter to start
      await page.keyboard.press("Enter");
    }

    // Now in question session!
    // Tab bar should be hidden on mobile during active session
    if (isMobile) {
      await expect(page.locator("nav.tabbar")).not.toBeVisible();
      await expect(page.getByLabel("End session")).toBeVisible();
    }

    // Answer first question: deliberately choose wrong option to test end-of-session retry
    // Wait for options to render
    await expect(page.locator("button.option").first()).toBeVisible();
    const isMeaningQ = await page
      .getByText("What is the primary meaning of cohesive?")
      .isVisible();
    const distractorOption = isMeaningQ
      ? page.locator("button.option", { hasText: "Separated into pieces" })
      : page.locator("button.option", { hasText: "coarse" });
    await expect(distractorOption).toBeVisible();
    await distractorOption.click();

    // After answering: wrong option has red class, explanation box appears
    await expect(distractorOption).toHaveClass(/wrong/);
    await expect(page.locator("div.explain")).toBeVisible();

    // Test 'Open word →' modal
    const openWordLink = page.getByText("Open word →");
    await expect(openWordLink).toBeVisible();
    await openWordLink.click();

    // Word modal dialog appears
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Word details")).toBeVisible();
    // Close modal via Escape or close button
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Click Next (or press Enter)
    if (isMobile) {
      await page.getByRole("button", { name: "Next" }).click();
    } else {
      await page.keyboard.press("Enter");
    }

    // Second question is Recall (morph)
    await expect(page.getByText("Recall")).toBeVisible();
    await expect(page.getByRole("heading", { name: "morph" })).toBeVisible();
    await expect(page.getByText("Say the meaning in your head, then check.")).toBeVisible();

    // Reveal answer via button or Space
    if (isMobile) {
      await page.getByRole("button", { name: "Show answer" }).click();
    } else {
      await page.keyboard.press("Space");
    }

    // Revealed part appears
    await expect(page.getByText("To change gradually from one form into another.")).toBeVisible();
    await expect(page.getByText("Did you remember it?")).toBeVisible();

    // Mark 'I knew it'
    const knewBtn = page.getByRole("button", { name: /I knew it/i });
    await expect(knewBtn).toBeVisible();
    await knewBtn.click();

    // Since question 1 was answered wrong, it should be RETRIED now!
    await expect(page.getByText("Retry")).toBeVisible();

    // Answer correctly this time
    const correctOption = isMeaningQ
      ? page.locator("button.option", { hasText: "Forming a united whole" })
      : page.locator("button.option", { hasText: "cohesive" });
    await expect(correctOption).toBeVisible();
    await correctOption.click();

    await expect(correctOption).toHaveClass(/correct/);

    // Proceed to End Screen
    if (isMobile) {
      await page.getByRole("button", { name: "Next" }).click();
    } else {
      await page.keyboard.press("Enter");
    }

    // End Screen verification (D08 / M08)
    // Score should be 1 / 2 (first-pass correct)
    await expect(page.getByText("1 / 2")).toBeVisible();
    await expect(page.getByText("Missed · back tomorrow")).toBeVisible();
    await expect(page.getByRole("link", { name: /cohesive/i })).toBeVisible();

    // Bottom action: Back to Learn
    const backBtn = page.getByRole("button", { name: "Back to Learn" });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Returns to Learn
    await expect(page).toHaveURL("/");
  });

  test("practice session starts and completes", async ({ page, isMobile }) => {
    // Seed 3 words
    await seedE2EWords([
      {
        word: "cohesive",
        card: sampleCardCohesive,
        quiz: sampleQuizCohesive,
        box: 1,
        dueNow: false,
      },
      {
        word: "morph",
        card: sampleCardMorph,
        quiz: [],
        box: 1,
        dueNow: false,
      },
    ]);

    await page.goto("/review");

    // Practice card is visible
    await expect(page.getByRole("heading", { name: "Practice" })).toBeVisible();
    const startPracticeBtn = page.getByRole("button", { name: "Start practice" });
    await expect(startPracticeBtn).toBeVisible();
    await startPracticeBtn.click();

    // Practice session begins with Practice title
    if (isMobile) {
      await expect(page.getByLabel("End session")).toBeVisible();
      await expect(page.getByText("1 / 2")).toBeVisible();
    } else {
      await expect(page.getByText(/Practice ·/)).toBeVisible();
      await expect(page.getByText(/1 of/)).toBeVisible();
    }

    // End session early
    const endBtn = page.getByRole("button", { name: "End session" });
    if (await endBtn.isVisible()) {
      await endBtn.click();
    } else {
      // Mobile icon button
      await page.getByLabel("End session").click();
    }

    // Direct transition to End Screen
    await expect(page.getByRole("button", { name: "Back to Learn" })).toBeVisible();
  });
});
