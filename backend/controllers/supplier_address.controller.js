import * as SupplierAddress from '../models/supplier_address.model.js';

export const add_address = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const address = req.body;

        if (!id || !address || Object.keys(address).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Supplier Id and Address data are required"
            });
        };

        const addressId = await SupplierAddress.add_address({
            supplierId: id,
            address
        });

        return res.status(201).json({
            success: true,
            message: "Address added successfully",
            data: { addressId }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to add address",
            error: error.message
        })
    }
}

export const get_all_addresses = async (req, res) => {
    try {
        const LIMIT = 10;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const offset = (page - 1) * LIMIT;

        const search = req.query.search || "";
        const filter = req.query.filter || "";

        const result = await SupplierAddress.get_all_addresses({
            filter,
            search,
            limit: LIMIT,
            offset
        });

        return res.status(200).json({
            success: true,
            meta: {
                current_page: page,
                per_page: LIMIT,
                total_records: result.total,
                total_page: Math.ceil(result.total / LIMIT)
            },
            data: result.addresses
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to get all addresses",
            error: error.message
        });
    }
}

export const update_address = async (req, res) => {
    try {
        const addressId = Number(req.params.id);
        const updateData = req.body;
        console.log(addressId, updateData);

        if (!addressId || !updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Address Id and update data are required"
            });
        }

        const affectedRows = await SupplierAddress.update_address(addressId, updateData);
        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Address not found or no changes made"
            });
        };

        return res.status(200).json({
            success: true,
            message: "Address updated successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update address",
            error: error.message
        });
    }
}

export const delete_address = async (req, res) => {
    try {
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete address",
            error: error.message
        });
    }
}