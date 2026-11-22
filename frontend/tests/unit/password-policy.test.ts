import { describe, expect, it, vi } from "vitest";
import { breachCount, evaluatePassword } from "@/lib/password-policy";

describe("password policy (port of password_policy.dart)", () => {
  it("requires 10 characters", () => {
    expect(evaluatePassword("short1!").problem).toMatch(/at least 10/);
  });
  it("blocks common passwords and sequences", () => {
    expect(evaluatePassword("password123").problem).toMatch(/too common/);
    expect(evaluatePassword("abcdefghijk").problem).toMatch(/too common/);
    expect(evaluatePassword("aaaaaaaaaaaa").problem).toMatch(/too common/);
  });
  it("blocks the email name", () => {
    expect(evaluatePassword("priya-loves-tea-2026", "priya@example.com").problem).toMatch(/email name/);
  });
  it("accepts a long phrase as Strong", () => {
    const r = evaluatePassword("quiet oxblood ink at dawn");
    expect(r.problem).toBeNull();
    expect(r.label).toBe("Strong");
  });
});

describe("breach check", () => {
  it("sends only a 5-character SHA-1 prefix with padding", async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    // SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    const fake = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, headers: init?.headers as Record<string, string> });
      return new Response("1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\nABCDEF:0");
    });
    const n = await breachCount("password", fake as unknown as typeof fetch);
    expect(n).toBe(3861493);
    expect(calls[0]!.url).toBe("https://api.pwnedpasswords.com/range/5BAA6");
    expect(calls[0]!.headers["Add-Padding"]).toBe("true");
  });
  it("returns null when the service is unreachable", async () => {
    const n = await breachCount("x", (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch);
    expect(n).toBeNull();
  });
});
