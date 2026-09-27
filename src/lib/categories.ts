export const CURRENCIES = [
  { code: "JPY", symbol: "¥", label: "Yen Jepang" },
  { code: "KRW", symbol: "₩", label: "Won Korea" },
  { code: "SGD", symbol: "S$", label: "Dolar Singapura" },
  { code: "THB", symbol: "฿", label: "Baht Thailand" },
  { code: "HKD", symbol: "HK$", label: "Dolar Hong Kong" },
  { code: "TWD", symbol: "NT$", label: "Dolar Taiwan" },
  { code: "MYR", symbol: "RM", label: "Ringgit Malaysia" },
  { code: "USD", symbol: "$", label: "Dolar AS" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "AUD", symbol: "A$", label: "Dolar Australia" },
  { code: "CNY", symbol: "¥", label: "Yuan Tiongkok" },
  { code: "GBP", symbol: "£", label: "Poundsterling" },
  { code: "IDR", symbol: "Rp", label: "Rupiah" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const CATEGORIES = [
  "Skincare",
  "Kosmetik",
  "Parfum",
  "Obat & Vitamin",
  "Snack",
  "Makanan",
  "Rokok",
  "Pakaian",
  "Tas",
  "Sepatu",
  "Elektronik",
  "Aksesoris",
  "Bayi",
  "Lainnya",
] as const;
