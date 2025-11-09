import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Check if MongoDB is connected
function dbConnected() {
  return mongoose.connection.readyState === 1;
}

// In-memory fallback for appointments
let mockAppointments = [];

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    let { doctorId, patientId, appointmentDate, appointmentTime, reason, doctorName, status } = req.body;

    // If auth token present, derive patientId from it (preferred)
    try {
      if (!patientId && req.headers?.authorization) {
        const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const secret = process.env.JWT_SECRET || '';
        if (token && secret) {
          const decoded = jwt.verify(token, secret);
          if (decoded && (decoded.id || decoded._id || decoded.sub)) {
            patientId = decoded.id || decoded._id || decoded.sub;
          }
        }
      }
    } catch (e) {
      // ignore token parse errors, fallback to body.patientId if provided
    }

    // Validation
    if ((!doctorId && !doctorName) || !patientId || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        error: 'Missing required fields: doctorId or doctorName, patientId (or provide JWT), appointmentDate, appointmentTime, reason'
      });
    }

    // Validate ObjectId format
    const isValidObjectId = (val) => mongoose.Types.ObjectId.isValid(val);

    if (dbConnected()) {
      // Resolve doctorId if only doctorName provided
      if (!doctorId && doctorName) {
        // try to find doctor user by profile.name or email (case-insensitive)
        const found = await User.findOne({
          $or: [
            { 'profile.name': doctorName },
            { email: doctorName },
            { 'profile.email': doctorName }
          ]
        }).lean();
        if (found?._id) {
          doctorId = found._id;
        }
      }

      if (!isValidObjectId(patientId)) {
        return res.status(400).json({ error: 'patientId must be a valid ObjectId string' });
      }
      if (doctorId && !isValidObjectId(doctorId)) {
        return res.status(400).json({ error: 'doctorId must be a valid ObjectId string' });
      }

      // Build appointmentDateTime from date + time
      const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);

      const appointment = new Appointment({
        doctorId: doctorId ? new mongoose.Types.ObjectId(doctorId) : undefined,
        doctorName: doctorName || undefined,
        patientId: new mongoose.Types.ObjectId(patientId),
        appointmentDate: dateTime,
        appointmentTime,
        reason,
        status: status || 'pending'
      });

      const savedAppointment = await appointment.save();
      return res.status(201).json({
        message: 'Appointment created successfully',
        appointment: savedAppointment
      });
    } else {
      // Fallback to in-memory storage
      const newAppointment = {
        _id: 'APT' + Date.now(),
        doctorId,
        doctorName: doctorName || undefined,
        patientId,
        appointmentDate: `${appointmentDate}T${appointmentTime}`,
        appointmentTime,
        reason,
        status: status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockAppointments.push(newAppointment);
      return res.status(201).json({
        message: 'Appointment created successfully (in-memory)',
        appointment: newAppointment
      });
    }
  } catch (err) {
    console.error('createAppointment error:', err);
    return res.status(500).json({ error: 'Failed to create appointment', details: err.message });
  }
};

// Get all appointments for a patient
export const getAppointments = async (req, res) => {
  try {
    const { patientId, doctorId } = req.query;

    if (dbConnected()) {
      const filter = doctorId ? { doctorId } : (patientId ? { patientId } : {});
      const appointments = await Appointment.find(filter).sort({ appointmentDate: -1 });
      return res.json(appointments);
    } else {
      // Fallback to in-memory
      let filtered = mockAppointments;
      if (doctorId) filtered = filtered.filter(a => a.doctorId === doctorId);
      else if (patientId) filtered = filtered.filter(a => a.patientId === patientId);
      return res.json(filtered);
    }
  } catch (err) {
    console.error('getAppointments error:', err);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get a single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (dbConnected()) {
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      return res.json(appointment);
    } else {
      const appointment = mockAppointments.find(a => a._id === id);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      return res.json(appointment);
    }
  } catch (err) {
    console.error('getAppointmentById error:', err);
    return res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: pending, approved, confirmed, or cancelled' });
    }

    if (dbConnected()) {
      const appointment = await Appointment.findByIdAndUpdate(
        id,
        { status, updatedAt: Date.now() },
        { new: true }
      );
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      return res.json({ message: 'Appointment status updated', appointment });
    } else {
      const appointment = mockAppointments.find(a => a._id === id);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      appointment.status = status;
      appointment.updatedAt = new Date();
      return res.json({ message: 'Appointment status updated', appointment });
    }
  } catch (err) {
    console.error('updateAppointmentStatus error:', err);
    return res.status(500).json({ error: 'Failed to update appointment status' });
  }
};

// Delete an appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (dbConnected()) {
      const appointment = await Appointment.findByIdAndDelete(id);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      return res.json({ message: 'Appointment deleted successfully' });
    } else {
      const index = mockAppointments.findIndex(a => a._id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      mockAppointments.splice(index, 1);
      return res.json({ message: 'Appointment deleted successfully' });
    }
  } catch (err) {
    console.error('deleteAppointment error:', err);
    return res.status(500).json({ error: 'Failed to delete appointment' });
  }
};
