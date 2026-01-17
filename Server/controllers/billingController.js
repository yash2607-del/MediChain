import Billing from '../models/Billing.js';
import Inventory from '../models/Inventory.js';
import Prescription from '../models/Prescription.js';

export const createBill = async (req, res) => {
  const { pharmacyId, items, total, prescriptionId } = req.body;
  // Reduce inventory quantities
  for (const it of items) {
    const item = await Inventory.findOne({ drugCode: it.drugCode, pharmacyId });
    if (!item || item.quantity < it.qty) {
      return res.status(400).json({ error: `Insufficient stock for ${it.name}` });
    }
    item.quantity -= it.qty;
    await item.save();
  }
  // Store bill
  const bill = new Billing({ pharmacyId, items, total, prescriptionId });
  await bill.save();

  // Auto-lock the prescription after billing (if prescriptionId provided)
  if (prescriptionId) {
    try {
      await Prescription.findByIdAndUpdate(prescriptionId, {
        isLocked: true,
        shareOtp: null,
        otpExpiresAt: null,
        otpVerifiedBy: null
      });
    } catch (lockErr) {
      console.warn('Failed to auto-lock prescription after billing:', lockErr.message);
    }
  }

  res.json(bill);
};

export const getBills = async (req, res) => {
  const { pharmacyId } = req.query;
  const bills = await Billing.find({ pharmacyId });
  res.json(bills);
};
