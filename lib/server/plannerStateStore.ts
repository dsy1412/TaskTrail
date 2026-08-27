import { createHash } from "crypto";
import type { PlannerState } from "@/lib/types";

type RedisResponse<T> = {
  result?: T;
  error?: string;
};

type DurableProvider = "vercel-kv" | "upstash-redis" | "upstash-redis-kv";

type RedisConfig = {
  provider: DurableProvider;
  url: string;
  token: string;
};

export type PlannerStorageDiagnostics =
  | { mode: "durable"; provider: DurableProvider; durable: true }
  | { mode: "memory"; provider: "server-memory"; durable: false };

const memoryStore = getMemoryStore();

export async function readUserPlannerState(email: string) {
  const key = plannerKey(email);
  const redis = redisConfig();

  if (!redis) {
    return memoryStore.get(key) ?? null;
  }

  const stored = await redisCommand<string | null>(redis, ["GET", key]);
  return stored ? (JSON.parse(stored) as PlannerState) : null;
}

export async function writeUserPlannerState(email: string, state: PlannerState) {
  const key = plannerKey(email);
  const value = JSON.stringify(state);
  const redis = redisConfig();

  if (!redis) {
    memoryStore.set(key, state);
    return;
  }

  await redisCommand(redis, ["SET", key, value]);
}

function plannerKey(email: string) {
  const digest = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return `tasktrail:planner:${digest}`;
}

function redisConfig() {
  const candidates: Array<{ provider: DurableProvider; url?: string; token?: string }> = [
    {
      provider: "vercel-kv" as const,
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    },
    {
      provider: "upstash-redis" as const,
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    {
      provider: "upstash-redis-kv" as const,
      url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
      token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
    },
  ];

  const configured = candidates.find((candidate): candidate is RedisConfig => Boolean(candidate.url && candidate.token));
  if (!configured) return null;
  return configured;
}

export function getPlannerStorageDiagnostics(): PlannerStorageDiagnostics {
  const redis = redisConfig();
  if (!redis) return { mode: "memory", provider: "server-memory", durable: false };
  return { mode: "durable", provider: redis.provider, durable: true };
}

async function redisCommand<T = unknown>(
  redis: { url: string; token: string },
  command: Array<string | number>,
) {
  const response = await fetch(redis.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redis.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await response.json()) as RedisResponse<T>;

  if (!response.ok || json.error) {
    throw new Error(json.error ?? `Redis request failed with ${response.status}`);
  }

  return json.result as T;
}

function getMemoryStore() {
  const globalStore = globalThis as typeof globalThis & {
    __tasktrailPlannerStore?: Map<string, PlannerState>;
  };

  if (!globalStore.__tasktrailPlannerStore) {
    globalStore.__tasktrailPlannerStore = new Map<string, PlannerState>();
  }

  return globalStore.__tasktrailPlannerStore;
}
