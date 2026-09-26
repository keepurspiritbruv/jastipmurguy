import { migrate } from "../src/lib/db/migrate";

await migrate();
console.log("Skema database siap.");
process.exit(0);
