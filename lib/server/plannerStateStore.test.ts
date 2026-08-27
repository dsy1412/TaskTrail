import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlannerStorageDiagnostics } from "@/lib/server/plannerStateStore";

describe("plannerStateStore", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
});
