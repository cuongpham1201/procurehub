import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "../database/migrations/010_supplier_email_verification.sql"), "utf8");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(sql);
  console.log("✓ Migration 010 applied successfully (supplier email_verified, verification_token, must_change_password)");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
