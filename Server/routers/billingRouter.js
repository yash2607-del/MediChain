import express from 'express';
import { createBill, getBills, getBillById } from '../controllers/billingController.js';

const router = express.Router();

router.post('/', createBill);
router.get('/', getBills);
router.get('/:id', getBillById);

export default router;
