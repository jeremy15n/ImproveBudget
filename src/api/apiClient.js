/**
 * Generic API Client
 * Provides a unified interface for all data operations
 * Compatible with the entity-based pattern used throughout the app
 */

class Entity {
  constructor(name, baseUrl) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.endpoint = `${baseUrl}/${this.getEndpointName()}`;
  }

  getEndpointName() {
    // Convert camelCase to lowercase (e.g., CategoryRule -> categoryrule)
    return this.name.toLowerCase();
  }

  async request(method, url, body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async list(sortField, limit) {
    const params = new URLSearchParams();
    if (sortField) {
      params.append('sort_by', sortField.replace(/^-/, ''));
      params.append('sort_order', sortField.startsWith('-') ? 'desc' : 'asc');
    }
    if (limit) {
      params.append('limit', limit);
    }
    const url = `${this.endpoint}?${params.toString()}`;
    return this.request('GET', url);
  }

  async listPaginated(page = 1, limit = 50, sortField, filters = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (sortField) {
      params.append('sort_by', sortField.replace(/^-/, ''));
      params.append('sort_order', sortField.startsWith('-') ? 'desc' : 'asc');
    }
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.append(key, value);
      }
    }
    const url = `${this.endpoint}?${params.toString()}`;
    return this.request('GET', url);
  }

  async filter(conditions, sortField, limit) {
    const params = new URLSearchParams();
    
    // Add filter conditions
    for (const [key, value] of Object.entries(conditions)) {
      params.append(key, value);
    }

    if (sortField) {
      params.append('sort_by', sortField.replace(/^-/, ''));
      params.append('sort_order', sortField.startsWith('-') ? 'desc' : 'asc');
    }
    if (limit) {
      params.append('limit', limit);
    }

    const url = `${this.endpoint}?${params.toString()}`;
    return this.request('GET', url);
  }

  async create(data) {
    return this.request('POST', this.endpoint, data);
  }

  async update(id, data) {
    const url = `${this.endpoint}/${id}`;
    return this.request('PUT', url, data);
  }

  async delete(id) {
    const url = `${this.endpoint}/${id}`;
    return this.request('DELETE', url);
  }

  async bulkCreate(items) {
    const url = `${this.endpoint}/bulk`;
    return this.request('POST', url, { items });
  }

  async bulkUpdate(ids, data) {
    const url = `${this.endpoint}/bulk-update`;
    return this.request('PUT', url, { ids, data });
  }

  async bulkDelete(ids) {
    const url = `${this.endpoint}/bulk-delete`;
    return this.request('POST', url, { ids });
  }
}

class APIClient {
  constructor(baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api') {
    this.baseUrl = baseUrl;
    this.entities = {
      Transaction: new Entity('Transaction', this.baseUrl),
      Account: new Entity('Account', this.baseUrl),
      Category: new Entity('Category', this.baseUrl),
      CategoryRule: new Entity('CategoryRule', this.baseUrl),
      NetWorthSnapshot: new Entity('NetWorthSnapshot', this.baseUrl),
      Investment: new Entity('Investment', this.baseUrl),
      FinancialGoal: new Entity('FinancialGoal', this.baseUrl),
      Budget: new Entity('Budget', this.baseUrl),
    };
  }

  async request(method, url, body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    // Ensure the URL is absolute
    const absoluteUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    const response = await fetch(absoluteUrl, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }


  setBaseUrl(baseUrl) {
    this.baseUrl = baseUrl;
    // Reinitialize entities with new base URL
    this.entities = {
      Transaction: new Entity('Transaction', this.baseUrl),
      Account: new Entity('Account', this.baseUrl),
      Category: new Entity('Category', this.baseUrl),
      CategoryRule: new Entity('CategoryRule', this.baseUrl),
      NetWorthSnapshot: new Entity('NetWorthSnapshot', this.baseUrl),
      Investment: new Entity('Investment', this.baseUrl),
      FinancialGoal: new Entity('FinancialGoal', this.baseUrl),
      Budget: new Entity('Budget', this.baseUrl),
    };
  }

  async getCashFlow(startDate, endDate, interval = 'month') {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (interval) params.append('interval', interval);
    return this.request('GET', `/reports/cash-flow?${params.toString()}`);
  }

  async getReportYears() {
    return this.request('GET', '/reports/years');
  }

  async refreshInvestmentPrices() {
    return this.request('POST', '/investments/refresh');
  }

  async getInvestmentQuote(symbol) {
    return this.request('GET', `/investments/quote/${symbol}`);
  }

  async post(url, body) {
    return this.request('POST', url, body);
  }
}

export const apiClient = new APIClient();
