import { useAccount, useChainId } from "wagmi";
import { FiUser, FiClock, FiCheckCircle, FiUsers } from "react-icons/fi";

import { useWorkshop } from "../../hooks/contract/useWorkshop";
import { useHasCheckedIn } from "../../hooks/contract/useHasCheckedIn";
import { useCheckIn } from "../../hooks/contract/useCheckIn";
import { customChain } from "../../lib/chain";
import { shortenAddress, formatTimestamp } from "../../lib/format";

export default function WorkshopCard({ id }: { id: bigint }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { data: workshop, isLoading } = useWorkshop(id);
  const { data: alreadyCheckedIn } = useHasCheckedIn(id, address);
  const { checkIn, pendingId } = useCheckIn();

  if (isLoading) {
    return <div className="card workshop-card skeleton">Đang tải...</div>;
  }

  if (!workshop || !workshop.exists) return null;

  const wrongNetwork = chainId !== customChain.id;
  const isSubmitting = pendingId === id;
  const hasCheckedIn = Boolean(alreadyCheckedIn);

  const disabled =
    !isConnected || wrongNetwork || hasCheckedIn || isSubmitting;

  return (
    <div className="card workshop-card">
      <div className="workshop-head">
        <span className="workshop-id">#{workshop.id.toString()}</span>
        <span className="count-badge">
          <FiUsers />
          {workshop.totalCheckIn.toString()}
        </span>
      </div>

      <h3 className="workshop-title">{workshop.title}</h3>

      <div className="workshop-meta">
        <span title={workshop.creator}>
          <FiUser />
          {shortenAddress(workshop.creator)}
        </span>
        <span>
          <FiClock />
          {formatTimestamp(workshop.createdAt)}
        </span>
      </div>

      {hasCheckedIn ? (
        <button className="btn btn-success" disabled>
          <FiCheckCircle />
          Đã check-in
        </button>
      ) : (
        <button
          className="btn btn-primary"
          disabled={disabled}
          onClick={() => checkIn(id)}
        >
          {isSubmitting ? "Đang check-in..." : "Check-in"}
        </button>
      )}

      {!isConnected && <p className="hint">Kết nối ví để check-in.</p>}
    </div>
  );
}
