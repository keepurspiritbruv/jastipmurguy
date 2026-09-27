const REST_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const memory = new Map<string, { count: number; resetAt: number }>();

async function upstashIncr(key: string, ttlSeconds: number): Promise<number> {
  const res = await fetch(`${REST_URL}/incr/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}` },
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const json = (await res.json()) as { result?: number | string };
  const count = Number(json.result ?? 0);
  if (count === 1) {
    await fetch(`${REST_URL}/expire/${encodeURIComponent(key)}/${ttlSeconds}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REST_TOKEN}` },
    });
  }
  return count;
}

export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  if (REST_URL && REST_TOKEN) {
    try {
      const count = await upstashIncr(key, windowSeconds);
      return count <= max;
    } catch {
      // ponytail: fall back to in-memory limiter if Redis is unreachable
    }
  }
  const now = Date.now();
  const cur = memory.get(key);
  if (!cur || now > cur.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }
  cur.count += 1;
  return cur.count <= max;
}

export async function allowLogin(ip: string): Promise<boolean> {
  return rateLimit(`jastip:login:${ip}`, 10, 300);
}
