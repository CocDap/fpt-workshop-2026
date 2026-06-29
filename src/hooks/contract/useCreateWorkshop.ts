import { useState } from "react";
import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CONTRACT_ADDRESS } from "../../contracts/address";
import { FPT_ABI } from "../../contracts/abi";
import { parseTxError } from "../../lib/errors";

export function useCreateWorkshop() {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createWorkshop(title: string): Promise<boolean> {
    const trimmed = title.trim();

    if (!trimmed) {
      toast.error("Tiêu đề workshop không được để trống");
      return false;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Vui lòng xác nhận giao dịch trong ví...");

    try {
      const hash = await writeContractAsync({
        abi: FPT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "createWorkshop",
        args: [trimmed],
      });

      toast.loading("Đang chờ blockchain xác nhận...", { id: toastId });

      await waitForTransactionReceipt(config, { hash });

      toast.success("Tạo workshop thành công!", { id: toastId });

      await queryClient.invalidateQueries();

      return true;
    } catch (err) {
      toast.error(parseTxError(err), { id: toastId });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { createWorkshop, isSubmitting };
}
