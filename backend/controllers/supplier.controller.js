import * as SupplierModel from "../models/supplier.model.js";

export const createSupplier = async (req, res) => {
  try {
    const { supplier, addresses } = req.body;

    if (!supplier || !addresses || !Array.isArray(addresses)) {
      return res
        .status(400)
        .json({ success: false, message: "Supplier and address are required" });
    }

    const duplicate = await SupplierModel.checkSupplierDuplicate({
      email: supplier.email,
      company_name: supplier.company_name,
      display_company_name: supplier.display_company_name,
      work_phone: supplier.work_phone ?? null,
    });

    if (duplicate.length > 0) {
      const existing = duplicate[0];

      let conflictField = "";

      if (existing.email === supplier.email) conflictField = "Email";
      else if (existing.company_name === supplier.company_name)
        conflictField = "Company Name";
      else if (existing.display_company_name === supplier.display_company_name)
        conflictField = "Display Company Name";

      return res.status(409).json({
        success: false,
        message: `${conflictField} already exists`,
      });
    }

    const supplierId = await SupplierModel.createSupplier(supplier, addresses);

    return res.status(200).json({
      success: true,
      message: "Supplier Created Successfully",
      data: { supplier_id: supplierId },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create supplier",
      error: error.message,
    });
  }
};

export const getAllSupplier = async (req, res) => {
  try {
    const limit = 10;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const filter = req.query.filter || "";

    const results = await SupplierModel.getAllSupplier({
      filter: filter,
      search: search,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      meta: {
        current_page: page,
        per_page: limit,
        total_records: results.total,
        total_pages: Math.ceil(results.total / limit),
      },
      data: results,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get all suppliers",
      error: error.message,
    });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplierId = Number(req.params.id);

    if (!supplierId)
      return res.status(400).json({
        success: false,
        message: "Invalid Supplier ID",
      });

    const supplier = await SupplierModel.getSupplierById(supplierId);

    if (!supplier)
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });

    return res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch the supplier",
      error: error.message,
    });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const updateData = req.body;

    if (!supplierId || !Object.keys(updateData).length) {
      return res.status(400).json({
        success: false,
        message: "Supplier Id and update data are required",
      });
    }

    const affectedRows = await SupplierModel.updateSupplier(
      supplierId,
      updateData
    );

    if (!affectedRows)
      return res.status(404).json({
        success: false,
        message: "Supplier not found or already deleted",
      });

    return res.status(200).json({
      success: false,
      message: "Supplier updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update supplier data",
      error: error.message,
    });
  }
};

export const toggleSoftDeleteSupplier = async (req, res) => {
  try {
    const supplierId = Number(req.params.id);

    if (!supplierId)
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });

    const affectedRows = await SupplierModel.softDeleteSupplier(supplierId);

    if (!affectedRows)
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });

    return res.status(200).json({
      success: true,
      message: "Supplier status updated successfully",
    });
  } catch (error) {
    console.error("Delete Supplier Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete supplier",
      error: error.message,
    });
  }
};

export const hardDeleteSupplier = async (req, res) => {
  try {
    const supplierId = Number(req.params.id);

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const affectedRows = await SupplierModel.hardDeleteSupplier(supplierId);

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found or not soft deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier permanently deleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to hard delete supplier",
      error: error.message,
    });
  }
};
