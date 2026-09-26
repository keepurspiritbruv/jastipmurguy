import { migrate } from "../src/lib/db/migrate";
import * as q from "../src/lib/queries";
import { lineCostIdr } from "../src/lib/money";

await migrate();

const existing = await q.listTrips();
if (existing.length > 0) {
  console.log("Sudah ada trip — seed dilewati agar data asli tidak tertimpa.");
  process.exit(0);
}

const trip = await q.createTrip({
  name: "Jepang Nov 2026",
  country: "Jepang",
  baseCurrency: "JPY",
  rateUsed: 108,
  rateSource: "manual",
  startDate: "2026-11-03",
  endDate: "2026-11-10",
});

const customers = [
  { name: "Bu Sri", phone: "6281200000001" },
  { name: "Kak Dinda", phone: "6281200000002" },
  { name: "Mas Bagas", phone: "6281200000003" },
];

const ids: Record<string, number> = {};
for (const c of customers) {
  ids[c.name] = (await q.findOrCreateCustomer(c.name, c.phone))!;
}

const items = [
  { name: "Anessa Perfect UV 60ml", category: "Skincare", qty: 2, price: 2980, sell: 420000, who: "Bu Sri", paid: true },
  { name: "Melano CC Vitamin C", category: "Skincare", qty: 3, price: 1200, sell: 165000, who: "Kak Dinda", paid: false },
  { name: "Meiji Black Chocolate", category: "Snack", qty: 10, price: 320, sell: 55000, who: "Mas Bagas", paid: true },
  { name: "Rohto V Rohto", category: "Obat & Vitamin", qty: 5, price: 480, sell: 75000, who: "Bu Sri", paid: false },
  { name: "Porter Sling Pouch", category: "Tas", qty: 1, price: 12000, sell: 1_650_000, who: "Kak Dinda", paid: false },
];

for (const item of items) {
  await q.createOrder({
    tripId: trip.id,
    customerId: ids[item.who],
    itemName: item.name,
    category: item.category,
    qty: item.qty,
    foreignCurrency: "JPY",
    unitCostForeign: item.price,
    rateUsed: 108,
    costIdr: lineCostIdr(item.price, item.qty, 108),
    sellPriceIdr: item.sell,
    paid: item.paid,
  });
}

console.log(`Seed selesai: trip "${trip.name}" dengan ${items.length} pesanan.`);
