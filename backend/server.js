import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import supplierRoute from "./routes/suppliers.route.js";
import { initDatabase } from "./config/initSchema.js";

const app = express();

app.use(express.json());
app.use(cors());

const startServer = async () => {
  try {
    await initDatabase();

    app.use("/api/suppliers", supplierRoute);

    app.get("/", (req, res) => res.json({ message: "Api running" }));

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
