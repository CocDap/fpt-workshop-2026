# Faucet backend

Phát AVAX testnet, mỗi địa chỉ nhận `DRIP_AMOUNT` (mặc định 0.05). Private key chỉ tồn tại ở backend / biến môi trường, không bao giờ ra frontend.

Logic dùng chung (`faucetCore.js`) chạy được ở 2 môi trường:

- **Local**: Express server (`faucet.js`) + store file `claims.json`.
- **Vercel**: Serverless Function (`/api/faucet.js`) + store Upstash Redis (vì serverless không ghi file được).

## API

Một endpoint, phân biệt theo method:

| Method | Endpoint | Body / Query | Mô tả |
| --- | --- | --- | --- |
| `GET` | `/api/faucet` | `?address=0x...` | Số dư faucet + trạng thái claim |
| `POST` | `/api/faucet` | `{ "address": "0x..." }` | Gửi `DRIP_AMOUNT` AVAX nếu đủ điều kiện |

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
