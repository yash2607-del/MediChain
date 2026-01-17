import Prescription from '../models/Prescription.js'
import { hashPrescription } from '../utils/hashPrescription.js'
import { addHashToBlockchain, verifyHashOnBlockchain } from '../utils/blockchain.js'
import crypto from 'crypto'
import Inventory from '../models/Inventory.js'
import User from '../models/User.js'

// Generate a 4-digit OTP unique per user (based on email + timestamp seed)
function generateUserOTP(email) {
  // Create a seed from email + current minute (so same user gets different OTPs each time)
  const seed = `${email || 'user'}-${Date.now()}`;
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  // Take first 4 numeric characters from hash, or generate random if not enough
  let otp = '';
  for (const char of hash) {
    if (/\d/.test(char)) {
      otp += char;
      if (otp.length === 4) break;
    }
  }
  // Fallback: pad with random digits if needed
  while (otp.length < 4) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

function validatePrescription(body) {
  if (!body) return 'Missing request body'
  if (!body.patientName) return 'patientName is required'
  if (!('patientEmail' in body)) return null // email optional
  if (!('age' in body)) return null
  if (!body.sex) return 'sex is required'
  if (!Array.isArray(body.medicines)) return 'medicines must be an array'
  return null
}

// Create a prescription, computing and storing a canonical data hash
export async function addPrescription(req, res) {
  try {
    const errMsg = validatePrescription(req.body)
    if (errMsg) return res.status(400).json({ error: errMsg })

  const { patientName, patientEmail, age, sex, medicines, notes } = req.body

  // Determine doctorName from authenticated user context if available
  // Assume req.user populated by auth middleware; fallback to body.doctorName if explicitly provided
  const doctorProfileName = req.user?.profile?.name || req.user?.name || req.body.doctorName || ''
  const doctorName = doctorProfileName ? (doctorProfileName.toLowerCase().startsWith('dr') ? doctorProfileName : `Dr. ${doctorProfileName}`) : ''

    const normalized = {
      patientName,
      patientEmail,
      age: typeof age === 'string' ? Number(age) : age,
      sex,
      medicines: Array.isArray(medicines) ? medicines.map(m => ({
        id: m.id,
        name: m.name,
        dosageValue: typeof m.dosageValue === 'string' ? Number(m.dosageValue) : m.dosageValue,
        dosageUnit: m.dosageUnit,
        timesPerDay: typeof m.timesPerDay === 'string' ? Number(m.timesPerDay) : m.timesPerDay,
        totalDays: typeof m.totalDays === 'string' ? Number(m.totalDays) : m.totalDays
      })) : [],
      notes,
      doctorName
    }

    // Compute canonical hash of core data
    const { hash } = hashPrescription(normalized)

    const created = await Prescription.create({
      ...normalized,
      dataHash: hash,
      hashVersion: 1
    })
    // Anchor hash on-chain (best-effort) and persist tx hash
    let chainTxHash = null
    try {
      chainTxHash = await addHashToBlockchain(created.dataHash)
      await Prescription.findByIdAndUpdate(created._id, {
        chainTxHash,
        chainNetwork: 'sepolia',
        chainConfirmed: true
      })
    } catch (chainErr) {
      console.error('Blockchain anchoring failed:', chainErr)
    }

    return res.status(201).json({ ok: true, id: created._id, dataHash: created.dataHash, chainTxHash })
  } catch (err) {
    console.error('addPrescription error:', err)
    return res.status(500).json({ error: 'Failed to add prescription' })
  }
}

// GET /api/prescriptions?email=...
export async function listPrescriptionsByEmail(req, res) {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }
    const items = await Prescription.find({ patientEmail: email }).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, count: items.length, items });
  } catch (err) {
    console.error('listPrescriptionsByEmail error:', err);
    return res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
}

// GET /api/prescriptions/:id with tamper verification
export async function getPrescriptionByIdWithVerify(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const doc = await Prescription.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // Rebuild canonical JSON from the DB record using the same core fields
    const core = {
      patientName: doc.patientName,
      patientEmail: doc.patientEmail,
      doctorName: doc.doctorName || '',
      age: typeof doc.age === 'number' ? doc.age : (doc.age == null ? null : Number(doc.age)),
      sex: doc.sex,
      medicines: Array.isArray(doc.medicines)
        ? doc.medicines.map(m => ({
            id: m.id,
            name: m.name,
            dosageValue: typeof m.dosageValue === 'number' ? m.dosageValue : (m.dosageValue == null ? null : Number(m.dosageValue)),
            dosageUnit: m.dosageUnit,
            timesPerDay: typeof m.timesPerDay === 'number' ? m.timesPerDay : (m.timesPerDay == null ? null : Number(m.timesPerDay)),
            totalDays: typeof m.totalDays === 'number' ? m.totalDays : (m.totalDays == null ? null : Number(m.totalDays)),
          }))
        : [],
      notes: doc.notes || ''
    };
    const { hash: computedHash, canonical } = hashPrescription(core);

    const storedHash = doc.dataHash || null;
    const hashMatches = !!storedHash && storedHash.toLowerCase() === computedHash.toLowerCase();

    // Verify on-chain best-effort; if chain env missing, don't hard-fail
    let onChainVerified = null;
    try {
      if (storedHash) {
        onChainVerified = await verifyHashOnBlockchain(storedHash);
      }
    } catch (e) {
      console.warn('On-chain verify failed (non-fatal):', e.message || e);
      onChainVerified = null; // unknown
    }

    // If either check fails (hash mismatch OR explicit on-chain false), mark tampered
    const onChainFailed = onChainVerified === false; // null means unknown -> do not fail solely on that
    const verified = hashMatches && !onChainFailed;

    if (!verified) {
      const reason = !hashMatches ? 'hash-mismatch' : 'onchain-mismatch';
      return res.status(409).json({ ok: false, verified: false, reason, id: doc._id, storedHash, computedHash, onChainVerified, canonical, doc });
    }

    return res.json({ ok: true, verified: true, id: doc._id, storedHash, computedHash, onChainVerified, canonical, doc });
  } catch (err) {
    console.error('getPrescriptionByIdWithVerify error:', err);
    return res.status(500).json({ error: 'Failed to fetch prescription' });
  }
}

// POST /api/prescriptions/:id/share - Generate OTP to share prescription with pharmacy
export async function sharePrescription(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing prescription id' });

    const doc = await Prescription.findById(id);
    if (!doc) return res.status(404).json({ error: 'Prescription not found' });

    // Generate 4-digit OTP unique to this user
    const otp = generateUserOTP(doc.patientEmail);
    // OTP valid for 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update prescription with OTP
    doc.shareOtp = otp;
    doc.otpExpiresAt = expiresAt;
    doc.isLocked = false; // Unlock for sharing
    doc.otpVerifiedBy = null; // Reset any previous verification
    await doc.save();

    return res.json({
      ok: true,
      otp,
      expiresAt,
      message: 'Share this 4-digit OTP with the pharmacy to allow them to view your prescription'
    });
  } catch (err) {
    console.error('sharePrescription error:', err);
    return res.status(500).json({ error: 'Failed to generate share OTP' });
  }
}

// POST /api/prescriptions/:id/lock - Lock prescription (revoke access)
export async function lockPrescription(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing prescription id' });

    const doc = await Prescription.findById(id);
    if (!doc) return res.status(404).json({ error: 'Prescription not found' });

    // Lock the prescription and clear OTP
    doc.isLocked = true;
    doc.shareOtp = null;
    doc.otpExpiresAt = null;
    doc.otpVerifiedBy = null;
    await doc.save();

    return res.json({ ok: true, message: 'Prescription locked successfully' });
  } catch (err) {
    console.error('lockPrescription error:', err);
    return res.status(500).json({ error: 'Failed to lock prescription' });
  }
}

// POST /api/prescriptions/:id/verify-otp - Pharmacy verifies OTP to access prescription
export async function verifyPrescriptionOtp(req, res) {
  try {
    const { id } = req.params;
    const { otp, pharmacyId } = req.body;

    if (!id) return res.status(400).json({ error: 'Missing prescription id' });
    if (!otp) return res.status(400).json({ error: 'OTP is required' });

    const doc = await Prescription.findById(id);
    if (!doc) return res.status(404).json({ error: 'Prescription not found' });

    // Check if prescription is locked
    if (doc.isLocked) {
      return res.status(403).json({ error: 'Prescription is locked. Patient needs to share it first.' });
    }

    // Check OTP expiration
    if (!doc.otpExpiresAt || new Date() > doc.otpExpiresAt) {
      return res.status(403).json({ error: 'OTP has expired. Please ask patient for a new OTP.' });
    }

    // Verify OTP
    if (doc.shareOtp !== otp) {
      return res.status(403).json({ error: 'Invalid OTP' });
    }

    // Mark as verified by this pharmacy
    doc.otpVerifiedBy = pharmacyId || 'verified';
    await doc.save();

    return res.json({ ok: true, verified: true, message: 'OTP verified. You can now view the prescription.' });
  } catch (err) {
    console.error('verifyPrescriptionOtp error:', err);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
}

// GET /api/prescriptions/:id/status - Check prescription lock status
export async function getPrescriptionStatus(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing prescription id' });

    const doc = await Prescription.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'Prescription not found' });

    return res.json({
      ok: true,
      id: doc._id,
      isLocked: doc.isLocked,
      hasActiveOtp: !doc.isLocked && doc.shareOtp && doc.otpExpiresAt && new Date() < doc.otpExpiresAt,
      otpExpiresAt: doc.otpExpiresAt,
      otpVerifiedBy: doc.otpVerifiedBy
    });
  } catch (err) {
    console.error('getPrescriptionStatus error:', err);
    return res.status(500).json({ error: 'Failed to get prescription status' });
  }
}

// Modified: Check if prescription can be viewed by pharmacy (called from pharmacy routes)
export async function getPrescriptionForPharmacy(req, res) {
  try {
    const { id } = req.params;
    const { pharmacyId } = req.query;

    if (!id) return res.status(400).json({ error: 'Missing prescription id' });

    const doc = await Prescription.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'Prescription not found' });

    // Check if locked
    if (doc.isLocked) {
      return res.status(403).json({ 
        error: 'Prescription is locked', 
        requiresOtp: true,
        message: 'This prescription is private. Please enter the OTP provided by the patient.' 
      });
    }

    // Check if OTP is valid and verified
    if (!doc.otpVerifiedBy) {
      return res.status(403).json({ 
        error: 'OTP verification required', 
        requiresOtp: true,
        message: 'Please enter the OTP provided by the patient to view this prescription.' 
      });
    }

    // Check if OTP has expired
    if (doc.otpExpiresAt && new Date() > doc.otpExpiresAt) {
      return res.status(403).json({ 
        error: 'OTP has expired', 
        requiresOtp: true,
        message: 'The OTP has expired. Please ask the patient for a new OTP.' 
      });
    }

    // Pharmacy can view - return prescription data
    return res.json({ 
      ok: true, 
      doc,
      message: 'Prescription access granted'
    });
  } catch (err) {
    console.error('getPrescriptionForPharmacy error:', err);
    return res.status(500).json({ error: 'Failed to fetch prescription' });
  }
}

// GET /api/prescriptions/:id/pharmacies - Find pharmacies with available medicines for this prescription
export async function findPharmaciesForPrescription(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing prescription id' });

    const doc = await Prescription.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'Prescription not found' });

    const medicines = doc.medicines || [];
    if (medicines.length === 0) {
      return res.json({ ok: true, pharmacies: [], totalMedicines: 0 });
    }

    // Get all pharmacy users (role: pharmacy) - this is where inventory pharmacyId points to
    const allPharmacyUsers = await User.find({ role: 'pharmacy' }).lean();
    
    // Get medicine names from prescription (normalize to lowercase for matching)
    const medicineNames = medicines.map(m => (m.name || '').toLowerCase().trim());
    const totalMedicines = medicineNames.length;

    // For each pharmacy, check which medicines are available
    const pharmaciesWithAvailability = [];

    for (const pharmacy of allPharmacyUsers) {
      const pharmacyId = pharmacy._id.toString();
      const profile = pharmacy.profile || {};
      
      // Find inventory for this pharmacy using its _id
      const inventory = await Inventory.find({ 
        pharmacyId: pharmacyId 
      }).lean();

      // Get available medicine names in this pharmacy (lowercase for matching)
      const availableMeds = inventory
        .filter(item => item.quantity > 0)
        .map(item => (item.name || '').toLowerCase().trim());

      // Count how many prescription medicines are available
      let availableCount = 0;
      const availableMedicinesList = [];
      const unavailableMedicinesList = [];

      for (let i = 0; i < medicines.length; i++) {
        const medName = medicineNames[i];
        // Check if this medicine is available (partial match)
        const isAvailable = availableMeds.some(avail => 
          avail.includes(medName) || medName.includes(avail) || 
          avail === medName
        );
        
        if (isAvailable) {
          availableCount++;
          availableMedicinesList.push(medicines[i].name);
        } else {
          unavailableMedicinesList.push(medicines[i].name);
        }
      }

      // Include all pharmacies with their availability status
      // Use profile data from User model (shopName, location.address, etc.)
      pharmaciesWithAvailability.push({
        _id: pharmacy._id,
        name: profile.shopName || profile.name || pharmacy.email || 'Unknown Pharmacy',
        address: profile.location?.address || profile.address || 'Address not available',
        contact: profile.phone || profile.contact || '',
        availableCount,
        totalMedicines,
        availabilityText: availableCount === 0 ? 'Unavailable' : `${availableCount}/${totalMedicines}`,
        availableMedicines: availableMedicinesList,
        unavailableMedicines: unavailableMedicinesList,
        hasAllMedicines: availableCount === totalMedicines,
        hasNoMedicines: availableCount === 0
      });
    }

    // Sort: pharmacies with all medicines first, then by availability count
    pharmaciesWithAvailability.sort((a, b) => {
      if (a.hasAllMedicines && !b.hasAllMedicines) return -1;
      if (!a.hasAllMedicines && b.hasAllMedicines) return 1;
      return b.availableCount - a.availableCount;
    });

    return res.json({
      ok: true,
      totalMedicines,
      medicines: medicines.map(m => m.name),
      pharmacies: pharmaciesWithAvailability
    });
  } catch (err) {
    console.error('findPharmaciesForPrescription error:', err);
    return res.status(500).json({ error: 'Failed to find pharmacies' });
  }
}

