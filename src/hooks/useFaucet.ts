import { useCallback, useEffect } from "react";
import { useAccount } from "wagmi";

import { useFaucetClient } from "./useFaucetClient";

/** Faucet C-Chain: lấy địa chỉ 0x từ ví đã kết nối (wagmi). */
export function useFaucet() {
  const { address } = useAccount();
  const { claim, isClaiming, status, refreshStatus } =
    useFaucetClient("/api/faucet");

  useEffect(() => {
    refreshStatus(address);
  }, [address, refreshStatus]);

  const claimForWallet = useCallback(() => claim(address), [claim, address]);

  return { claim: claimForWallet, isClaiming, status };
}
