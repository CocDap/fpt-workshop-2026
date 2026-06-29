import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import express from "express";
import cors from "cors";

import { createFaucet } from "./faucetCore.js";
import { fileStore, redisStore, hasRedis } from "./stores.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

// Có Redis thì dùng Redis, không thì lưu file JSON (tiện cho local dev).
const usingRedis = hasRedis();
const store = usingRedis
  ? redisStore()
  : fileStore(join(__dirname, "claims.json"));

const faucet = createFaucet({ store });

const app = express();
app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }));

app.get("/api/faucet", async (req, res) => {
  try {
    res.json(await faucet.getStatus(String(req.query.address ?? "")));
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

app.post("/api/faucet", async (req, res) => {
  try {
    res.json(await faucet.claim(String(req.body?.address ?? "")));
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`💧 Faucet server chạy tại http://localhost:${PORT}`);
  console.log(`   Ví faucet : ${faucet.faucetAddress}`);
  console.log(`   Mỗi lượt  : ${faucet.dripAmount} AVAX`);
  console.log(
    `   Giới hạn  : ${
      faucet.cooldownMs > 0
        ? `cooldown ${faucet.cooldownMs}ms`
        : "1 lần / địa chỉ"
    }`
  );
  console.log(
    `   Store     : ${usingRedis ? "Upstash Redis (KV)" : "file (claims.json)"}`
  );
});
