{
  "name": "Account",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Account name (e.g., AMEX Platinum, USAA Checking)"
    },
    "institution": {
      "type": "string",
      "enum": [
        "AMEX",
        "USAA",
        "Abound Credit Union",
        "PayPal Savings",
        "Fidelity",
        "Schwab",
        "Other"
      ],
      "description": "Financial institution"
    },
    "account_type": {
      "type": "string",
      "enum": [
        "checking",
        "savings",
        "credit_card",
        "brokerage",
        "retirement_401k",
        "retirement_ira",
        "hsa",
        "loan",
        "mortgage",
        "other"
      ],
      "description": "Type of account"
    },
    "balance": {
      "type": "number",
      "description": "Current balance"
    },
    "currency": {
      "type": "string",
      "default": "USD"
    },
    "is_asset": {
      "type": "boolean",
      "default": true,
      "description": "True if asset, false if liability"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    },
    "last_synced": {
      "type": "string",
      "format": "date-time"
    },
    "account_number_last4": {
      "type": "string",
      "description": "Last 4 digits of account number"
    },
    "color": {
      "type": "string",
      "description": "Display color for charts"
    },
    "notes": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "account_type"
  ]
}