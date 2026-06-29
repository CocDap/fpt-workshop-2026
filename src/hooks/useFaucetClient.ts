import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Để trống khi deploy chung trên Vercel (same-origin: /api/...).
// Local dev đặt VITE_FAUCET_API=http://localhost:8787 trong .env.
const API = import.meta.env.VITE_FAUCET_API ?? "";

export type FaucetStatus = {
  faucetBalance: string | null;
  dripAmount: string;
  claimed: boolean;
  canClaim: boolean;
  blockedReason: string | null;
};

/**
 * Logic faucet dùng chung cho cả C-Chain và P-Chain.
 * `path` = "/api/faucet" (C-Chain) hoặc "/api/faucet/pchain" (P-Chain).
 * `unit` = nhãn token hiển thị trên toast ("AVAX").
 */
export function useFaucetClient(path: string, unit = "AVAX") {
  const [isClaiming, setIsClaiming] = useState(false);
  const [status, setStatus] = useState<FaucetStatus | null>(null);

  const refreshStatus = useCallback(
    async (address?: string) => {
      try {
        const url = address
          ? `${API}${path}?address=${encodeURIComponent(address)}`
          : `${API}${path}`;
        const res = await fetch(url);
        if (!res.ok) return;
        setStatus(await res.json());
      } catch {
        setStatus(null);
      }
    },
    [path]
  );

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const claim = useCallback(
    async (address: string | undefined) => {
      if (!address) {
        toast.error("Vui lòng nhập / kết nối địa chỉ trước");
        return;
      }

      setIsClaiming(true);
      const toastId = toast.loading("Đang gửi faucet...");

      try {
        const res = await fetch(`${API}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error ?? "Gửi faucet thất bại");
        }

        toast.success(`Đã gửi ${data.amount} ${unit} về ví của bạn!`, {
          id: toastId,
        });
        await refreshStatus(address);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gửi faucet thất bại", {
          id: toastId,
        });
      } finally {
        setIsClaiming(false);
      }
    },
    [path, unit, refreshStatus]
  );

  return { claim, isClaiming, status, refreshStatus };
}
