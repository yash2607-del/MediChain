import mongoose from 'mongoose';

// Restructured Appointment schema per new requirements:
// Only persist doctorId, patientId, appointmentDate, reason, status.
// Status enum: pending | approved | cancelled (default pending).
// Use ObjectId refs to maintain linkage between doctor & patient.
const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appointmentDate: {
    type: Date,
    required: true,
    index: true
  },
  appointmentTime: {
    type: String,
    required: false
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  doctorName: {
    type: String,
    required: false,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'confirmed', 'cancelled'],
    default: 'pending',
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Appointment', appointmentSchema);
