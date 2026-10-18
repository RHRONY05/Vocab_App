import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
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

interface AuditResult {
  page: string;
  viewport: "Desktop" | "Mobile";
  perf: number;
  a11y: number;
  bp: number;
  lcp: string;
  cls: string;
  tbt: string;
}

async function run() {
  loadEnvLocal();
  const baseUrl = "https://vocab-rony.vercel.app";
  const email = process.env.ALLOWED_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing ALLOWED_EMAIL or OWNER_PASSWORD in .env.local");
  }

  console.log("1. Logging in via Playwright to obtain session cookies...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseUrl}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${baseUrl}/`, { timeout: 15000 });

  const cookies = await context.cookies();
  const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  console.log(`Obtained ${cookies.length} session cookies.`);
  await browser.close();

  const outDir = path.resolve(process.cwd(), "tests/lighthouse/prod");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pagesToAudit = [
    { name: "/login", path: "/login", isPublic: true },
    { name: "/", path: "/", isPublic: false },
    { name: "/words", path: "/words", isPublic: false },
    { name: "/review", path: "/review", isPublic: false },
  ];

  const results: AuditResult[] = [];

  for (const p of pagesToAudit) {
    for (const viewport of ["Desktop", "Mobile"] as const) {
      const isDesktop = viewport === "Desktop";
      const sanitizedName = p.name === "/" ? "home" : p.name.replace(/\//g, "");
      const reportPath = path.join(
        outDir,
        `${sanitizedName}-${viewport.toLowerCase()}.json`
      );

      console.log(`\nAuditing ${p.name} on ${viewport}...`);

      const extraHeaders = p.isPublic
        ? "{}"
        : JSON.stringify({ Cookie: cookieString });

      const formFactorFlag = isDesktop ? "--preset=desktop" : "--form-factor=mobile --screenEmulation.mobile=true";
      const extraHeadersEscaped = extraHeaders.replace(/"/g, '\\"');

      const cmd = `npx lighthouse ${baseUrl}${p.path} --output=json --output-path="${reportPath}" --chrome-flags="--headless=new --no-sandbox" ${formFactorFlag} --extra-headers="${extraHeadersEscaped}" --only-categories=performance,accessibility,best-practices --quiet`;

      try {
        execSync(cmd, { stdio: "inherit" });
      } catch (err) {
        console.warn(`Lighthouse execution had warnings or non-zero exit:`, err);
      }

      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
        const cats = report.categories;
        const audits = report.audits;

        const perf = Math.round((cats.performance?.score || 0) * 100);
        const a11y = Math.round((cats.accessibility?.score || 0) * 100);
        const bp = Math.round((cats["best-practices"]?.score || 0) * 100);

        const lcpMs = audits["largest-contentful-paint"]?.numericValue || 0;
        const clsVal = audits["cumulative-layout-shift"]?.numericValue || 0;
        const tbtMs = audits["total-blocking-time"]?.numericValue || 0;

        results.push({
          page: p.name,
          viewport,
          perf,
          a11y,
          bp,
          lcp: `${(lcpMs / 1000).toFixed(1)}s`,
          cls: clsVal.toFixed(2),
          tbt: `${Math.round(tbtMs)}ms`,
        });
        console.log(`Scores for ${p.name} (${viewport}): Perf=${perf}, A11y=${a11y}, BP=${bp}, LCP=${(lcpMs / 1000).toFixed(1)}s, CLS=${clsVal.toFixed(2)}, TBT=${Math.round(tbtMs)}ms`);
      }
    }
  }

  console.log("\n================ PRODUCTION LIGHTHOUSE AUDIT TABLE ================\n");
  console.log("| Page | Viewport | Performance | Accessibility | Best Practices | LCP | CLS | TBT |");
  console.log("|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    console.log(
      `| \`${r.page}\` | ${r.viewport} | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.lcp} | ${r.cls} | ${r.tbt} |`
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
