import { useWorkshopCount } from "../../hooks/contract/useWorkshopCount";
import WorkshopCard from "./WorkshopCard";

export default function WorkshopList() {
  const { data: count, isLoading, isError, error } = useWorkshopCount();

  if (isLoading) {
    return <p className="muted">Đang tải danh sách workshop...</p>;
  }

  if (isError) {
    return (
      <p className="hint hint-warning">
        Không tải được danh sách: {error?.message}
      </p>
    );
  }

  const total = count ? Number(count) : 0;

  if (total === 0) {
    return <p className="muted">Chưa có workshop nào. Hãy tạo workshop đầu tiên!</p>;
  }

  // Workshop ids are 1-indexed; show the newest first.
  const ids = Array.from({ length: total }, (_, i) => BigInt(total - i));

  return (
    <div className="workshop-grid">
      {ids.map((id) => (
        <WorkshopCard key={id.toString()} id={id} />
      ))}
    </div>
  );
}
