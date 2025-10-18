import pkg from "pg";
const { Pool } = pkg;
import config from "../config/config";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: config.DATABASE_URL as string,
});

export const db = drizzle(pool);

export const connectDB = async () => {
  try {
    await pool.connect();

    console.log("PostgreSQL connected successfully");
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    process.exit(1);
  }
};
