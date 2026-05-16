/**
 * In-memory rate limiter — phù hợp với single-server PM2 deployment.
 * Sliding window: mỗi key (IP) có tối đa `max` requests trong `windowMs`.
 *
 * Không dùng Redis/KV — nếu sau này scale multi-instance thì cần thay.
 */

interface Window {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, Window>();

// Dọn dẹp các entry hết hạn theo định kỳ (15 phút) để tránh memory leak
setInterval(
  () => {
    const now = Date.now();
    for (const [key, win] of store) {
      if (win.resetAt <= now) store.delete(key);
    }
  },
  15 * 60 * 1000,
);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

/**
 * Kiểm tra và tăng counter cho `key`.
 * @param key    Thường là IP address
 * @param max    Số request tối đa trong window
 * @param windowMs  Độ dài window (ms), mặc định 15 phút
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs = 15 * 60 * 1000,
): RateLimitResult {
  const now = Date.now();
  let win = store.get(key);

  if (!win || win.resetAt <= now) {
    win = { count: 1, resetAt: now + windowMs };
    store.set(key, win);
    return { allowed: true, remaining: max - 1, resetAt: win.resetAt };
  }

  win.count += 1;
  const remaining = Math.max(0, max - win.count);
  return { allowed: win.count <= max, remaining, resetAt: win.resetAt };
}

/**
 * Lấy IP từ request — ưu tiên header proxy, fallback về unknown.
 */
export function getClientIp(request: Request): string {
  // Cloudflare, Nginx proxy
  const cf = (request as Request & { headers: Headers }).headers.get("cf-connecting-ip");
  if (cf) return cf;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
