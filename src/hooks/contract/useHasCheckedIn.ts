import { useReadContract } from "wagmi";
import type { Address } from "viem";

import { CONTRACT_ADDRESS } from "../../contracts/address";
import { FPT_ABI } from "../../contracts/abi";

export function useHasCheckedIn(workshopId: bigint, user?: Address) {
  return useReadContract({
    abi: FPT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "hasCheckedIn",
    args: user ? [workshopId, user] : undefined,
    query: {
      enabled: Boolean(user),
    },
  });
}
