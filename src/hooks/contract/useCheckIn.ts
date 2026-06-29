import { useState } from "react";
import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CONTRACT_ADDRESS } from "../../contracts/address";
import { FPT_ABI } from "../../contracts/abi";
import { parseTxError } from "../../lib/errors";

export function useCheckIn() {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [pendingId, setPendingId] = useState<bigint | null>(null);

  async function checkIn(workshopId: bigint): Promise<boolean> {
    setPendingId(workshopId);
    const toastId = toast.loading("Vui lòng xác nhận giao dịch trong ví...");

    try {
      const hash = await writeContractAsync({
        abi: FPT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "checkIn",
        args: [workshopId],
      });

      toast.loading("Đang chờ blockchain xác nhận...", { id: toastId });

      await waitForTransactionReceipt(config, { hash });

      toast.success("Check-in thành công!", { id: toastId });

      await queryClient.invalidateQueries();

      return true;
    } catch (err) {
      toast.error(parseTxError(err), { id: toastId });
      return false;
    } finally {
      setPendingId(null);
    }
  }

  return { checkIn, pendingId };
}
