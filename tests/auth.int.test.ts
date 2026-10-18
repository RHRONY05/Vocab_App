import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { requireOwner, AuthError } from "@/lib/auth";

describe("Auth & Proxy integration", () => {
  describe("Proxy unauthenticated route protections", () => {
    it("redirects unauthenticated page request to /login", async () => {
      const req = new NextRequest("http://localhost:3000/");
      const res = await updateSession(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("returns 401 unauthorized for unauthenticated API requests", async () => {
      const req = new NextRequest("http://localhost:3000/api/words");
      const res = await updateSession(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "unauthorized" });
    });

    it("allows /api/cron/keepalive without authentication", async () => {
      const req = new NextRequest("http://localhost:3000/api/cron/keepalive");
      const res = await updateSession(req);

      // Should not redirect or return 401 from proxy
      expect(res.status).not.toBe(307);
      expect(res.status).not.toBe(401);
    });

    it("allows /login without authentication", async () => {
      const req = new NextRequest("http://localhost:3000/login");
      const res = await updateSession(req);

      // Should not redirect to /login
      expect(res.headers.get("location")).toBeNull();
    });
  });

  describe("requireOwner()", () => {
    it("throws AuthError 401 when no session exists", async () => {
      // In this test context, no cookie is provided
      await expect(requireOwner()).rejects.toThrow(AuthError);
      try {
        await requireOwner();
      } catch (err: unknown) {
        if (err instanceof AuthError) {
          expect(err.status).toBe(401);
          expect(err.message).toBe("unauthorized");
        } else {
          throw err;
        }
      }
    });

    it("throws AuthError 401 when user email does not match ALLOWED_EMAIL", async () => {
      const server = await import("@/lib/supabase/server");
      const mockCreateClient = vi.spyOn(server, "createClient").mockResolvedValueOnce({
        auth: {
          getUser: async () => ({
            data: { user: { id: "123", email: "stranger@example.com" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof server.createClient>>);

      await expect(requireOwner()).rejects.toThrow(AuthError);
      mockCreateClient.mockRestore();
    });
  });
});
