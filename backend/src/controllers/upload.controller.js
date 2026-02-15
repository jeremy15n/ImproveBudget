import csvService from '../services/csv.service.js';
import dbService from '../services/database.service.js';

// Store uploaded files in memory temporarily
const uploadedFiles = new Map();

/**
 * Handle file upload
 * POST /api/upload
 */
export const uploadFile = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file provided'
      });
    }

    const { originalname, size, mimetype, buffer } = req.file;

    // Validate file size (10MB max)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || 10485760);
    if (size > maxSize) {
      return res.status(400).json({
        error: true,
        message: 'File too large',
        detail: `Maximum size is ${maxSize / 1024 / 1024}MB`
      });
    }

    // Generate file ID
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store raw buffer (needed for XLSX) and filename
    uploadedFiles.set(fileId, {
      filename: originalname,
      buffer: buffer,
      mimetype,
      size,
      uploadedAt: new Date()
    });

    // Auto-cleanup after 1 hour
    setTimeout(() => {
      uploadedFiles.delete(fileId);
    }, 3600000);

    res.status(201).json({
      file_id: fileId,
      filename: originalname,
      size,
      mimetype
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Extract and parse CSV/XLSX data
 * POST /api/extract
 */
export const extractData = async (req, res, next) => {
  try {
    const { file_id, account_id } = req.body;

    if (!file_id || !account_id) {
      return res.status(400).json({
        error: true,
        message: 'file_id and account_id are required'
      });
    }

    const uploadedFile = uploadedFiles.get(file_id);
    if (!uploadedFile) {
      return res.status(404).json({
        error: true,
        message: 'Uploaded file not found',
        detail: 'File may have expired. Please upload again.'
      });
    }

    const { headers, data } = await csvService.parseFile(uploadedFile.buffer, uploadedFile.filename);

    if (!headers || !data || data.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Empty or invalid file'
      });
    }

    const format = csvService.detectBankFormat(headers);
    const transactions = csvService.extractTransactions(data, headers, parseInt(account_id));

    const transactionsWithHashes = transactions.map(tx => ({
      ...tx,
      import_hash: csvService.generateHash(tx)
    }));

    res.json({
      rows: transactionsWithHashes,
      total: transactionsWithHashes.length,
      format_detected: format
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import transactions (upload + extract + save in one call)
 * POST /api/import
 */
export const importTransactions = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file provided'
      });
    }

    const { account_id } = req.body;
    const parsedAccountId = account_id ? parseInt(account_id) : null;

    // Parse file (CSV or XLSX)
    const { headers, data } = await csvService.parseFile(req.file.buffer, req.file.originalname);

    if (!headers || !data || data.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Empty or invalid file'
      });
    }

    // Extract transactions
    const transactions = csvService.extractTransactions(data, headers, parsedAccountId);

    // Prepare batch for insert (no duplicate checking)
    const batch = transactions.map(tx => ({
      ...tx,
      import_hash: csvService.generateHash(tx),
      is_reviewed: false,
      is_flagged: false,
      is_duplicate: false
    }));

    // Bulk insert all transactions
    let insertedIds = [];
    if (batch.length > 0) {
      const result = dbService.bulkCreate('transaction', batch);
      insertedIds = result.ids;
    }

    res.status(201).json({
      imported: batch.length,
      duplicates: 0,
      total: data.length,
      ids: insertedIds
    });
  } catch (error) {
    next(error);
  }
};
