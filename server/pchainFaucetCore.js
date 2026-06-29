import {
  pvm,
  utils,
  secp256k1,
  Context,
  TransferableOutput,
  addTxSignatures,
} from "@avalabs/avalanchejs";

// P-Chain dùng 9 chữ số thập phân (nAVAX), KHÁC C-Chain (18, wei).
const NANO = 1_000_000_000n; // 1 AVAX = 1e9 nAVAX

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** Đổi chuỗi AVAX thập phân -> bigint nAVAX (không dùng float để tránh sai số). */
function avaxToNano(amountStr) {
  const [whole, frac = ""] = String(amountStr).trim().split(".");
  const fracPadded = (frac + "000000000").slice(0, 9);
  return BigInt(whole || "0") * NANO + BigInt(fracPadded || "0");
}

function nanoToAvax(nano) {
  const whole = nano / NANO;
  const frac = (nano % NANO).toString().padStart(9, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

/** "P-fuji1..." hợp lệ thì trả về chính nó (đã chuẩn hoá), không thì null. */
function normalizePChainAddress(raw) {
  if (typeof raw !== "string") return null;
  const addr = raw.trim();
  if (!addr.startsWith("P-")) return null;
  try {
    utils.bech32ToBytes(addr); // ném lỗi nếu bech32 sai
    return addr;
  } catch {
    return null;
  }
}

/**
 * Faucet P-Chain — cùng cấu trúc `createFaucet({ store })` của C-Chain.
 * Dùng @avalabs/avalanchejs (mô hình UTXO), KHÔNG dùng viem.
 */
export function createPChainFaucet({ store }) {
  const RPC_URL = process.env.PCHAIN_RPC_URL ?? "https://api.avax-test.network";
  const HRP = process.env.PCHAIN_HRP ?? "fuji"; // "fuji" testnet, "avax" mainnet
  const DRIP_AMOUNT = process.env.PCHAIN_DRIP_AMOUNT ?? "0.001";
  const CLAIM_COOLDOWN_MS = Number(process.env.PCHAIN_CLAIM_COOLDOWN_MS ?? 0);

  const PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY;
  if (!PRIVATE_KEY) throw new Error("Thiếu FAUCET_PRIVATE_KEY");

  const privateKey = utils.hexToBuffer(utils.strip0x(PRIVATE_KEY));
  const publicKey = secp256k1.getPublicKey(privateKey);
  const fromAddressBytes = secp256k1.publicKeyBytesToAddress(publicKey);
  // Địa chỉ P-Chain của ví faucet (cùng private key với C-Chain nhưng khác format).
  const faucetAddress = `P-${utils.formatBech32(HRP, fromAddressBytes)}`;

  const pvmApi = new pvm.PVMApi(RPC_URL);
  const dripNano = avaxToNano(DRIP_AMOUNT);
  const ttlSeconds =
    CLAIM_COOLDOWN_MS > 0 ? Math.ceil(CLAIM_COOLDOWN_MS / 1000) : 0;

  const storeKey = (addr) => `pchain:${addr.toLowerCase()}`;

  async function getStatus(rawAddress) {
    let faucetBalance = null;
    try {
      const { balance } = await pvmApi.getBalance({
        addresses: [faucetAddress],
      });
      faucetBalance = nanoToAvax(balance);
    } catch {
      /* ignore */
    }

    let claimed = false;
    let blockedReason = null;
    const addr = normalizePChainAddress(rawAddress);
    if (addr) {
      const record = await store.get(storeKey(addr));
      claimed = Boolean(record);
      if (claimed) {
        blockedReason =
          CLAIM_COOLDOWN_MS > 0
            ? "Bạn cần đợi hết thời gian chờ."
            : "Địa chỉ này đã nhận faucet rồi.";
      }
    }

    return {
      faucetAddress,
      faucetBalance,
      dripAmount: DRIP_AMOUNT,
      claimed,
      canClaim: !blockedReason,
      blockedReason,
    };
  }

  async function claim(rawAddress) {
    const address = normalizePChainAddress(rawAddress);
    if (!address) {
      throw httpError("Địa chỉ P-Chain không hợp lệ (cần dạng P-...).", 400);
    }

    const key = storeKey(address);

    // Đặt chỗ atomic chống double-claim (giống C-Chain faucet).
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
      const context = await Context.getContextFromURI(RPC_URL);
      const feeState = await pvmApi.getFeeState();
      const { utxos } = await pvmApi.getUTXOs({ addresses: [faucetAddress] });

      const output = TransferableOutput.fromNative(
        context.avaxAssetID,
        dripNano,
        [utils.bech32ToBytes(address)]
      );

      const tx = pvm.newBaseTx(
        {
          feeState,
          fromAddressesBytes: [utils.bech32ToBytes(faucetAddress)],
          utxos,
          outputs: [output],
        },
        context
      );

      await addTxSignatures({ unsignedTx: tx, privateKeys: [privateKey] });
      const { txID } = await pvmApi.issueSignedTx(tx.getSignedTx());

      await store.set(key, { txHash: txID, timestamp: Date.now() }, ttlSeconds);
      return { txHash: txID, amount: DRIP_AMOUNT };
    } catch (err) {
      // Thất bại -> thả chỗ để thử lại. Lỗi UTXO rỗng = faucet hết tiền.
      await store.release(key);
      if (!err.status) err.status = 503;
      throw err;
    }
  }

  return {
    getStatus,
    claim,
    faucetAddress,
    dripAmount: DRIP_AMOUNT,
    cooldownMs: CLAIM_COOLDOWN_MS,
  };
}
