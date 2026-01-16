import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'verifications');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max per file
});

// Accept up to 10 degree files and 10 certificate files
const uploadFields = upload.fields([
  { name: 'degree_0', maxCount: 1 },
  { name: 'degree_1', maxCount: 1 },
  { name: 'degree_2', maxCount: 1 },
  { name: 'degree_3', maxCount: 1 },
  { name: 'degree_4', maxCount: 1 },
  { name: 'degree_5', maxCount: 1 },
  { name: 'degree_6', maxCount: 1 },
  { name: 'degree_7', maxCount: 1 },
  { name: 'degree_8', maxCount: 1 },
  { name: 'degree_9', maxCount: 1 },
  { name: 'certificate_0', maxCount: 1 },
  { name: 'certificate_1', maxCount: 1 },
  { name: 'certificate_2', maxCount: 1 },
  { name: 'certificate_3', maxCount: 1 },
  { name: 'certificate_4', maxCount: 1 },
  { name: 'certificate_5', maxCount: 1 },
  { name: 'certificate_6', maxCount: 1 },
  { name: 'certificate_7', maxCount: 1 },
  { name: 'certificate_8', maxCount: 1 },
  { name: 'certificate_9', maxCount: 1 }
]);

// POST /api/doctor/verification
router.post('/verification', uploadFields, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      registrationNumber,
      yearsOfPractice,
      degreesMeta,
      certificatesMeta
    } = req.body;

    // Parse metadata
    let degrees = [];
    let certificates = [];
    try {
      degrees = JSON.parse(degreesMeta || '[]');
      certificates = JSON.parse(certificatesMeta || '[]');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid metadata format' });
    }

    // Attach file paths to degrees
    degrees = degrees.map((d, i) => {
      const fileKey = `degree_${i}`;
      const file = req.files?.[fileKey]?.[0];
      return {
        name: d.name,
        filePath: file ? `/uploads/verifications/${file.filename}` : null
      };
    });

    // Attach file paths to certificates
    certificates = certificates.map((c, i) => {
      const fileKey = `certificate_${i}`;
      const file = req.files?.[fileKey]?.[0];
      return {
        name: c.name,
        filePath: file ? `/uploads/verifications/${file.filename}` : null
      };
    });

    // Build verification record
    const verificationData = {
      fullName,
      phone,
      email,
      registrationNumber,
      yearsOfPractice: yearsOfPractice ? parseInt(yearsOfPractice, 10) : null,
      degrees,
      certificates,
      status: 'pending', // pending | approved | rejected
      submittedAt: new Date()
    };

    // For now, store in-memory or log (replace with DB save)
    // In production, save to MongoDB collection e.g. DoctorVerification
    console.log('Doctor verification submission:', verificationData);

    // TODO: Save to DB
    // const DoctorVerification = mongoose.model('DoctorVerification');
    // await DoctorVerification.create(verificationData);

    res.status(201).json({
      message: 'Verification submitted successfully',
      data: verificationData
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/doctor/verification/status (optional: check own verification status)
router.get('/verification/status', async (req, res) => {
  // TODO: Implement lookup by authenticated doctor's ID
  res.json({ status: 'pending', message: 'Verification status lookup not yet implemented' });
});

export default router;
