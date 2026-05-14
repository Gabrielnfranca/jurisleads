type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const state = new Map<string, RateLimitEntry>();

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  const realIp = req.headers.get("x-real-ip") || "";

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return realIp.trim();
}

export function checkRateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowMs: number
) {
  const ip = getClientIp(req) || "unknown";
  const now = Date.now();
  const key = `${scope}:${ip}`;
  const current = state.get(key);

  if (!current || current.resetAt <= now) {
    state.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true as const, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false as const, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  state.set(key, current);

  return { allowed: true as const, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}
