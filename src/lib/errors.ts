import { BaseError, UserRejectedRequestError } from "viem";

export function parseTxError(err: unknown): string {
  if (err instanceof BaseError) {
    const rejected = err.walk(
      (e) => e instanceof UserRejectedRequestError
    );
    if (rejected) return "Bạn đã từ chối giao dịch trong ví";

    const message = err.shortMessage || err.message;

    if (message.includes("AlreadyCheckedIn"))
      return "Bạn đã check-in workshop này rồi";
    if (message.includes("WorkshopNotFound"))
      return "Không tìm thấy workshop";
    if (message.includes("EmptyTitle"))
      return "Tiêu đề workshop không được để trống";

    return message;
  }

  if (err instanceof Error) return err.message;

  return "Đã xảy ra lỗi không xác định";
}
