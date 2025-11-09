import express from 'express';
import * as appointmentController from '../controllers/appointmentController.js';

const router = express.Router();

// Create a new appointment
router.post('/', appointmentController.createAppointment);

// Get all appointments (optionally filtered by patientId via query param)
router.get('/', appointmentController.getAppointments);

// Get a single appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Update appointment status
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

// Delete an appointment
router.delete('/:id', appointmentController.deleteAppointment);

export default router;
