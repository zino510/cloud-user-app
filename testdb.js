import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres:jQLDDkbNeOLMwPcAKEFKqxgIVqauUuFH@caboose.proxy.rlwy.net:48985/railway",
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to Railway Postgres successfully!");
    const res = await client.query("SELECT NOW()");
    console.log("🕒 Server time:", res.rows[0]);
    client.release();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  } finally {
    pool.end();
  }
})();
