import { CURRENCIES } from "./categories";

const symbolOf = new Map<string, string>(CURRENCIES.map((c) => [c.code, c.symbol]));

export function formatIdr(value: number): string {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  return "Rp " + n.toLocaleString("id-ID");
}

export function formatCompactIdr(value: number): string {
  const n = Math.abs(Math.round(value));
  if (n >= 1_000_000_000) return "Rp " + (value / 1_000_000_000).toFixed(1) + " M";
  if (n >= 1_000_000) return "Rp " + (value / 1_000_000).toFixed(1) + " jt";
  if (n >= 1_000) return "Rp " + Math.round(value / 1_000) + " rb";
  return formatIdr(value);
}

export function formatForeign(value: number, currency: string): string {
  const symbol = symbolOf.get(currency) ?? currency + " ";
  const decimals = Number.isInteger(value) ? 0 : 2;
  return (
    symbol +
    Number(value).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatPct(value: number): string {
  return value.toFixed(1) + "%";
}

export function waLink(text: string, phone?: string | null): string {
  const base = phone
    ? `https://wa.me/${phone.replace(/[^\d]/g, "")}`
    : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
