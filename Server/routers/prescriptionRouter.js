import express from 'express'
import { 
  addPrescription, 
  listPrescriptionsByEmail, 
  getPrescriptionByIdWithVerify,
  sharePrescription,
  lockPrescription,
  verifyPrescriptionOtp,
  getPrescriptionStatus,
  getPrescriptionForPharmacy,
  findPharmaciesForPrescription
} from '../controllers/prescriptionController.js'

const router = express.Router()

// POST /api/prescriptions
router.post('/', addPrescription)

// GET /api/prescriptions?email=
router.get('/', listPrescriptionsByEmail)

// GET /api/prescriptions/:id (tamper verification)
router.get('/:id', getPrescriptionByIdWithVerify)

// GET /api/prescriptions/:id/pharmacies - Find pharmacies with available medicines
router.get('/:id/pharmacies', findPharmaciesForPrescription)

// POST /api/prescriptions/:id/share - Patient generates OTP to share with pharmacy
router.post('/:id/share', sharePrescription)

// POST /api/prescriptions/:id/lock - Patient locks prescription (revokes access)
router.post('/:id/lock', lockPrescription)

// POST /api/prescriptions/:id/verify-otp - Pharmacy verifies OTP to view prescription
router.post('/:id/verify-otp', verifyPrescriptionOtp)

// GET /api/prescriptions/:id/status - Check lock status
router.get('/:id/status', getPrescriptionStatus)

// GET /api/prescriptions/:id/pharmacy - Pharmacy access (checks OTP verification)
router.get('/:id/pharmacy', getPrescriptionForPharmacy)

export default router
