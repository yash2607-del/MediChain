import Appointment from '../models/Appointment.js';
import mongoose from 'mongoose';

// Check if MongoDB is connected
function dbConnected() {
  return mongoose.connection.readyState === 1;
}

// In-memory fallback for appointments
let mockAppointments = [];

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const {
      patientId,
      doctorName,
      specialty,
      appointmentDate,
      appointmentTime,
      reasonForVisit,
      additionalNotes,
      status
    } = req.body;

    // Validation
    if (!patientId || !doctorName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        error: 'Missing required fields: patientId, doctorName, appointmentDate, appointmentTime'
      });
    }

    if (dbConnected()) {
      // Save to MongoDB
      const appointment = new Appointment({
        patientId,
        doctorName,
        specialty: specialty || '',
        appointmentDate,
        appointmentTime,
        reasonForVisit: reasonForVisit || '',
        additionalNotes: additionalNotes || '',
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
        patientId,
        doctorName,
        specialty: specialty || '',
        appointmentDate,
        appointmentTime,
        reasonForVisit: reasonForVisit || '',
        additionalNotes: additionalNotes || '',
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
    const { patientId } = req.query;

    if (dbConnected()) {
      const filter = patientId ? { patientId } : {};
      const appointments = await Appointment.find(filter).sort({ appointmentDate: -1, appointmentTime: -1 });
      return res.json(appointments);
    } else {
      // Fallback to in-memory
      const filtered = patientId
        ? mockAppointments.filter(a => a.patientId === patientId)
        : mockAppointments;
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

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: pending, confirmed, cancelled, or completed' });
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
