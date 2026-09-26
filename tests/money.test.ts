import { test, expect } from "bun:test";
import {
  lineCostIdr,
  margin,
  marginPct,
  tripStats,
  groupRevenue,
} from "@/lib/money";

test("lineCostIdr converts and rounds to whole rupiah", () => {
  expect(lineCostIdr(1000, 1, 110.5)).toBe(110500);
  expect(lineCostIdr(3, 2, 4500)).toBe(27000);
  expect(lineCostIdr(0.1, 1, 12345)).toBe(1235);
});

test("lineCostIdr rejects bad input", () => {
  expect(() => lineCostIdr(-1, 1, 100)).toThrow();
  expect(() => lineCostIdr(1, 1, 0)).toThrow();
  expect(() => lineCostIdr(Number.NaN, 1, 100)).toThrow();
});

test("margin and marginPct", () => {
  expect(margin(200000, 150000)).toBe(50000);
  expect(marginPct(200000, 50000)).toBe(25);
  expect(marginPct(0, 0)).toBe(0);
});

test("tripStats aggregates revenue, cost, margin and outstanding", () => {
  const stats = tripStats([
    { sellPriceIdr: 200000, costIdr: 150000, paid: true },
    { sellPriceIdr: 100000, costIdr: 80000, paid: false },
  ]);
  expect(stats.orders).toBe(2);
  expect(stats.revenueIdr).toBe(300000);
  expect(stats.costIdr).toBe(230000);
  expect(stats.marginIdr).toBe(70000);
  expect(stats.outstandingIdr).toBe(100000);
  expect(stats.marginPct).toBeCloseTo(23.333, 2);
});

test("groupRevenue ranks by revenue desc", () => {
  const rows = [
    { sellPriceIdr: 100000, costIdr: 50000, category: "Snack" },
    { sellPriceIdr: 300000, costIdr: 200000, category: "Skincare" },
    { sellPriceIdr: 50000, costIdr: 40000, category: "Snack" },
  ];
  const grouped = groupRevenue(rows, (r) => r.category);
  expect(grouped[0].key).toBe("Skincare");
  expect(grouped[0].marginIdr).toBe(100000);
  expect(grouped[1].key).toBe("Snack");
  expect(grouped[1].revenueIdr).toBe(150000);
});
