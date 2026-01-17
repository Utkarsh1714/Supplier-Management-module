import db from "../config/db.js";
import INIT_DB_SCHEMA from "../utils/query.js";

export const initDatabase = async () => {
  try {
    await db.query(INIT_DB_SCHEMA);
    console.log("✅ Database schema initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    throw error;
  }
};
