import { useAccount, useConnect } from "wagmi";
import { FiLogIn } from "react-icons/fi";

export default function ConnectWallet() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  if (isConnected) return null;

  const connector = connectors[0];

  return (
    <button
      className="btn btn-primary"
      disabled={isPending || !connector}
      onClick={() => connector && connect({ connector })}
    >
      <FiLogIn />
      {isPending ? "Đang kết nối..." : "Kết nối ví"}
    </button>
  );
}
