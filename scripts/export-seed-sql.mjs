import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DB_PATH = process.env.LOCAL_DB_PATH || path.resolve(process.cwd(), "data/kiray.sqlite");
const OUTPUT_PATH = path.resolve(process.cwd(), "data/seed.sql");

function escapeSqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function exportSeed() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`[export-seed] Database file not found: ${DB_PATH}. Run 'npm run setup' first.`);
    process.exit(1);
  }

  const db = new DatabaseSync(DB_PATH);
  const tables = [
    "users",
    "listings",
    "listing_photos",
    "providers",
    "provider_reviews",
    "reviews",
    "bookings",
    "conversations",
    "messages",
    "notifications",
  ];

  let sqlStatements = [];
  sqlStatements.push("-- Kiray Seed Data for Cloudflare D1");
  sqlStatements.push("-- Generated automatically from local seed");
  sqlStatements.push("");

  for (const table of tables) {
    const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
    if (!tableExists) continue;

    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) continue;

    sqlStatements.push(`-- Table: ${table} (${rows.length} rows)`);
    for (const row of rows) {
      const columns = Object.keys(row);
      const values = Object.values(row).map(escapeSqlValue);
      sqlStatements.push(
        `INSERT OR IGNORE INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`
      );
    }
    sqlStatements.push("");
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, sqlStatements.join("\n"), "utf8");
  console.log(`[export-seed] Generated SQL seed file at: ${OUTPUT_PATH} (${sqlStatements.length} lines)`);
}

exportSeed();
