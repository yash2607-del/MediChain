import mongoose from 'mongoose';

const pharmacyDetailsSchema = new mongoose.Schema({
  name: String,
  address: String,
  contact: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PharmacyDetails', pharmacyDetailsSchema);
