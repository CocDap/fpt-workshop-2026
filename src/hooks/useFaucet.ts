import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";

// Để trống khi deploy chung trên Vercel (same-origin: /api/faucet).
// Local dev đặt VITE_FAUCET_API=http://localhost:8787 trong .env.
const API = import.meta.env.VITE_FAUCET_API ?? "";

type FaucetStatus = {
  faucetBalance: string | null;
  dripAmount: string;
  claimed: boolean;
  canClaim: boolean;
  blockedReason: string | null;
};

export function useFaucet() {
  const { address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [status, setStatus] = useState<FaucetStatus | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const url = address
        ? `${API}/api/faucet?address=${address}`
        : `${API}/api/faucet`;
      const res = await fetch(url);
      if (!res.ok) return;
      setStatus(await res.json());
    } catch {
      setStatus(null);
    }
  }, [address]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const claim = useCallback(async () => {
    if (!address) {
      toast.error("Vui lòng kết nối ví trước");
      return;
    }

    setIsClaiming(true);
    const toastId = toast.loading("Đang gửi faucet...");

    try {
      const res = await fetch(`${API}/api/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Gửi faucet thất bại");
      }

      toast.success(`Đã gửi ${data.amount} AVAX về ví của bạn!`, {
        id: toastId,
      });
      await refreshStatus();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gửi faucet thất bại",
        { id: toastId }
      );
    } finally {
      setIsClaiming(false);
    }
  }, [address, refreshStatus]);

  return { claim, isClaiming, status };
}
