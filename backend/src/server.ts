import { createApp } from "./app.ts";
import { openDatabase } from "./db.ts";

const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? "./data/finance.db";
const corsOrigin = process.env.CORS_ORIGIN ?? "*";

const db = openDatabase(dbPath);
const app = createApp(db, corsOrigin);

app.listen(port, () => {
  console.log(`API ouvindo em http://localhost:${port}/api (banco: ${dbPath})`);
});
