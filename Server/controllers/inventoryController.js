import Inventory from '../models/Inventory.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Simple in-memory fallback when MongoDB is not connected (dev/test only)
const mockInventory = [];

const dbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

export const getInventory = async (req, res) => {
  try {
    const { pharmacyId } = req.query || {};
    if (dbConnected()) {
      const query = pharmacyId ? { pharmacyId } : {};
      const items = await Inventory.find(query);
      return res.json(items);
    }
    if (pharmacyId) return res.json(mockInventory.filter(i => i.pharmacyId === pharmacyId));
    return res.json(mockInventory);
  } catch (err) {
    console.error('getInventory err', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const addInventory = async (req, res) => {
  try {
    const { pharmacyId, name, quantity = 1, batch, expiry, manufacturer, price, drugCode } = req.body || {};
    if (!pharmacyId || !name) {
      return res.status(400).json({ error: 'pharmacyId and name are required' });
    }

    const qtyNum = Number(quantity);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive number' });
    }

    const normalizedName = String(name).trim();
    const normalizedDrugCode = drugCode ? String(drugCode).trim() : '';

    if (dbConnected()) {
      // Prefer upsert by (pharmacyId, drugCode) since billing uses drugCode.
      // Fallback to (pharmacyId, name) when drugCode is not provided.
      const findQuery = normalizedDrugCode
        ? { pharmacyId, drugCode: normalizedDrugCode }
        : { pharmacyId, name: normalizedName };

      const existing = await Inventory.findOne(findQuery);
      if (existing) {
        existing.quantity = Number(existing.quantity || 0) + qtyNum;
        // Backfill a missing drugCode on older records so billing can work reliably.
        if (!existing.drugCode && !normalizedDrugCode) {
          existing.drugCode = `MED-${String(pharmacyId).slice(-6)}-${Date.now().toString(36)}`;
        }
        // Optionally refresh meta fields if provided
        if (batch) existing.batch = batch;
        if (expiry) existing.expiry = expiry;
        if (manufacturer) existing.manufacturer = manufacturer;
        if (typeof price !== 'undefined') existing.price = price;
        // If client didn't provide a code, keep the existing one.
        // If it did, ensure we store the trimmed version.
        if (normalizedDrugCode) existing.drugCode = normalizedDrugCode;
        await existing.save();
        return res.json(existing);
      }

      // Ensure new inventory entries always get a usable drugCode (Billing UI relies on it).
      const generatedDrugCode = `MED-${String(pharmacyId).slice(-6)}-${Date.now().toString(36)}`;
      const finalDrugCode = normalizedDrugCode || generatedDrugCode;

      const newItem = new Inventory({
        pharmacyId,
        name: normalizedName,
        quantity: qtyNum,
        batch,
        expiry,
        manufacturer,
        price,
        drugCode: finalDrugCode
      });
      await newItem.save();
      return res.json(newItem);
    }
    // fallback: upsert in mock array
    const idx = normalizedDrugCode
      ? mockInventory.findIndex(i => i.pharmacyId === pharmacyId && i.drugCode === normalizedDrugCode)
      : mockInventory.findIndex(i => i.pharmacyId === pharmacyId && i.name === normalizedName);
    if (idx !== -1) {
      const updated = { ...mockInventory[idx] };
      updated.quantity = Number(updated.quantity || 0) + qtyNum;
      if (!updated.drugCode && !normalizedDrugCode) {
        updated.drugCode = `MED-${String(pharmacyId).slice(-6)}-${Date.now().toString(36)}`;
      }
      if (batch) updated.batch = batch;
      if (expiry) updated.expiry = expiry;
      if (manufacturer) updated.manufacturer = manufacturer;
      if (typeof price !== 'undefined') updated.price = price;
      if (normalizedDrugCode) updated.drugCode = normalizedDrugCode;
      mockInventory[idx] = updated;
      return res.json(updated);
    }

    const generatedDrugCode = `MED-${String(pharmacyId).slice(-6)}-${Date.now().toString(36)}`;
    const finalDrugCode = normalizedDrugCode || generatedDrugCode;

    const item = {
      _id: String(Date.now()),
      pharmacyId,
      name: normalizedName,
      quantity: qtyNum,
      batch,
      expiry,
      manufacturer,
      price,
      drugCode: finalDrugCode
    };
    mockInventory.push(item);
    return res.json(item);
  } catch (err) {
    console.error('addInventory err', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { drugCode, qty, pharmacyId } = req.body;
    if (dbConnected()) {
      const item = await Inventory.findOne({ drugCode, pharmacyId });
      if (!item) return res.status(404).json({ error: 'Item not found' });
      if (item.quantity < qty) return res.status(400).json({ error: 'Insufficient stock' });
      item.quantity -= qty;
      await item.save();
      return res.json({ success: true });
    }
    // fallback
    const idx = mockInventory.findIndex(i => i.drugCode === drugCode && (!pharmacyId || i.pharmacyId === pharmacyId));
    if (idx === -1) return res.status(404).json({ error: 'Item not found (mock)' });
    if (mockInventory[idx].quantity < qty) return res.status(400).json({ error: 'Insufficient stock (mock)' });
    mockInventory[idx].quantity -= qty;
    return res.json({ success: true });
  } catch (err) {
    console.error('updateStock err', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Search inventory across all pharmacies by medicine name (case-insensitive)
// Returns enriched results including shop name & location (lat,lng,address) if available.
export const searchInventory = async (req, res) => {
  try {
    const { name } = req.query || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Query param "name" is required' });
    }
    const queryName = String(name).trim();
    // When DB connected use Mongo, otherwise fallback to mock array.
    if (dbConnected()) {
      const regex = new RegExp(queryName, 'i');
      const items = await Inventory.find({ name: regex, quantity: { $gt: 0 } });
      const pharmacyIds = [...new Set(items.map(i => i.pharmacyId).filter(Boolean))];
      let pharmacyMap = new Map();
      if (pharmacyIds.length) {
        const pharmacies = await User.find({ _id: { $in: pharmacyIds } }, { profile: 1, role: 1 });
        pharmacyMap = new Map(pharmacies.map(p => [String(p._id), p]));
      }
      const results = items.map(i => {
        const ph = pharmacyMap.get(String(i.pharmacyId));
        const profile = ph?.profile || {};
        return {
          id: i._id,
          medicineName: i.name,
          quantity: i.quantity,
          price: typeof i.price !== 'undefined' ? i.price : null,
          pharmacyId: i.pharmacyId,
          shopName: profile.shopName || profile.name || null,
          location: profile.location || null
        };
      });
      return res.json({ results });
    }
    // Fallback mock search
    const regex = new RegExp(queryName, 'i');
    const mockMatches = mockInventory.filter(i => regex.test(i.name) && (i.quantity || 0) > 0);
    const results = mockMatches.map(i => ({
      id: i._id,
      medicineName: i.name,
      quantity: i.quantity,
      pharmacyId: i.pharmacyId,
      shopName: null,
      location: null
    }));
    return res.json({ results });
  } catch (err) {
    console.error('searchInventory err', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
