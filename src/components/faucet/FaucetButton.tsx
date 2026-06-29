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
    <div className="faucet">
      <button className="btn btn-ghost" disabled={disabled} onClick={claim}>
        <FiDroplet />
        {isClaiming
          ? "Đang gửi..."
          : claimed
            ? "Đã nhận faucet"
            : `Nhận ${drip} AVAX`}
      </button>

      {status?.blockedReason && !isClaiming && (
        <span className="faucet-hint">{status.blockedReason}</span>
      )}
    </div>
  );
}
