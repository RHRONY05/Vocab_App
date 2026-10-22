import * as fs from "fs";
import * as path from "path";
import { createRequire } from "node:module";

if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error Node 20 polyfill for Supabase client
  globalThis.WebSocket = class DummyWebSocket {};
}

// Windows local DNS fallback for Supabase
const require = createRequire(import.meta.url);
const dns = require("node:dns");
const originalLookup = dns.lookup;
type DnsCb = (
  err: Error | null,
  address: string | Array<{ address: string; family: number }>,
  family?: number
) => void;
dns.lookup = function (hostname: string, options: unknown, callback: unknown) {
  let cb = callback as DnsCb;
  let opts = options;
  if (typeof options === "function") {
    cb = options as DnsCb;
    opts = {};
  }
  if (hostname === "vnadntttnwylvarcqwhe.supabase.co") {
    if (opts && typeof opts === "object" && (opts as { all?: boolean }).all) {
      return cb(null, [{ address: "172.64.149.246", family: 4 }]);
    }
    return cb(null, "172.64.149.246", 4);
  }
  return originalLookup(hostname, options, callback);
};

// Load .env.local into process.env if present
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
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
}
