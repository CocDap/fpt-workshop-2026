import { useReadContract } from "wagmi";

import { CONTRACT_ADDRESS } from "../../contracts/address";
import { FPT_ABI } from "../../contracts/abi";

export function useCheckInCount(
    id: bigint
) {
    return useReadContract({
        abi: FPT_ABI,

        address: CONTRACT_ADDRESS,

        functionName:
            "getCheckInCount",

        args: [id],
    });
}
