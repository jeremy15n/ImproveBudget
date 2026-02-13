import express from 'express';
import multer from 'multer';
import { uploadFile, extractData, importTransactions } from '../controllers/upload.controller.js';

const router = express.Router();

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 10485760) // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Only allow CSV and Excel files
    const validMimes = ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const validExtensions = ['.csv', '.xls', '.xlsx'];

    const isValidMime = validMimes.some(mime => file.mimetype.includes(mime));
    const isValidExtension = validExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

    if (isValidMime || isValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a CSV or Excel file.'));
    }
  }
});

/**
 * File upload endpoint
 * POST /api/upload
 * Returns file_id for use with /extract
 */
router.post('/upload', upload.single('file'), uploadFile);

/**
 * Extract data from uploaded file
 * POST /api/extract
 * Body: { file_id: string, account_id: number }
 * Returns parsed transactions
 */
router.post('/extract', extractData);

/**
 * Import transactions (combined upload + extract + save)
 * POST /api/import
 * Form data: file (multipart), account_id (form field)
 * Returns import results
 */
router.post('/import', upload.single('file'), importTransactions);

export default router;
