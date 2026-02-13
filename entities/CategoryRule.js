{
  "name": "CategoryRule",
  "type": "object",
  "properties": {
    "match_pattern": {
      "type": "string",
      "description": "Text pattern to match against merchant name"
    },
    "match_type": {
      "type": "string",
      "enum": [
        "contains",
        "starts_with",
        "exact",
        "regex"
      ],
      "default": "contains"
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
      ]
    },
    "merchant_clean_name": {
      "type": "string",
      "description": "Clean merchant name to apply"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    },
    "priority": {
      "type": "number",
      "default": 0,
      "description": "Higher priority rules are applied first"
    }
  },
  "required": [
    "match_pattern",
    "category"
  ]
}