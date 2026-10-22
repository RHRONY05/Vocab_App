import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

if (typeof window === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dns = require("node:dns");
    if (!dns._vocabDnsPatched) {
      dns._vocabDnsPatched = true;
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
    }
  } catch {
    // Ignore in edge / non-node environments
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isKeepalive = pathname === "/api/cron/keepalive";
  const isApi = pathname.startsWith("/api/");
  const isAuthCallback = pathname.startsWith("/auth/");

  if (isKeepalive || isAuthCallback) {
    return supabaseResponse;
  }

  // Not logged in and not on login page
  if (!user && !isLoginPage) {
    if (isApi) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in user visiting login page -> redirect to /
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
