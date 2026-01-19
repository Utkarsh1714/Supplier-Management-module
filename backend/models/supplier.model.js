import db from "../config/db.js";
import { buildSupplierFilterClause, parseFilters } from "../utils/helperFunc.js";

const getSupplierCount = async (search, filter) => {
  try {
    const filters = parseFilters(filter);
    let whereClause = buildSupplierFilterClause(filters);

    const params = [];

    if (search) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += `
        (
          s.company_name LIKE ?
          OR s.display_company_name LIKE ?
          OR s.email LIKE ?
          OR s.work_phone LIKE ?
          OR s.mobile_phone LIKE ?
          OR s.first_name LIKE ?
          OR s.last_name LIKE ?
        )
      `;
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword);
    }

    const [[row]] = await db.execute(
      `SELECT COUNT(DISTINCT s.supplier_id) AS total FROM suppliers s ${whereClause}`,
      params
    );

    return row.total;
  } catch (error) {
    throw new Error(`Fetch Supplier Count Failed: ${error.message}`);
  }
};


export const checkSupplierDuplicate = async ({
  email = null,
  work_phone = null,
  company_name = null,
  display_company_name = null,
}) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT supplier_id, email, work_phone, company_name, display_company_name
      FROM suppliers
      WHERE (? IS NOT NULL AND email = ?)
         OR (? IS NOT NULL AND work_phone = ?)
         OR (? IS NOT NULL AND company_name = ?)
         OR (? IS NOT NULL AND display_company_name = ?)
      `,
      [
        email,
        email,
        work_phone,
        work_phone,
        company_name,
        company_name,
        display_company_name,
        display_company_name,
      ]
    );

    return rows;
  } catch (error) {
    throw new Error(`Duplicate check failed: ${error.message}`);
  }
};

// Create supplier
export const createSupplier = async (supplier, addresses = []) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [supplierResult] = await connection.execute(
      `
  INSERT INTO suppliers (
    salutation,
    first_name,
    last_name,
    company_name,
    display_company_name,
    email,
    work_phone_country_code,
    work_phone,
    mobile_phone_country_code,
    mobile_phone,
    gst,
    pan,
    is_msme_registered,
    tds_tax_code,
    currency,
    payment_terms,
    shipping_address_ids,
    billing_address_ids,
    is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
      [
        supplier.salutation,
        supplier.first_name,
        supplier.last_name,
        supplier.company_name,
        supplier.display_company_name,
        supplier.email,
        supplier.work_phone_country_code || null,
        supplier.work_phone || null,
        supplier.mobile_phone_country_code || null,
        supplier.mobile_phone || null,
        supplier.gst || null,
        supplier.pan || null,
        supplier.is_msme_registered ?? false,
        supplier.tds_tax_code || null,
        supplier.currency || "INR",
        supplier.payment_terms || null,
        supplier.shipping_address_ids || null,
        supplier.billing_address_ids || null,
        supplier.is_active ?? true,
      ]
    );

    const supplierId = supplierResult.insertId;

    if (addresses.length > 0) {
      for (const address of addresses) {
        const [addressResult] = await connection.execute(
          `
                    INSERT INTO supplier_address (
                        supplier_id,
                        type,
                        address_type,
                        address_line1,
                        address_line2,
                        city,
                        state,
                        postal_code,
                        country,
                        phone_dial_code,
                        phone_number,
                        is_primary
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
          [
            supplierId,
            address.type,
            address.address_type,
            address.address_line1,
            address.address_line2 || null,
            address.city,
            address.state,
            address.postal_code,
            address.country,
            address.phone_dial_code || null,
            address.phone_number || null,
            address.is_primary ?? false,
          ]
        );

        const addressId = addressResult.insertId;
        const jsonColumn = address.type === 'billing' ? 'billing_address_ids' : 'shipping_address_ids';

        await connection.execute(
          `
          UPDATE suppliers
          SET ${jsonColumn} = 
            JSON_ARRAY_APPEND(
              COALESCE(${jsonColumn}, JSON_ARRAY()),
              '$',
              ?
            )
          WHERE supplier_id = ?
          `,
          [addressId, supplierId]
        );
      }
    }

    await connection.commit();
    return supplierId;
  } catch (error) {
    await connection.rollback();
    throw new Error(`Create supplier failed: ${error.message}`);
  } finally {
    connection.release();
  }
};

// Get all supplier
export const getAllSupplier = async ({ filter, search, limit, offset }) => {
  try {
    const total = await getSupplierCount(search, filter);
    const filters = parseFilters(filter);
    let whereClause = buildSupplierFilterClause(filters);

    const params = [];

    if (search) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += `
        (
          s.company_name LIKE ?
          OR s.display_company_name LIKE ?
          OR s.email LIKE ?
          OR s.work_phone LIKE ?
          OR s.mobile_phone LIKE ?
          OR s.first_name LIKE ?
          OR s.last_name LIKE ?
        )
      `;
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword);
    }

    limit = Number(limit);
    offset = Number(offset);

    const [rows] = await db.execute(
      `
      SELECT
        s.supplier_id,
        s.salutation,
        s.first_name,
        s.last_name,
        s.company_name,
        s.display_company_name,
        s.email,
        s.work_phone_country_code,
        s.work_phone,
        s.mobile_phone_country_code,
        s.mobile_phone,
        s.gst,
        s.pan,
        s.is_msme_registered,
        s.tds_tax_code,
        s.currency,
        s.billing_address_ids,
        s.shipping_address_ids,
        s.payment_terms,
        s.created_at,
        s.updated_at,
        s.deleted_at,
        s.is_active,

        a.address_id,
        a.supplier_id,
        a.type,
        a.address_type,
        a.address_line1,
        a.address_line2,
        a.city,
        a.state,
        a.postal_code,
        a.country,
        a.phone_dial_code,
        a.phone_number,
        a.is_primary
      FROM suppliers s
      LEFT JOIN supplier_address a
        ON s.supplier_id = a.supplier_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      params
    );

    const suppliersMap = new Map();

    for (const row of rows) {
      if (!suppliersMap.has(row.supplier_id)) {
        suppliersMap.set(row.supplier_id, {
          supplier_id: row.supplier_id,
          salutation: row.salutation,
          first_name: row.first_name,
          last_name: row.last_name,
          company_name: row.company_name,
          display_company_name: row.display_company_name,
          email: row.email,
          work_phone_country_code: row.work_phone_country_code,
          work_phone: row.work_phone,
          mobile_phone_country_code: row.mobile_phone_country_code,
          mobile_phone: row.mobile_phone,
          gst: row.gst,
          pan: row.pan,
          is_msme_registered: row.is_msme_registered === 1,
          tds_tax_code: row.tds_tax_code,
          currency: row.currency,
          payment_terms: row.payment_terms,
          billing_address_ids: row.billing_address_ids,
          shipping_address_ids: row.shipping_address_ids,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted_at: row.deleted_at,
          is_active: row.is_active === 1,
          addresses: [],
        });
      }

      if (row.address_id) {
        suppliersMap.get(row.supplier_id).addresses.push({
          address_id: row.address_id,
          supplier_id: row.supplier_id,
          type: row.type,
          address_type: row.address_type,
          address_line1: row.address_line1,
          address_line: row.address_line,
          city: row.city,
          state: row.state,
          postal_code: row.postal_code,
          country: row.country,
          phone_dial_code: row.phone_dial_code,
          phone_number: row.phone_number,
          is_primary: row.is_primary === 1,
        });
      }
    }

    return {
      total,
      data: Array.from(suppliersMap.values()),
    };
  } catch (error) {
    throw new Error(`Fetch suppliers failed: ${error.message}`);
  }
};

// Get supplier by id with address
export const getSupplierById = async (supplierId) => {
  try {
    const [[supplier]] = await db.execute(
      `
        SELECT * FROM suppliers WHERE supplier_id = ? AND is_active = TRUE AND deleted_at IS NULL
      `,
      [supplierId]
    );

    if (!supplier) return null;

    const [addresses] = await db.execute(
      `
        SELECT * FROM supplier_address
        WHERE supplier_id = ?
        ORDER BY is_primary DESC, created_at ASC
        `,
      [supplierId]
    );

    return {
      ...supplier,
      addresses,
    };
  } catch (error) {
    throw new Error(`Fetch Supplier Failed: ${error.message}`);
  }
};

// Update supplier data
export const updateSupplier = async (supplierId, updateData) => {
  try {
    const fields = Object.keys(updateData);

    if (!fields.length) return 0;

    const setClause = fields.map((field) => `\`${field}\` = ?`).join(", ");
    const values = Object.values(updateData);

    const [result] = await db.execute(
      `
            UPDATE suppliers
            SET ${setClause}
            WHERE supplier_id = ?
            AND is_active = FALSE
            `,
      [...values, supplierId]
    );

    return result.affectedRows;
  } catch (error) {
    throw new Error(`Update Supplier Data Failed: ${error.message}`);
  }
};

// Soft delete supplier
export const softDeleteSupplier = async (supplierId) => {
  try {
    const [result] = await db.execute(
      `
      UPDATE suppliers
      SET
        deleted_at =
          CASE
            WHEN deleted_at IS NULL THEN NOW()
            ELSE NULL
          END,
        is_active =
          CASE
            WHEN deleted_at IS NULL THEN TRUE
            ELSE FALSE
          END
      WHERE supplier_id = ?
      `,
      [supplierId]
    );

    return result.affectedRows;
  } catch (error) {
    throw new Error(`Soft Delete Failed: ${error.message}`);
  }
};

// Hard delete supplier
export const hardDeleteSupplier = async (supplierId) => {
  try {
    const [result] = await db.execute(
      `
        DELETE FROM suppliers
        WHERE supplier_id = ?
        AND is_active = FALSE
      `,
      [supplierId]
    );

    return result.affectedRows;
  } catch (error) {
    throw new Error(`Hard Delete Failed: ${error.message}`);
  }
};
