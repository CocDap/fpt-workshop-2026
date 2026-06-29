import { useAccount } from "wagmi";
import { FiDroplet } from "react-icons/fi";

import { useFaucet } from "../../hooks/useFaucet";

export default function FaucetButton() {
  const { isConnected } = useAccount();
  const { claim, isClaiming, status } = useFaucet();

  const drip = status?.dripAmount ?? "0.05";
  const claimed = status?.claimed ?? false;
  const disabled = !isConnected || isClaiming || claimed;

  return (
    <button
      className="btn btn-ghost"
      disabled={disabled}
      onClick={claim}
      title={`Nhận ${drip} AVAX vào ví C-Chain đang kết nối`}
    >
      <FiDroplet />
      {isClaiming
        ? "Đang gửi..."
        : claimed
          ? "Đã nhận (C-Chain)"
          : "Faucet C-Chain"}
    </button>
  );
}
