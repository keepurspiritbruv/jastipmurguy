const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

// ponytail: in-memory limiter (per-instance on serverless); swap for Upstash/Redis if the app gets targeted
export function allowLogin(ip: string): boolean {
  const now = Date.now();
  const cur = attempts.get(ip);
  if (!cur || now > cur.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  cur.count += 1;
  return cur.count <= MAX_ATTEMPTS;
}
