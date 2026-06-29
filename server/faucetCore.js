import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  isAddress,
  getAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Logic faucet độc lập với framework. Nhận vào một `store` (memory / file / redis)
 * để dùng được ở cả Express (local) lẫn Serverless Function (Vercel).
 */
export function createFaucet({ store }) {
  const RPC_URL =
    process.env.RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc";
  const DRIP_AMOUNT = process.env.DRIP_AMOUNT ?? "0.05";
  const CLAIM_COOLDOWN_MS = Number(process.env.CLAIM_COOLDOWN_MS ?? 0);

  const PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY;
  if (!PRIVATE_KEY) throw new Error("Thiếu FAUCET_PRIVATE_KEY");

  const account = privateKeyToAccount(
    PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`
  );

  const transport = http(RPC_URL);
  const publicClient = createPublicClient({ chain: avalancheFuji, transport });
  const walletClient = createWalletClient({
    account,
    chain: avalancheFuji,
    transport,
  });

  const dripWei = parseEther(DRIP_AMOUNT);
  // TTL cho cooldown; 0 = chặn vĩnh viễn (1 lần / địa chỉ).
  const ttlSeconds =
    CLAIM_COOLDOWN_MS > 0 ? Math.ceil(CLAIM_COOLDOWN_MS / 1000) : 0;

  async function getStatus(rawAddress) {
    let faucetBalance = null;
    try {
      faucetBalance = formatEther(
        await publicClient.getBalance({ address: account.address })
      );
    } catch {
      /* ignore */
    }

    let claimed = false;
    let blockedReason = null;
    if (rawAddress && isAddress(rawAddress)) {
      const record = await store.get(rawAddress.toLowerCase());
      claimed = Boolean(record);
      if (claimed) {
        blockedReason =
          CLAIM_COOLDOWN_MS > 0
            ? "Bạn cần đợi hết thời gian chờ."
            : "Địa chỉ này đã nhận faucet rồi.";
      }
    }

    return {
      faucetAddress: account.address,
      faucetBalance,
      dripAmount: DRIP_AMOUNT,
      claimed,
      canClaim: !blockedReason,
      blockedReason,
    };
  }

  async function claim(rawAddress) {
    if (!rawAddress || !isAddress(rawAddress)) {
      throw httpError("Địa chỉ ví không hợp lệ.", 400);
    }

    const address = getAddress(rawAddress);
    const key = address.toLowerCase();

    // Đặt chỗ atomic: chặn double-claim kể cả khi nhiều request chạy song song
    // (quan trọng trên serverless vì không có state in-memory dùng chung).
    const reserved = await store.reserve(key, ttlSeconds);
    if (!reserved) {
      throw httpError(
        CLAIM_COOLDOWN_MS > 0
          ? "Bạn cần đợi hết thời gian chờ."
          : "Địa chỉ này đã nhận faucet rồi.",
        429
      );
    }

    try {
      const balance = await publicClient.getBalance({
        address: account.address,
      });
      if (balance < dripWei) {
        throw httpError(
          "Faucet đã hết AVAX. Vui lòng nạp thêm cho ví faucet.",
          503
        );
      }

      const txHash = await walletClient.sendTransaction({
        to: address,
        value: dripWei,
      });

      await store.set(key, { txHash, timestamp: Date.now() }, ttlSeconds);
      return { txHash, amount: DRIP_AMOUNT };
    } catch (err) {
      // Gửi thất bại -> thả chỗ để người dùng thử lại.
      await store.release(key);
      throw err;
    }
  }

  return {
    getStatus,
    claim,
    faucetAddress: account.address,
    dripAmount: DRIP_AMOUNT,
    cooldownMs: CLAIM_COOLDOWN_MS,
  };
}
