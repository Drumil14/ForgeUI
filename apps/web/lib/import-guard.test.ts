import { describe, it, expect, beforeEach } from "vitest";
import { checkImportAccess, parseAllowlist } from "./import-guard";
import { rateLimit, __resetRateLimits } from "./rate-limit";

const KEY = "aBcDeFgHiJkLmNoPqRsTuV";
const OTHER = "ZZZZ1111222233334444vv";

describe("checkImportAccess — authorization gate", () => {
  it("disables live import by default (no env configured)", () => {
    expect(checkImportAccess(KEY, {})).toEqual({
      allowed: false,
      reason: "disabled",
    });
  });

  it("allows only allowlisted keys when FIGMA_ALLOWED_FILE_KEYS is set", () => {
    const env = { allowedFileKeys: ` ${KEY} , someother ` };
    expect(checkImportAccess(KEY, env)).toEqual({
      allowed: true,
      mode: "allowlist",
    });
    expect(checkImportAccess(OTHER, env)).toEqual({
      allowed: false,
      reason: "not-allowlisted",
    });
  });

  it("allowlist takes precedence over the public flag", () => {
    const env = { allowedFileKeys: KEY, publicImport: "true" };
    // A non-allowlisted key is still rejected even though public=true.
    expect(checkImportAccess(OTHER, env).allowed).toBe(false);
  });

  it("opens to any key only when FIGMA_IMPORT_PUBLIC is exactly true", () => {
    expect(checkImportAccess(OTHER, { publicImport: "true" })).toEqual({
      allowed: true,
      mode: "open",
    });
    expect(checkImportAccess(OTHER, { publicImport: "TRUE" }).allowed).toBe(true);
    expect(checkImportAccess(OTHER, { publicImport: "1" }).allowed).toBe(false);
    expect(checkImportAccess(OTHER, { publicImport: "yes" }).allowed).toBe(false);
  });

  it("parseAllowlist trims, drops blanks, and handles undefined", () => {
    expect(parseAllowlist(undefined)).toEqual([]);
    expect(parseAllowlist(" a , , b ,")).toEqual(["a", "b"]);
  });
});

describe("rateLimit — in-memory fixed window", () => {
  beforeEach(() => __resetRateLimits());

  it("allows up to the limit, then blocks with a retry-after", () => {
    const opts = { limit: 3, windowMs: 60_000 };
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("ip-a", opts, t0).allowed).toBe(true);
    }
    const blocked = rateLimit("ip-a", opts, t0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates counters per key", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const t0 = 2_000_000;
    expect(rateLimit("ip-x", opts, t0).allowed).toBe(true);
    expect(rateLimit("ip-x", opts, t0).allowed).toBe(false);
    // A different client is unaffected.
    expect(rateLimit("ip-y", opts, t0).allowed).toBe(true);
  });

  it("resets after the window elapses", () => {
    const opts = { limit: 1, windowMs: 1_000 };
    const t0 = 3_000_000;
    expect(rateLimit("ip-z", opts, t0).allowed).toBe(true);
    expect(rateLimit("ip-z", opts, t0).allowed).toBe(false);
    // Past the window → fresh allowance.
    expect(rateLimit("ip-z", opts, t0 + 1_001).allowed).toBe(true);
  });
});
