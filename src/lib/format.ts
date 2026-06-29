export function shortenAddress(address?: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(seconds?: bigint): string {
  if (!seconds) return "-";
  return new Date(Number(seconds) * 1000).toLocaleString();
}
