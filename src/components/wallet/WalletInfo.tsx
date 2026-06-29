import { useState } from "react";
import {
  useAccount,
  useChainId,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { FiCopy, FiCheck, FiLogOut } from "react-icons/fi";
import { toast } from "sonner";

import { customChain } from "../../lib/chain";
import { shortenAddress } from "../../lib/format";

export default function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) return null;

  const wrongNetwork = chainId !== customChain.id;

  async function handleCopy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Đã sao chép địa chỉ ví");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Không thể sao chép địa chỉ");
    }
  }

  return (
    <div className="wallet-info">
      <div className="wallet-badge">
        <span className="status-dot" />
        <span className="wallet-address" title={address}>
          {shortenAddress(address)}
        </span>
        <button
          className="icon-btn"
          onClick={handleCopy}
          title="Sao chép địa chỉ"
        >
          {copied ? <FiCheck /> : <FiCopy />}
        </button>
      </div>

      {wrongNetwork && (
        <button
          className="btn btn-warning"
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: customChain.id })}
        >
          {isSwitching ? "Đang chuyển..." : `Chuyển sang ${customChain.name}`}
        </button>
      )}

      <button className="btn btn-ghost" onClick={() => disconnect()}>
        <FiLogOut />
        Ngắt kết nối
      </button>
    </div>
  );
}
