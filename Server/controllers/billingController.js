import Billing from '../models/Billing.js';
import Inventory from '../models/Inventory.js';

const toPositiveInt = (value) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
};

const toMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
};

export const createBill = async (req, res) => {
  try {
    const { pharmacyId, items, total: clientTotalRaw } = req.body || {};

    if (!pharmacyId || !String(pharmacyId).trim()) {
      return res.status(400).json({ error: 'pharmacyId is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }

    // Validate and normalize input lines
    const normalizedLines = items.map((it, idx) => {
      const drugCode = it?.drugCode ? String(it.drugCode).trim() : '';
      if (!drugCode) {
        return { error: `Item #${idx + 1} is missing drugCode` };
      }
      const qty = toPositiveInt(it?.qty);
      if (!qty) {
        return { error: `Item #${idx + 1} has invalid qty` };
      }
      const name = it?.name ? String(it.name).trim() : '';
      const clientPrice = toMoney(it?.price);
      return { drugCode, qty, name, clientPrice };
    });

    const firstErr = normalizedLines.find((l) => l.error);
    if (firstErr) return res.status(400).json({ error: firstErr.error });

    // Atomically decrement stock per line. If any line fails, rollback previous decrements.
    const decremented = [];
    const computedItems = [];

    for (const line of normalizedLines) {
      // Use conditional update to prevent race conditions.
      const updated = await Inventory.findOneAndUpdate(
        {
          pharmacyId,
          drugCode: line.drugCode,
          quantity: { $gte: line.qty }
        },
        { $inc: { quantity: -line.qty } },
        { new: true }
      );

      if (!updated) {
        // rollback anything already decremented
        for (const prev of decremented) {
          await Inventory.updateOne(
            { pharmacyId, drugCode: prev.drugCode },
            { $inc: { quantity: prev.qty } }
          );
        }
        return res.status(400).json({ error: `Insufficient stock for drugCode ${line.drugCode}` });
      }

      decremented.push({ drugCode: line.drugCode, qty: line.qty });

      const inventoryPrice = toMoney(updated.price);
      const unitPrice = inventoryPrice ?? (line.clientPrice ?? 0);
      computedItems.push({
        drugCode: line.drugCode,
        name: line.name || updated.name,
        qty: line.qty,
        price: unitPrice,
        subtotal: unitPrice * line.qty
      });
    }

    const computedSubtotal = computedItems.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);
    const clientTotal = toMoney(clientTotalRaw);
    const total = clientTotal ?? computedSubtotal;
    const bill = new Billing({ pharmacyId, items: computedItems, total });
    await bill.save();
    return res.json(bill);
  } catch (err) {
    console.error('createBill err', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getBills = async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    if (!pharmacyId || !String(pharmacyId).trim()) {
      return res.status(400).json({ error: 'pharmacyId query param is required' });
    }
    const bills = await Billing.find({ pharmacyId }).sort({ createdAt: -1 });
    return res.json(bills);
  } catch (err) {
    console.error('getBills err', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Billing.findById(id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    return res.json(bill);
  } catch (err) {
    console.error('getBillById err', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
