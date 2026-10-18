import "./setup";

// Per 09-TESTING.md:
// "When tests start the app, they set ALLOWED_EMAIL=$E2E_EMAIL and AI_MOCK=1"
if (process.env.E2E_EMAIL) {
  process.env.ALLOWED_EMAIL = process.env.E2E_EMAIL;
}
process.env.AI_MOCK = "1";
