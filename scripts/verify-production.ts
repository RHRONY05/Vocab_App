import * as fs from "fs";
import * as path from "path";
import { chromium } from "@playwright/test";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

async function verify() {
  loadEnvLocal();
  const email = process.env.ALLOWED_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const baseUrl = "https://vocab-rony.vercel.app";

  if (!email || !password) {
    throw new Error("ALLOWED_EMAIL or OWNER_PASSWORD missing");
  }

  console.log("Launching browser to test production at:", baseUrl);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  page.on("response", async (res) => {
    if (res.url().includes("/api/")) {
      console.log("API RESPONSE:", res.url(), res.status());
      if (res.status() >= 400) {
        try {
          console.log("ERROR BODY:", await res.text());
        } catch {}
      }
    }
  });

  try {
    // 1. Visit /login
    console.log("1. Visiting /login...");
    await page.goto(`${baseUrl}/login`);
    await page.waitForLoadState("networkidle");

    // Check login form
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');

    console.log("2. Submitted login, waiting for navigation to /...");
    await page.waitForURL(`${baseUrl}/`, { timeout: 15000 });
    console.log("Successfully logged in and reached /");

    // 2. Check /words has the 6 seeded words
    console.log("3. Navigating to /words...");
    await page.goto(`${baseUrl}/words`);
    await page.waitForLoadState("networkidle");

    const seededWords = [
      "augmentation",
      "cohesive",
      "inference",
      "morph",
      "substantial",
      "substantive",
    ];

    for (const w of seededWords) {
      const el = page.locator(`.wrow .w:text-is("${w}")`);
      await el.waitFor({ timeout: 5000 });
      console.log(`✓ Word found in production list: ${w}`);
    }

    // 3. Test live lookup on /
    console.log("4. Navigating to / for live lookup test...");
    await page.goto(`${baseUrl}/`);
    await page.waitForLoadState("networkidle");

    const composerInput = page.locator(".composer input");
    await composerInput.fill("lucid");
    await composerInput.press("Enter");

    console.log("Submitted lookup for 'lucid', waiting for AI card...");
    // Wait for card header with "lucid"
    const headword = page.locator(".headword");
    await headword.waitFor({ timeout: 30000 });
    const wordText = await headword.textContent();
    console.log(`✓ Live AI response received and card rendered for '${wordText}'!`);

    // Verify card content elements
    const def = await page.locator(".meaning").first().textContent();
    console.log("Definition preview:", def?.slice(0, 60));

    console.log("🎉 ALL PRODUCTION CHECKS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Verification failed:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
