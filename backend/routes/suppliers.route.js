import express from "express";
import {
  createSupplier,
  getAllSupplier,
  getSupplierById,
  hardDeleteSupplier,
  toggleSoftDeleteSupplier,
  updateSupplier,
} from "../controllers/supplier.controller.js";

const router = express.Router();

router.post("/", createSupplier);
router.get("/", getAllSupplier);
router.get("/:id", getSupplierById);
router.put("/:id", updateSupplier);
router.patch("/:id", toggleSoftDeleteSupplier);
router.delete("/:id", hardDeleteSupplier);

export default router;
