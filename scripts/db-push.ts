import { migrate } from "../src/lib/db/migrate";

await migrate();
console.log("Skema database siap.");
