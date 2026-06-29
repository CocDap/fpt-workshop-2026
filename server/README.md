# Faucet backend

Phát AVAX testnet, mỗi địa chỉ nhận `DRIP_AMOUNT` (mặc định 0.05). Private key chỉ tồn tại ở backend / biến môi trường, không bao giờ ra frontend.

Hỗ trợ **2 chain** dùng chung 1 private key (`FAUCET_PRIVATE_KEY`):

- **C-Chain** (`faucetCore.js`): EVM, viem, địa chỉ `0x...`, đơn vị wei (18 số).
- **P-Chain** (`pchainFaucetCore.js`): UTXO, `@avalabs/avalanchejs`, địa chỉ `P-fuji1...`, đơn vị nAVAX (9 số).

> Cùng private key nhưng số dư C-Chain và P-Chain **tách biệt**. Phải nạp AVAX riêng cho ví P-Chain (cross-chain export/import C→P hoặc faucet P-Chain).

Logic dùng chung (`faucetCore.js`) chạy được ở 2 môi trường:

- **Local**: Express server (`faucet.js`) + store file `claims.json`.
- **Vercel**: Serverless Function (`/api/faucet.js`) + store Upstash Redis (vì serverless không ghi file được).

## API

Một endpoint, phân biệt theo method:

| Method | Endpoint | Body / Query | Mô tả |
| --- | --- | --- | --- |
| `GET` | `/api/faucet` | `?address=0x...` | C-Chain: số dư faucet + trạng thái claim |
| `POST` | `/api/faucet` | `{ "address": "0x..." }` | C-Chain: gửi `DRIP_AMOUNT` AVAX |
| `GET` | `/api/faucet/pchain` | `?address=P-fuji1...` | P-Chain: số dư faucet + trạng thái claim |
| `POST` | `/api/faucet/pchain` | `{ "address": "P-fuji1..." }` | P-Chain: gửi `PCHAIN_DRIP_AMOUNT` AVAX |

## Chạy local

Tạo `.env` ở thư mục gốc:

```dotenv
FAUCET_PRIVATE_KEY=0xyour_private_key_here
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
DRIP_AMOUNT=0.05
CLAIM_COOLDOWN_MS=0          # 0 = 1 lần/địa chỉ; >0 = cooldown (ms)
PORT=8787
CORS_ORIGIN=http://localhost:5173
# VITE_FAUCET_API: bỏ trống là được vì Vite đã proxy /api -> :8787

# --- P-Chain (dùng chung FAUCET_PRIVATE_KEY) ---
PCHAIN_DRIP_AMOUNT=0.001
PCHAIN_RPC_URL=https://api.avax-test.network
PCHAIN_HRP=fuji             # "fuji" testnet, "avax" mainnet
PCHAIN_CLAIM_COOLDOWN_MS=0
```

```bash
npm run faucet   # backend
npm run dev      # frontend (proxy /api sang :8787)
```

Không set `UPSTASH_REDIS_REST_URL` → tự dùng file `claims.json`.

## Cơ chế giới hạn "1 địa chỉ → 0.05 AVAX"

- Số tiền **cố định ở server** (`DRIP_AMOUNT`), client không tự yêu cầu nhiều hơn được.
- Mỗi địa chỉ được **đặt chỗ atomic** trước khi gửi (`store.reserve`), nên dù nhiều request chạy song song (đặc biệt trên serverless) cũng không bị double-claim.
- `CLAIM_COOLDOWN_MS=0` → chặn vĩnh viễn; `>0` → cho nhận lại sau TTL.
- Gửi tx thất bại sẽ tự nhả chỗ để người dùng thử lại.

> Giới hạn theo address chặn user thường, không chặn người tạo vô số ví mới. Nếu cần chặt hơn: thêm rate-limit theo IP hoặc captcha.

Xem hướng dẫn deploy Vercel ở README gốc.
