{
  "name": "Budget",
  "type": "object",
  "properties": {
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
        "fee",
        "uncategorized"
      ],
      "description": "Budget category"
    },
    "monthly_limit": {
      "type": "number",
      "description": "Monthly budget limit"
    },
    "month": {
      "type": "string",
      "description": "Month in YYYY-MM format"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    },
    "rollover": {
      "type": "boolean",
      "default": false,
      "description": "Rollover unused budget to next month"
    },
    "notes": {
      "type": "string"
    }
  },
  "required": [
    "category",
    "monthly_limit"
  ]
}