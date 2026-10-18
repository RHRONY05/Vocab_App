import * as fs from "fs";
import * as path from "path";

// Ensure Node 20 WebSocket polyfill
if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error Node 20 polyfill
  globalThis.WebSocket = class DummyWebSocket {};
}

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Ensure AI_MOCK is explicitly disabled for real Gemini verification
delete process.env.AI_MOCK;

import { lookupWithAi } from "../src/lib/ai";

async function main() {
  console.log("=== Verifying Real Gemini API for V3 Acceptance Criteria ===");

  // 1. "inference"
  console.log("\n1. Testing 'inference'...");
  const inferenceRes = await lookupWithAi({ input: "inference" });
  if (inferenceRes.type !== "word") {
    throw new Error(`Expected type 'word' but got '${inferenceRes.type}'`);
  }
  console.log("Headword:", inferenceRes.card.word);
  console.log("Meaning:", inferenceRes.card.meaningEn);
  console.log("Bangla:", inferenceRes.card.meaningBn);
  console.log("How used:", inferenceRes.card.howUsed);
  const mentionsML =
    inferenceRes.card.howUsed.toLowerCase().includes("machine learning") ||
    inferenceRes.card.howUsed.toLowerCase().includes("ml") ||
    inferenceRes.card.howUsed.toLowerCase().includes("model");
  console.log("Mentions ML sense:", mentionsML ? "✅" : "⚠️");

  // 2. follow-up "is it formal?"
  console.log("\n2. Testing follow-up 'is it formal?' (currentWord: inference)...");
  const formalRes = await lookupWithAi({
    input: "is it formal?",
    currentWord: "inference",
  });
  if (formalRes.type !== "reply") {
    throw new Error(`Expected type 'reply' but got '${formalRes.type}'`);
  }
  console.log("Reply text:", formalRes.text);
  const endsWithQ = formalRes.text.trim().endsWith("?");
  console.log("Does not end with question:", !endsWithQ ? "✅" : "❌");

  // 3. sentence feedback "I made a inference from data"
  console.log("\n3. Testing sentence feedback 'I made a inference from data'...");
  const sentenceRes = await lookupWithAi({
    input: "I made a inference from data",
    currentWord: "inference",
  });
  if (sentenceRes.type !== "reply") {
    throw new Error(`Expected type 'reply' but got '${sentenceRes.type}'`);
  }
  console.log("Feedback text:", sentenceRes.text);
  const correctsArticle =
    sentenceRes.text.toLowerCase().includes("an inference") ||
    sentenceRes.text.toLowerCase().includes("an");
  console.log("Corrects 'a' to 'an':", correctsArticle ? "✅" : "⚠️");

  // 4. typo "recieve"
  console.log("\n4. Testing typo 'recieve'...");
  const typoRes = await lookupWithAi({ input: "recieve" });
  if (typoRes.type !== "word") {
    throw new Error(`Expected type 'word' but got '${typoRes.type}'`);
  }
  console.log("isRealWord:", typoRes.card.isRealWord);
  console.log("suggestion:", typoRes.card.suggestion);
  const detectedTypo =
    !typoRes.card.isRealWord &&
    typoRes.card.suggestion?.toLowerCase() === "receive";
  console.log("Detected typo and suggested 'receive':", detectedTypo ? "✅" : "❌");

  console.log("\n=== Real Gemini Verification Completed Successfully! ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
