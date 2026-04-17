export function formatPrice(tenths: number): string {
  return `£${(tenths / 10).toFixed(1)}m`;
}

export function formatPoints(pts: number): string {
  return pts.toLocaleString();
}

export function formatRank(rank: number): string {
  if (rank === 0) return "—";
  if (rank >= 1_000_000) return `${(rank / 1_000_000).toFixed(1)}m`;
  if (rank >= 1_000) return `${(rank / 1_000).toFixed(0)}k`;
  return rank.toLocaleString();
}

export function formatPercent(str: string): string {
  const n = parseFloat(str);
  if (isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export function formatDiff(val: number): string {
  if (val > 0) return `+${val.toFixed(1)}`;
  return val.toFixed(1);
}
