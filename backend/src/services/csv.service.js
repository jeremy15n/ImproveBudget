import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * CSV/XLSX Service for parsing bank exports
 * Handles multiple bank formats with flexible column mapping
 */
export class CSVService {
  /**
   * Parse file content (CSV or XLSX)
   */
  async parseFile(content, filename) {
    const ext = (filename || '').toLowerCase().split('.').pop();

    if (ext === 'xlsx' || ext === 'xls') {
      return this.parseXLSX(content);
    }

    const csvStr = typeof content === 'string' ? content : content.toString('utf8');
    return this.parseCSV(csvStr);
  }

  /**
   * Parse CSV content
   */
  parseCSV(csvContent) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          // Filter out metadata rows (rows where most cells are empty)
          const filtered = results.data.filter(row => {
            const values = Object.values(row);
            const nonEmpty = values.filter(v => v && String(v).trim()).length;
            return nonEmpty >= 2; // At least 2 non-empty cells
          });

          resolve({
            headers: results.meta.fields,
            data: filtered
          });
        },
        error: (error) => {
          reject(new Error(`CSV parse error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Parse XLSX/XLS content
   */
  parseXLSX(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to array of arrays first to find header row
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Find the header row (row with most non-empty cells and common header keywords)
    let headerRowIndex = -1;
    let maxScore = 0;
    const headerKeywords = ['date', 'amount', 'description', 'merchant', 'debit', 'credit', 'transaction'];

    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (!Array.isArray(row)) continue;

      const nonEmpty = row.filter(cell => cell && String(cell).trim()).length;
      const hasKeywords = row.filter(cell => {
        const str = String(cell).toLowerCase();
        return headerKeywords.some(kw => str.includes(kw));
      }).length;

      const score = nonEmpty + (hasKeywords * 3);
      if (score > maxScore && nonEmpty >= 3) {
        maxScore = score;
        headerRowIndex = i;
      }
    }

    if (headerRowIndex === -1) headerRowIndex = 0;

    // Parse with detected header row
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      range: headerRowIndex,
      defval: '',
      raw: false
    });

    if (jsonData.length === 0) {
      return { headers: [], data: [] };
    }

    const headers = Object.keys(jsonData[0]);

    // Convert and clean data
    const data = jsonData.map(row => {
      const converted = {};
      for (const [key, value] of Object.entries(row)) {
        if (value instanceof Date) {
          converted[key] = value.toISOString().split('T')[0];
        } else {
          converted[key] = String(value).trim();
        }
      }
      return converted;
    }).filter(row => {
      // Filter out rows that are mostly empty
      const values = Object.values(row);
      const nonEmpty = values.filter(v => v && v !== '').length;
      return nonEmpty >= 2;
    });

    return { headers, data };
  }

  /**
   * Detect bank format from headers
   */
  detectBankFormat(headers) {
    if (!Array.isArray(headers)) return 'generic';

    const headerStr = headers.join('|').toLowerCase();

    // Abound Credit Union: has "post date", "debit", "credit"
    if (headerStr.includes('post date') && headerStr.includes('debit') && headerStr.includes('credit')) {
      return 'abound';
    }

    // AMEX: has "extended details", "appears on your statement"
    if (headerStr.includes('extended details') || headerStr.includes('appears on your statement')) {
      return 'amex';
    }

    // USAA: has "original description" and "category"
    if (headerStr.includes('original description') && headerStr.includes('category')) {
      return 'usaa';
    }

    // PayPal Savings
    if (headerStr.includes('date') && headerStr.includes('name') && headerStr.includes('net')) {
      return 'paypal';
    }

    return 'generic';
  }

  /**
   * Extract transactions
   */
  extractTransactions(csvData, headers, accountId) {
    const format = this.detectBankFormat(headers);
    const transactions = [];

    for (const row of csvData) {
      try {
        const transaction = this.normalizeTransaction(row, headers, format, accountId);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn(`Skipping row: ${error.message}`);
        continue;
      }
    }

    if (transactions.length === 0 && csvData.length > 0) {
      throw new Error(
        `Could not extract any valid transactions. Found columns: ${headers.join(', ')}. ` +
        `Ensure your file has columns for date, amount/debit/credit, and description.`
      );
    }

    return transactions;
  }

  /**
   * Normalize transaction
   */
  normalizeTransaction(row, headers, format, accountId) {
    let transaction = null;

    switch (format) {
      case 'abound':
        transaction = this.parseAbound(row);
        break;
      case 'amex':
        transaction = this.parseAmex(row);
        break;
      case 'usaa':
        transaction = this.parseUSAA(row);
        break;
      case 'paypal':
        transaction = this.parsePayPal(row);
        break;
      case 'generic':
        transaction = this.parseGeneric(row, headers);
        break;
      default:
        return null;
    }

    if (!transaction) return null;

    transaction.account_id = accountId;
    transaction.merchant_clean = transaction.merchant_clean || transaction.merchant_raw || '';

    if (!transaction.date || transaction.amount === undefined || isNaN(transaction.amount)) {
      return null;
    }

    transaction.date = this.normalizeDate(transaction.date);
    return transaction;
  }

  /**
   * Parse Abound Credit Union format
   * Columns: Account Number | Post Date | Check | Description | Debit | Credit | Status | Balance
   */
  parseAbound(row) {
    const date = row['Post Date'] || row['Date'];
    const debit = this.parseAmount(row['Debit'] || '0');
    const credit = this.parseAmount(row['Credit'] || '0');

    if (!date || (debit === 0 && credit === 0)) return null;

    // Credit is positive (money in), Debit is negative (money out)
    const amount = credit - debit;

    return {
      date: date,
      merchant_raw: row['Description'] || '',
      amount: amount,
      type: amount > 0 ? 'income' : 'expense',
      category: 'uncategorized'
    };
  }

  /**
   * Parse AMEX format
   * Columns: Date | Description | Amount | Extended Details | Appears On Your Statement As | Address | City/State | Zip Code | Country | Reference | Category
   */
  parseAmex(row) {
    const date = row['Date'];
    const rawAmount = this.parseAmount(row['Amount']);

    if (!date || isNaN(rawAmount)) return null;

    // Use Description or fall back to "Appears On Your Statement As"
    const description = row['Description'] || row['Appears On Your Statement As'] || '';

    // AMEX: positive amounts = charges (expenses), negative = payments/credits
    // Negate so charges become negative (app convention: negative = expense)
    const amount = -rawAmount;

    return {
      date: date,
      merchant_raw: description,
      amount: amount,
      type: amount < 0 ? 'expense' : 'income',
      category: row['Category'] || 'uncategorized'
    };
  }

  /**
   * Parse USAA format
   * Columns: Date | Description | Original Description | Category | Amount | Status
   */
  parseUSAA(row) {
    const date = row['Date'];
    const amount = this.parseAmount(row['Amount']);

    if (!date || isNaN(amount)) return null;

    // Use Original Description, fallback to Description
    const description = row['Original Description'] || row['Description'] || '';

    return {
      date: date,
      merchant_raw: description,
      amount: amount,
      type: amount > 0 ? 'income' : 'expense',
      category: row['Category'] || 'uncategorized'
    };
  }

  /**
   * Parse PayPal format
   */
  parsePayPal(row) {
    if (!row['Date'] || row['Net'] === undefined) return null;
    return {
      date: row['Date'],
      merchant_raw: row['Name'] || 'PayPal',
      amount: parseFloat(row['Net']),
      type: parseFloat(row['Net']) > 0 ? 'income' : 'expense',
      category: 'uncategorized'
    };
  }

  /**
   * Generic parser - auto-detects columns
   */
  parseGeneric(row, headers) {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());

    // Find date column
    const datePatterns = ['date', 'transaction date', 'posting date', 'trans date', 'posted date', 'post date'];
    const dateCol = this.findColumn(headers, lowerHeaders, datePatterns);

    // Find description column
    const descPatterns = ['description', 'merchant', 'name', 'memo', 'payee', 'details', 'narrative', 'original description'];
    const descCol = this.findColumn(headers, lowerHeaders, descPatterns);

    // Find category column (optional)
    const catPatterns = ['category', 'type', 'class'];
    const catCol = this.findColumn(headers, lowerHeaders, catPatterns);

    if (!dateCol) return null;

    // Try to find amount - check for single amount column or debit/credit columns
    let amount = 0;

    // Check for single amount column
    const amountPatterns = ['amount', 'total', 'net', 'sum', 'value'];
    const amountCol = this.findColumn(headers, lowerHeaders, amountPatterns);

    if (amountCol && row[amountCol]) {
      amount = this.parseAmount(row[amountCol]);
    } else {
      // Check for debit/credit columns
      const debitPatterns = ['debit', 'withdrawal', 'debits', 'charge'];
      const creditPatterns = ['credit', 'deposit', 'credits'];
      const debitCol = this.findColumn(headers, lowerHeaders, debitPatterns);
      const creditCol = this.findColumn(headers, lowerHeaders, creditPatterns);

      const debit = debitCol && row[debitCol] ? this.parseAmount(row[debitCol]) : 0;
      const credit = creditCol && row[creditCol] ? this.parseAmount(row[creditCol]) : 0;

      amount = credit - debit;
    }

    if (isNaN(amount) || amount === 0) return null;

    return {
      date: row[dateCol],
      merchant_raw: descCol ? (row[descCol] || '') : '',
      amount: amount,
      type: amount > 0 ? 'income' : 'expense',
      category: catCol ? (row[catCol] || 'uncategorized') : 'uncategorized'
    };
  }

  /**
   * Find column by patterns
   */
  findColumn(headers, lowerHeaders, patterns) {
    // Exact match
    for (const pattern of patterns) {
      const idx = lowerHeaders.indexOf(pattern);
      if (idx !== -1) return headers[idx];
    }

    // Partial match
    for (const pattern of patterns) {
      const idx = lowerHeaders.findIndex(h => h.includes(pattern));
      if (idx !== -1) return headers[idx];
    }

    return null;
  }

  /**
   * Parse amount - handles currency symbols, commas, parentheses
   */
  parseAmount(raw) {
    if (raw === undefined || raw === null || raw === '') return 0;
    let str = String(raw).trim();

    // Handle parentheses as negative
    const isNeg = str.startsWith('(') && str.endsWith(')');
    if (isNeg) str = str.slice(1, -1);

    // Remove currency symbols and commas
    str = str.replace(/[$€£¥,\s]/g, '');

    let val = parseFloat(str);
    if (isNaN(val)) return 0;
    if (isNeg) val = -val;
    return val;
  }

  /**
   * Normalize date to ISO 8601
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;

    // Try direct parse
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // MM/DD/YYYY
    const mdy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mdy) {
      const [_, m, d, y] = mdy;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    // DD-MM-YYYY
    const dmy = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dmy) {
      const [_, d, m, y] = dmy;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    return dateStr;
  }

  /**
   * Generate import hash for duplicate detection
   */
  generateHash(transaction) {
    const str = `${transaction.date}|${transaction.amount}|${(transaction.merchant_raw || '')}`.toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash.toString(36);
  }
}

export default new CSVService();
