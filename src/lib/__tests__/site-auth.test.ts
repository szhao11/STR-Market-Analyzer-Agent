import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  expectedAuthCookieValue,
  isAuthenticated,
  isSiteAuthEnabled,
  verifySitePassword,
} from "@/lib/site-auth";

describe("site-auth", () => {
  const originalPassword = process.env.SITE_PASSWORD;
  const originalSecret = process.env.SITE_AUTH_SECRET;

  beforeEach(() => {
    process.env.SITE_PASSWORD = "test-password";
    process.env.SITE_AUTH_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.SITE_PASSWORD = originalPassword;
    process.env.SITE_AUTH_SECRET = originalSecret;
  });

  it("is disabled when SITE_PASSWORD is unset", () => {
    delete process.env.SITE_PASSWORD;
    expect(isSiteAuthEnabled()).toBe(false);
  });

  it("is enabled when SITE_PASSWORD is set", () => {
    expect(isSiteAuthEnabled()).toBe(true);
  });

  it("verifies the shared password with constant-time comparison", () => {
    expect(verifySitePassword("test-password")).toBe(true);
    expect(verifySitePassword("wrong-password")).toBe(false);
    expect(verifySitePassword("test-passwordx")).toBe(false);
  });

  it("issues a stable signed cookie token", async () => {
    const first = await expectedAuthCookieValue();
    const second = await expectedAuthCookieValue();
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
  });

  it("accepts a valid auth cookie and rejects invalid cookies", async () => {
    const token = await expectedAuthCookieValue();
    expect(await isAuthenticated(token)).toBe(true);
    expect(await isAuthenticated("not-a-valid-token")).toBe(false);
    expect(await isAuthenticated(undefined)).toBe(false);
  });

  it("allows all traffic when auth is disabled", async () => {
    delete process.env.SITE_PASSWORD;
    expect(await isAuthenticated(undefined)).toBe(true);
  });
});
