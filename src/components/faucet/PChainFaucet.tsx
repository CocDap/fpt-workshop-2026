import { useEffect, useRef, useState } from "react";
import { FiDroplet, FiChevronDown } from "react-icons/fi";

import { useFaucetClient } from "../../hooks/useFaucetClient";

const isPChainAddress = (a: string) => /^P-[a-z]+1[0-9a-z]+$/.test(a.trim());

export default function PChainFaucet() {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { claim, isClaiming, status, refreshStatus } =
    useFaucetClient("/api/faucet/pchain");

  const trimmed = address.trim();
  const valid = isPChainAddress(trimmed);

  // Cập nhật trạng thái (đã nhận chưa) khi địa chỉ hợp lệ.
  useEffect(() => {
    if (valid) refreshStatus(trimmed);
  }, [valid, trimmed, refreshStatus]);

  // Đóng popover khi click ra ngoài hoặc nhấn Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drip = status?.dripAmount ?? "0.001";
  const claimed = valid && (status?.claimed ?? false);
  const disabled = !valid || isClaiming || claimed;

  return (
    <div className="faucet-pop" ref={ref}>
      <button
        className="btn btn-ghost"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <FiDroplet />
        Faucet P-Chain
        <FiChevronDown />
      </button>

      {open && (
        <div className="faucet-pop-panel">
          <div className="faucet-pop-title">
            Faucet P-Chain
            {status?.faucetBalance != null && (
              <span className="muted"> · còn {status.faucetBalance} AVAX</span>
            )}
          </div>

          <input
            className="input"
            placeholder="Địa chỉ P-Chain (P-fuji1...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoFocus
          />

          <button
            className="btn btn-primary"
            disabled={disabled}
            onClick={() => claim(trimmed)}
          >
            <FiDroplet />
            {isClaiming
              ? "Đang gửi..."
              : claimed
                ? "Đã nhận"
                : `Nhận ${drip} AVAX`}
          </button>

          {address && !valid && (
            <span className="faucet-hint">Địa chỉ phải có dạng P-fuji1...</span>
          )}
          {claimed && status?.blockedReason && (
            <span className="faucet-hint">{status.blockedReason}</span>
          )}
        </div>
      )}
    </div>
  );
}
