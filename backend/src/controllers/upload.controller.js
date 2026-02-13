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

    // Validate file type
    const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.some(type => mimetype.includes(type)) && !originalname.endsWith('.csv')) {
      return res.status(400).json({
        error: true,
        message: 'Invalid file type',
        detail: 'Please upload a CSV file'
      });
    }

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

    // Store file temporarily
    uploadedFiles.set(fileId, {
      filename: originalname,
      content: buffer.toString('utf8'),
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
 * Extract and parse CSV data
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

    // Get uploaded file
    const uploadedFile = uploadedFiles.get(file_id);
    if (!uploadedFile) {
      return res.status(404).json({
        error: true,
        message: 'Uploaded file not found',
        detail: 'File may have expired. Please upload again.'
      });
    }

    // Parse CSV
    const { headers, data } = await csvService.parseCSV(uploadedFile.content);

    if (!headers || !data || data.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Empty or invalid CSV file'
      });
    }

    // Detect bank format
    const format = csvService.detectBankFormat(headers);

    // Extract transactions
    const transactions = csvService.extractTransactions(data, headers, parseInt(account_id));

    // Add import hashes
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
    if (!account_id) {
      return res.status(400).json({
        error: true,
        message: 'account_id is required'
      });
    }

    // Parse CSV
    const csvContent = req.file.buffer.toString('utf8');
    const { headers, data } = await csvService.parseCSV(csvContent);

    if (!headers || !data || data.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Empty or invalid CSV file'
      });
    }

    // Extract transactions
    const transactions = csvService.extractTransactions(data, headers, parseInt(account_id));

    // Check for duplicates
    const existingTx = dbService.list('transaction', { account_id }, { sort_by: '-date' }, 1000);
    const existingHashes = new Set(existingTx.map(t => t.import_hash).filter(Boolean));

    let imported = 0;
    let duplicates = 0;
    const batch = [];

    for (const tx of transactions) {
      const hash = csvService.generateHash(tx);

      if (existingHashes.has(hash)) {
        duplicates++;
        continue;
      }

      existingHashes.add(hash);
      batch.push({
        ...tx,
        import_hash: hash,
        is_reviewed: false,
        is_flagged: false,
        is_duplicate: false
      });

      imported++;
    }

    // Bulk insert if any valid transactions
    let insertedIds = [];
    if (batch.length > 0) {
      const result = dbService.bulkCreate('transaction', batch);
      insertedIds = result.ids;
    }

    res.status(201).json({
      imported,
      duplicates,
      total: data.length,
      ids: insertedIds
    });
  } catch (error) {
    next(error);
  }
};
