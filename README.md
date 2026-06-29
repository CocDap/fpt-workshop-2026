# Uni Tour #7 FPTU — FPT Workshop DApp

> Hosted by **Team1 VietNam** & **FPT Education Danang**

Fullstack DApp check-in workshop on-chain: ai cũng có thể tạo workshop, người tham gia check-in, và mọi người xem được số lượng / trạng thái check-in theo thời gian thực.

---

## Tính năng

- **Tạo workshop** — bất kỳ ví nào cũng có thể tạo workshop mới (chỉ cần tiêu đề).
- **Check-in** — người tham gia check-in vào một workshop bằng giao dịch on-chain.
- **Đếm số lượt check-in** — hiển thị tổng số người đã check-in của từng workshop.
- **Kiểm tra trạng thái check-in** — biết ví hiện tại đã check-in hay chưa.
- **Ví (Wagmi)** — Connect, hiển thị địa chỉ rút gọn, Copy Address, Disconnect, phát hiện & chuyển sai mạng.
- **Thông báo giao dịch** — toast theo dõi vòng đời: xác nhận trong ví → chờ blockchain → thành công/thất bại.
- **Custom RPC** — cấu hình mạng & RPC tùy chỉnh qua Viem `defineChain`.
- **Auto reload** — tự động refetch dữ liệu READ (số check-in, trạng thái) sau mỗi giao dịch.

---

## Tech stack

| Lớp | Công nghệ |
| --- | --- |
| Frontend | React 19 + Vite |
| Web3 | Wagmi v3, Viem v2 |
| Data/cache | TanStack React Query |
| Thông báo | Sonner (toast) |
| Icon | react-icons |
| Smart contract | Solidity (`FPT`) |

---

## Smart contract `FPT`

ABI được lưu tại [`src/contracts/abi.ts`](src/contracts/abi.ts), địa chỉ tại [`src/contracts/address.ts`](src/contracts/address.ts).

**Functions**

| Hàm | Kiểu | Mô tả |
| --- | --- | --- |
| `createWorkshop(string title)` | write | Tạo workshop mới |
| `checkIn(uint256 workshopId)` | write | Check-in vào workshop |
| `getWorkshop(uint256 workshopId)` | view | Lấy thông tin workshop (`id, title, creator, createdAt, totalCheckIn, exists`) |
| `getCheckInCount(uint256 workshopId)` | view | Số lượt check-in |
| `hasCheckedIn(uint256 workshopId, address user)` | view | Trạng thái check-in của một ví |
| `workshopCount()` | view | Tổng số workshop |

**Events:** `WorkshopCreated`, `CheckedIn`
**Custom errors:** `EmptyTitle`, `WorkshopNotFound`, `AlreadyCheckedIn`

---

## Cấu trúc dự án

```
src/
├─ contracts/
│  ├─ abi.ts                 # ABI của contract FPT
│  └─ address.ts             # Địa chỉ contract đã deploy
├─ lib/
│  ├─ chain.ts               # Định nghĩa chain + Custom RPC (Viem defineChain)
│  ├─ wagmi.ts               # Cấu hình Wagmi (connectors, transports)
│  ├─ errors.ts              # Chuẩn hóa lỗi giao dịch sang tiếng Việt
│  └─ format.ts              # shortenAddress, formatTimestamp
├─ hooks/contract/
│  ├─ useWorkshopCount.ts    # read: workshopCount
│  ├─ useWorkshop.ts         # read: getWorkshop
│  ├─ useCheckInCount.ts     # read: getCheckInCount
│  ├─ useHasCheckedIn.ts     # read: hasCheckedIn
│  ├─ useCreateWorkshop.ts   # write: createWorkshop (+ toast + refetch)
│  └─ useCheckIn.ts          # write: checkIn (+ toast + refetch)
├─ components/
│  ├─ wallet/
│  │  ├─ ConnectWallet.tsx
│  │  └─ WalletInfo.tsx      # địa chỉ rút gọn, copy, switch chain, disconnect
│  └─ workshop/
│     ├─ CreateWorkshop.tsx
│     ├─ WorkshopList.tsx
│     └─ WorkshopCard.tsx    # thông tin + count + nút check-in
├─ App.tsx
└─ main.tsx                  # Providers (Wagmi, ReactQuery) + Toaster
```

---

## Bắt đầu

Yêu cầu: Node.js 18+ và một ví hỗ trợ EIP-1193 (ví dụ MetaMask).

```bash
# Cài đặt
npm install

# Chạy môi trường dev
npm run dev

# Build production
npm run build

# Xem thử bản build
npm run preview
```

---

## Cấu hình

### Custom RPC / Chain

Mạng được định nghĩa trong [`src/lib/chain.ts`](src/lib/chain.ts) bằng `defineChain` của Viem. Mặc định đang dùng **Avalanche Fuji Testnet**:

```ts
export const customChain = defineChain({
  id: 43113,
  name: "Avax Testnet",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] },
    public: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://testnet.avascan.info" },
  },
});
```

Đổi `id`, `rpcUrls` để trỏ tới RPC tùy chỉnh / mạng khác. Wagmi đọc chain này trong [`src/lib/wagmi.ts`](src/lib/wagmi.ts).

### Địa chỉ contract

Cập nhật địa chỉ contract sau khi deploy tại [`src/contracts/address.ts`](src/contracts/address.ts):

```ts
export const CONTRACT_ADDRESS = "0x...";
```

---

## Luồng giao dịch & auto-refetch

Mỗi hook write (`useCreateWorkshop`, `useCheckIn`) thực hiện:

1. `writeContractAsync(...)` — gửi giao dịch, người dùng ký trong ví.
2. `waitForTransactionReceipt(...)` — chờ blockchain xác nhận.
3. `queryClient.invalidateQueries()` — tự động refetch dữ liệu READ (số check-in, trạng thái, danh sách).

Toast (Sonner) bám theo trọn vòng đời và hiển thị lỗi đã chuẩn hóa (user từ chối ký, `AlreadyCheckedIn`, `WorkshopNotFound`, `EmptyTitle`...).

---

## Faucet AVAX (testing)

Backend nhỏ tại [`server/faucet.js`](server/faucet.js) giữ private key ví faucet và phát **0.05 AVAX / địa chỉ**. Private key chỉ nằm ở backend, không bao giờ ra frontend.

```bash
# tạo .env (xem server/README.md), rồi chạy:
npm run faucet
```

- Số tiền cố định ở server, mỗi địa chỉ chỉ nhận 1 lần (lưu local ở `server/claims.json`), có thể bật cooldown qua `CLAIM_COOLDOWN_MS`.
- Frontend gọi qua `FaucetButton`. Local dev được Vite proxy `/api` sang `:8787`.
- Chi tiết: [`server/README.md`](server/README.md).

---

## Deploy lên Vercel

Vercel là **serverless** nên không chạy được Express thường trú và **không ghi file được** (`claims.json` sẽ mất). Vì vậy faucet được đóng gói thành Serverless Function + dùng KV/Redis để lưu trạng thái.

### Cấu trúc tương thích Vercel

```
api/faucet.js          # Serverless Function (Vercel tự nhận diện thư mục /api)
server/faucetCore.js   # Logic dùng chung
server/stores.js       # fileStore (local) | redisStore (Vercel)
src/                   # Frontend Vite -> build ra dist/ (static)
```

Frontend gọi `/api/faucet` **same-origin**, nên không cần `VITE_FAUCET_API` khi deploy.

### Các bước

1. **Tạo KV store**: trong Vercel → *Storage* → tạo **Upstash Redis** (hoặc Marketplace KV). Nó tự thêm 2 biến `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` vào project.
2. **Import repo** vào Vercel. Framework preset: **Vite** (Build: `npm run build`, Output: `dist`). Thư mục `api/` tự thành Serverless Functions.
3. **Khai báo Environment Variables** (Settings → Environment Variables):

   | Biến | Ví dụ | Ghi chú |
   | --- | --- | --- |
   | `FAUCET_PRIVATE_KEY` | `0x...` | **Bí mật** — chỉ ở server, không phải `VITE_*` |
   | `RPC_URL` | `https://api.avax-test.network/ext/bc/C/rpc` | RPC tùy chỉnh |
   | `DRIP_AMOUNT` | `0.05` | |
   | `CLAIM_COOLDOWN_MS` | `0` | 0 = 1 lần/địa chỉ |
   | `KV_REST_API_URL` | *(tự thêm)* | tích hợp Upstash/Vercel tự cấp |
   | `KV_REST_API_TOKEN` | *(tự thêm)* | tích hợp Upstash/Vercel tự cấp |

   > Tích hợp Upstash trên Vercel cấp biến tên `KV_REST_API_URL` / `KV_REST_API_TOKEN` (không phải `UPSTASH_*`). Code đã đọc cả hai kiểu tên (ưu tiên `KV_*`, fallback `UPSTASH_*`). Các biến `KV_URL` / `REDIS_URL` là dạng kết nối TCP — không cần cho client REST này.

   > ⚠️ Tuyệt đối **không** đặt private key dưới tên `VITE_...` — mọi biến `VITE_*` bị nhúng vào bundle frontend và ai cũng đọc được.

4. **Deploy**. Xong thì faucet ở `https://<app>.vercel.app/api/faucet`, frontend ở `https://<app>.vercel.app`.

### Lưu ý

- `claims.json` (file store) **chỉ dùng local**; trên Vercel bắt buộc dùng Redis vì filesystem ephemeral và mỗi invocation là một tiến trình riêng. `store.reserve` dùng `SET NX` atomic của Redis để chặn double-claim khi có nhiều request đồng thời.
- Nếu muốn giữ Express (vd deploy faucet riêng trên Railway/Render), chỉ cần trỏ `VITE_FAUCET_API` của frontend sang URL backend đó và set `CORS_ORIGIN` = domain Vercel.

---

## Roadmap triển khai

- **Bước 1** — Viết Smart Contract `FPT.sol` với đầy đủ event, custom error và test.
- **Bước 2** — Deploy lên mạng EVM (Custom RPC hoặc testnet), export ABI và địa chỉ contract.
- **Bước 3** — Khởi tạo dự án React + Vite, cấu hình Wagmi, Viem và Custom RPC.
- **Bước 4** — Xây dựng các hook `useReadContract` và `useWriteContract`.
- **Bước 5** — Phát triển giao diện (Connect Wallet, Create Workshop, Workshop List, Check-in).
- **Bước 6** — Thêm toast thông báo, chờ `waitForTransactionReceipt`, tự động refetch dữ liệu sau giao dịch.
- **Bước 7** — Tối ưu UX (loading state, disable nút khi đang gửi transaction hoặc đã check-in, hiển thị trạng thái ví, copy địa chỉ, xử lý lỗi).

### Hướng mở rộng

Phân trang workshop, tìm kiếm, lịch sử sự kiện (event log), hoặc tích hợp backend/indexer.

---

## Tham khảo

- Thiết kế & roadmap: [ChatGPT — DApp Fullstack FPT](https://chatgpt.com/share/6a423682-5f40-83ec-8679-919192cc769d)
