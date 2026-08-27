import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlannerStorageDiagnostics, readUserPlannerState } from "@/lib/server/plannerStateStore";

describe("plannerStateStore", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("recognizes Vercel Upstash integration variables with a custom prefix", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_KV_REST_API_TOKEN", "secret-token");

    expect(getPlannerStorageDiagnostics()).toEqual({
      mode: "durable",
      provider: "upstash-redis-prefixed-kv",
      durable: true,
    });
  });

  it("cleans quoted and markdown-formatted Upstash variables", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_KV_REST_API_URL", '"[https://example.upstash.io](https://example.upstash.io)"');
    vi.stubEnv("UPSTASH_REDIS_REST_KV_REST_API_TOKEN", '"secret\\_token"');

    expect(getPlannerStorageDiagnostics()).toEqual({
      mode: "durable",
      provider: "upstash-redis-prefixed-kv",
      durable: true,
    });
  });

  it("includes the Redis provider and host when fetch fails before a response", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_KV_REST_API_URL", "https://present-yak-196970.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_KV_REST_API_TOKEN", "secret-token");
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("fetch failed"))));

    await expect(readUserPlannerState("tester@example.com")).rejects.toThrow(
      "Redis request failed before response (upstash-redis-prefixed-kv, present-yak-196970.upstash.io): fetch failed",
    );
  });
});
