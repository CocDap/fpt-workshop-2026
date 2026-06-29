import { createFaucet } from "../server/faucetCore.js";
import { redisStore } from "../server/stores.js";

// Khởi tạo lười + cache giữa các lần gọi (warm invocations) trên Vercel.
let faucet;
function getFaucet() {
  if (!faucet) faucet = createFaucet({ store: redisStore() });
  return faucet;
}

export default async function handler(req, res) {
  try {
    const f = getFaucet();

    if (req.method === "GET") {
      const address =
        typeof req.query.address === "string" ? req.query.address : "";
      return res.status(200).json(await f.getStatus(address));
    }

    if (req.method === "POST") {
      const address = req.body?.address ?? "";
      return res.status(200).json(await f.claim(address));
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res
      .status(err.status ?? 500)
      .json({ error: err.message ?? "Lỗi faucet" });
  }
}
