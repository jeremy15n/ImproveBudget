{
  "name": "FinancialGoal",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Goal name"
    },
    "target_amount": {
      "type": "number"
    },
    "current_amount": {
      "type": "number",
      "default": 0
    },
    "target_date": {
      "type": "string",
      "format": "date"
    },
    "category": {
      "type": "string",
      "enum": [
        "emergency_fund",
        "retirement",
        "fi_number",
        "house",
        "car",
        "vacation",
        "debt_payoff",
        "education",
        "other"
      ]
    },
    "is_active": {
      "type": "boolean",
      "default": true
    },
    "monthly_contribution": {
      "type": "number",
      "default": 0
    },
    "notes": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "target_amount"
  ]
}