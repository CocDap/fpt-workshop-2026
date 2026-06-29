import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { Redis } from "@upstash/redis";

/**
 * Mỗi store cung cấp:
 *  - reserve(key, ttlSeconds): đặt chỗ atomic, trả về true nếu chưa tồn tại.
 *  - release(key): bỏ chỗ đã đặt (khi gửi tx thất bại).
 *  - get(key): trả về record đã claim (có txHash) hoặc null.
 *  - set(key, record, ttlSeconds): lưu record hoàn tất.
 */

function isAlive(entry) {
  if (!entry) return false;
  if (entry.expiresAt && Date.now() > entry.expiresAt) return false;
  return true;
}

/** Store lưu file JSON — dùng cho local dev (giữ trạng thái qua các lần restart). */
export function fileStore(filePath) {
  let data = {};
  if (existsSync(filePath)) {
    try {
      data = JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      data = {};
    }
  }
  const persist = () => writeFileSync(filePath, JSON.stringify(data, null, 2));

  return {
    async reserve(key, ttl) {
      if (isAlive(data[key])) return false;
      data[key] = {
        record: null,
        expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : 0,
      };
      persist();
      return true;
    },
    async release(key) {
      delete data[key];
      persist();
    },
    async get(key) {
      const entry = data[key];
      if (!isAlive(entry)) {
        if (entry) {
          delete data[key];
          persist();
        }
        return null;
      }
      return entry.record;
    },
    async set(key, record, ttl) {
      data[key] = { record, expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : 0 };
      persist();
    },
  };
}

/** Tên biến REST mà tích hợp Upstash trên Vercel (KV_*) hoặc Upstash trực tiếp (UPSTASH_*) cấp. */
export function getRedisCredentials() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}

export function hasRedis() {
  const { url, token } = getRedisCredentials();
  return Boolean(url && token);
}

/** Store dùng Upstash Redis (Vercel KV) — bắt buộc cho serverless trên Vercel. */
export function redisStore() {
  const { url, token } = getRedisCredentials();
  if (!url || !token) {
    throw new Error(
      "Thiếu KV_REST_API_URL/KV_REST_API_TOKEN (hoặc UPSTASH_REDIS_REST_URL/TOKEN)"
    );
  }
  const redis = new Redis({ url, token });
  const k = (key) => `faucet:${key}`;

  return {
    async reserve(key, ttl) {
      const opts = ttl > 0 ? { nx: true, ex: ttl } : { nx: true };
      const res = await redis.set(k(key), { reservedAt: Date.now() }, opts);
      return res === "OK";
    },
    async release(key) {
      await redis.del(k(key));
    },
    async get(key) {
      const val = await redis.get(k(key));
      if (!val) return null;
      // Chỉ coi là "đã claim" khi record có txHash (không chỉ là chỗ đặt).
      return val.txHash ? val : null;
    },
    async set(key, record, ttl) {
      const opts = ttl > 0 ? { ex: ttl } : {};
      await redis.set(k(key), record, opts);
    },
  };
}
