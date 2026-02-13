{
  "name": "Transaction",
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "format": "date",
      "description": "Transaction date"
    },
    "merchant_raw": {
      "type": "string",
      "description": "Original merchant name from statement"
    },
    "merchant_clean": {
      "type": "string",
      "description": "Cleaned/normalized merchant name"
    },
    "amount": {
      "type": "number",
      "description": "Transaction amount (positive=income, negative=expense)"
    },
    "category": {
      "type": "string",
      "enum": [
        "housing",
        "transportation",
        "food_dining",
        "groceries",
        "utilities",
        "insurance",
        "healthcare",
        "debt_payments",
        "subscriptions",
        "entertainment",
        "shopping",
        "personal_care",
        "education",
        "travel",
        "gifts_donations",
        "investments",
        "savings",
        "income_salary",
        "income_freelance",
        "income_investment",
        "income_other",
        "transfer",
        "refund",
        "fee",
        "uncategorized"
      ],
      "default": "uncategorized"
    },
    "subcategory": {
      "type": "string"
    },
    "account_id": {
      "type": "string",
      "description": "Reference to Account entity"
    },
    "account_name": {
      "type": "string"
    },
    "type": {
      "type": "string",
      "enum": [
        "income",
        "expense",
        "transfer",
        "refund"
      ],
      "default": "expense"
    },
    "is_recurring": {
      "type": "boolean",
      "default": false
    },
    "is_duplicate": {
      "type": "boolean",
      "default": false
    },
    "is_transfer": {
      "type": "boolean",
      "default": false
    },
    "transfer_pair_id": {
      "type": "string",
      "description": "ID of the matching transfer transaction"
    },
    "is_reviewed": {
      "type": "boolean",
      "default": false
    },
    "is_flagged": {
      "type": "boolean",
      "default": false
    },
    "flag_reason": {
      "type": "string"
    },
    "notes": {
      "type": "string"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "import_hash": {
      "type": "string",
      "description": "Hash for duplicate detection"
    }
  },
  "required": [
    "date",
    "amount"
  ]
}