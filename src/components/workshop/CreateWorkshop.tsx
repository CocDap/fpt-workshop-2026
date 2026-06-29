import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { FiPlusCircle } from "react-icons/fi";

import { useCreateWorkshop } from "../../hooks/contract/useCreateWorkshop";
import { customChain } from "../../lib/chain";

export default function CreateWorkshop() {
  const [title, setTitle] = useState("");
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { createWorkshop, isSubmitting } = useCreateWorkshop();

  const wrongNetwork = chainId !== customChain.id;
  const disabled =
    isSubmitting || !isConnected || wrongNetwork || !title.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await createWorkshop(title);
    if (ok) setTitle("");
  }

  return (
    <form className="card create-form" onSubmit={handleSubmit}>
      <h2>Tạo Workshop mới</h2>

      <div className="form-row">
        <input
          className="input"
          type="text"
          placeholder="Nhập tiêu đề workshop..."
          value={title}
          maxLength={120}
          disabled={isSubmitting}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button className="btn btn-primary" type="submit" disabled={disabled}>
          <FiPlusCircle />
          {isSubmitting ? "Đang tạo..." : "Tạo"}
        </button>
      </div>

      {!isConnected && (
        <p className="hint">Kết nối ví để tạo workshop.</p>
      )}
      {isConnected && wrongNetwork && (
        <p className="hint hint-warning">
          Vui lòng chuyển sang mạng {customChain.name}.
        </p>
      )}
    </form>
  );
}
