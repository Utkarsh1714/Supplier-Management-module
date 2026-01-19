import db from "../config/db.js";
import { buildAddressFilterClause, parseFilters } from "../utils/helperFunc.js";

const getSupplierAddressCount = async () => {
  const query = `
    SELECT COUNT(*) AS count
    FROM supplier_address
  `;
  const [rows] = await db.execute(query);
  return rows[0].count;
};

export const add_address = async ({ supplierId, address }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

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
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        address.is_primary ?? 0,
      ],
    );

    const addressId = addressResult.insertId;
    const jsonColumn =
      address.type === "billing"
        ? "billing_address_ids"
        : "shipping_address_ids";

    await connection.execute(
      `
            UPDATE suppliers
            SET ${jsonColumn} = JSON_ARRAY_APPEND(
                IFNULL(${jsonColumn}, JSON_ARRAY()),
                '$',
                ?
            )
            WHERE supplier_id = ?
            `,
      [addressId, supplierId],
    );
    await connection.commit();

    return addressId;
  } catch (error) {
    console.error("Add address error: ", error);
    throw new Error(`Failed to add address: ${error.message}`);
  }
};

export const get_all_addresses = async ({ filter, search, limit, offset }) => {
  try {
    const total = await getSupplierAddressCount();
    const filters = parseFilters(filter);
    let whereClause = buildAddressFilterClause(filters);

    const safeLimit = Number(limit);
    const safeOffset = Number(offset);

    const params = [];

    if (search && search.trim() !== "") {
      whereClause += whereClause ? " AND" : "WHERE";
      whereClause = `
        WHERE (
            city LIKE ?
            OR state LIKE ?
            OR country LIKE ?
            OR postal_code LIKE ?
        )
    `;
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    const [rows] = await db.query(
      `
      SELECT
        address_id,
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
        CAST(IF(is_primary = 1, 'true', 'false') AS JSON) AS is_primary,
        created_at,
        updated_at
      FROM supplier_address
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${safeOffset}, ${safeLimit}
      `,
      params,
    );

    return {
      total,
      addresses: rows,
    };
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to get all addresses: ${error.message}`);
  }
};

export const update_address = async (addressId, updateData) => {
    try {
        const fields = Object.keys(updateData);

        if (!fields.length) return 0;

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = Object.values(updateData);

        const [result] = await db.execute(
            `
            UPDATE supplier_address
            SET ${setClause}
            WHERE address_id = ?
            `,
            [...values, addressId]
        );

        return result.affectedRows;
    } catch (error) {
        console.error("Update address error: ", error);
        throw new Error(`Failed to update address: ${error.message}`);
    }
}