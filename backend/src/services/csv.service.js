import Papa from 'papaparse';

/**
 * CSV Service for parsing bank exports and detecting formats
 */
export class CSVService {
  /**
   * Parse CSV content
   * @param {string} csvContent - CSV file content
   * @returns {object} {headers, data}
   */
  parseCSV(csvContent) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          resolve({
            headers: results.meta.fields,
            data: results.data
          });
        },
        error: (error) => {
          reject(new Error(`CSV parse error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Detect bank format from CSV headers
   * @param {array} headers - CSV headers
   * @returns {string} Bank format identifier or 'unknown'
   */
  detectBankFormat(headers) {
    if (!Array.isArray(headers)) {
      return 'unknown';
    }

    const headerStr = headers.join('|').toLowerCase();

    // AMEX format detection
    if (headerStr.includes('posting date') && headerStr.includes('reference')) {
      return 'amex';
    }

    // USAA format detection
    if (headerStr.includes('transaction date') && headerStr.includes('posting date')) {
      return 'usaa';
    }

    // PayPal Savings format detection
    if (headerStr.includes('date') && headerStr.includes('name') && headerStr.includes('net')) {
      return 'paypal';
    }

    // Abound Credit Union format detection
    if (headerStr.includes('transaction date') && headerStr.includes('description') && headerStr.includes('amount')) {
      return 'abound';
    }

    // Fidelity format detection (investments)
    if (headerStr.includes('symbol') && headerStr.includes('quantity') && headerStr.includes('price')) {
      return 'fidelity';
    }

    // Schwab format detection (investments)
    if (headerStr.includes('symbol') && headerStr.includes('shares') && headerStr.includes('price')) {
      return 'schwab';
    }

    return 'unknown';
  }

  /**
   * Extract transaction data from CSV based on detected format
   * @param {array} csvData - Parsed CSV data
   * @param {array} headers - CSV headers
   * @param {number} accountId - Account ID to assign transactions to
   * @returns {array} Array of normalized transactions
   */
  extractTransactions(csvData, headers, accountId) {
    const format = this.detectBankFormat(headers);
    const transactions = [];

    if (format === 'unknown') {
      throw new Error('Unable to detect bank CSV format. Supported: AMEX, USAA, PayPal, Abound, Fidelity, Schwab');
    }

    for (const row of csvData) {
      try {
        const transaction = this.normalizeTransaction(row, headers, format, accountId);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn(`Skipping row due to error: ${error.message}`);
        continue;
      }
    }

    return transactions;
  }

  /**
   * Normalize a single transaction row to standard format
   * @param {object} row - CSV row
   * @param {array} headers - CSV headers
   * @param {string} format - Detected format
   * @param {number} accountId - Account ID
   * @returns {object} Normalized transaction or null if invalid
   */
  normalizeTransaction(row, headers, format, accountId) {
    let transaction = null;

    switch (format) {
      case 'amex':
        transaction = this.parseAmex(row);
        break;
      case 'usaa':
        transaction = this.parseUSAA(row);
        break;
      case 'paypal':
        transaction = this.parsePayPal(row);
        break;
      case 'abound':
        transaction = this.parseAbound(row);
        break;
      default:
        return null;
    }

    if (!transaction) {
      return null;
    }

    // Add account reference
    transaction.account_id = accountId;
    transaction.merchant_clean = transaction.merchant_clean || transaction.merchant_raw || '';

    // Ensure required fields
    if (!transaction.date || transaction.amount === undefined) {
      return null;
    }

    // Normalize date to ISO 8601
    transaction.date = this.normalizeDate(transaction.date);

    return transaction;
  }

  /**
   * Parse AMEX format
   */
  parseAmex(row) {
    if (!row['Posting Date'] || !row['Amount']) {
      return null;
    }

    return {
      date: row['Posting Date'],
      merchant_raw: row['Description'] || '',
      amount: parseFloat(row['Amount']),
      type: parseFloat(row['Amount']) > 0 ? 'payment' : 'expense',
      category: 'uncategorized'
    };
  }

  /**
   * Parse USAA format
   */
  parseUSAA(row) {
    if (!row['Transaction Date'] || !row['Amount']) {
      return null;
    }

    return {
      date: row['Transaction Date'],
      merchant_raw: row['Description'] || '',
      amount: parseFloat(row['Amount']),
      type: parseFloat(row['Amount']) > 0 ? 'income' : 'expense',
      category: 'uncategorized'
    };
  }

  /**
   * Parse PayPal Savings format
   */
  parsePayPal(row) {
    if (!row['Date'] || row['Net'] === undefined) {
      return null;
    }

    return {
      date: row['Date'],
      merchant_raw: row['Name'] || 'PayPal',
      amount: parseFloat(row['Net']),
      type: parseFloat(row['Net']) > 0 ? 'income' : 'expense',
      category: 'uncategorized'
    };
  }

  /**
   * Parse Abound Credit Union format
   */
  parseAbound(row) {
    if (!row['Transaction Date'] || !row['Amount']) {
      return null;
    }

    return {
      date: row['Transaction Date'],
      merchant_raw: row['Description'] || '',
      amount: parseFloat(row['Amount']),
      type: parseFloat(row['Amount']) > 0 ? 'income' : 'expense',
      category: 'uncategorized'
    };
  }

  /**
   * Normalize date to ISO 8601 format (YYYY-MM-DD)
   * @param {string} dateStr - Date string in various formats
   * @returns {string} ISO 8601 date
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;

    // Try parsing as ISO date first
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // Return ISO date without time
      return date.toISOString().split('T')[0];
    }

    // Try MM/DD/YYYY format
    const mdy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mdy) {
      const [_, m, d, y] = mdy;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    // Try DD/MM/YYYY format
    const dmy = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dmy) {
      const [_, d, m, y] = dmy;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    return dateStr; // Return as-is if can't parse
  }

  /**
   * Generate import hash for duplicate detection
   * Same algorithm as frontend CsvImporter.jsx
   * @param {object} transaction - Transaction object
   * @returns {string} Hash string
   */
  generateHash(transaction) {
    const str = `${transaction.date}|${transaction.amount}|${(transaction.merchant_raw || '')}`.toLowerCase().trim();
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }
}

export default new CSVService();
