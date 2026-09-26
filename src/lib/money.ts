export function lineCostIdr(
  unitCostForeign: number,
  qty: number,
  rateToIdr: number,
): number {
  if (!Number.isFinite(unitCostForeign) || !Number.isFinite(qty) || !Number.isFinite(rateToIdr)) {
    throw new Error("Angka tidak valid");
  }
  if (unitCostForeign < 0 || qty < 0 || rateToIdr <= 0) {
    throw new Error("Nilai harus positif");
  }
  return Math.round(unitCostForeign * qty * rateToIdr);
}

export function toIdr(foreignAmount: number, rateToIdr: number): number {
  return lineCostIdr(foreignAmount, 1, rateToIdr);
}

export function margin(revenueIdr: number, costIdr: number): number {
  return revenueIdr - costIdr;
}

export function marginPct(revenueIdr: number, marginIdr: number): number {
  if (revenueIdr <= 0) return 0;
  return (marginIdr / revenueIdr) * 100;
}

export function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

export type TripStats = {
  orders: number;
  revenueIdr: number;
  costIdr: number;
  marginIdr: number;
  marginPct: number;
  outstandingIdr: number;
};

export function tripStats(
  rows: { sellPriceIdr: number; costIdr: number; paid: boolean }[],
): TripStats {
  const revenueIdr = sumBy(rows, (r) => r.sellPriceIdr);
  const costIdr = sumBy(rows, (r) => r.costIdr);
  const marginIdr = margin(revenueIdr, costIdr);
  const outstandingIdr = sumBy(
    rows.filter((r) => !r.paid),
    (r) => r.sellPriceIdr,
  );
  return {
    orders: rows.length,
    revenueIdr,
    costIdr,
    marginIdr,
    marginPct: marginPct(revenueIdr, marginIdr),
    outstandingIdr,
  };
}

export function groupRevenue<T extends { sellPriceIdr: number; costIdr: number }>(
  rows: T[],
  key: (row: T) => string | null,
): { key: string; revenueIdr: number; costIdr: number; marginIdr: number; orders: number }[] {
  const map = new Map<string, { revenueIdr: number; costIdr: number; orders: number }>();
  for (const row of rows) {
    const k = key(row) ?? "Tanpa nama";
    const cur = map.get(k) ?? { revenueIdr: 0, costIdr: 0, orders: 0 };
    cur.revenueIdr += row.sellPriceIdr;
    cur.costIdr += row.costIdr;
    cur.orders += 1;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([k, v]) => ({ key: k, ...v, marginIdr: v.revenueIdr - v.costIdr }))
    .sort((a, b) => b.revenueIdr - a.revenueIdr);
}
