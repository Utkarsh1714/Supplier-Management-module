import express from 'express';
import { add_address, delete_address, get_all_addresses, update_address } from '../controllers/supplier_address.controller.js';

const router = express.Router();

router.get('/', get_all_addresses);
router.post('/:id', add_address);
router.patch('/:id', update_address);
router.delete('/:id', delete_address);

export default router;