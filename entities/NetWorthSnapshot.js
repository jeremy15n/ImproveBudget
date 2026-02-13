{
  "name": "NetWorthSnapshot",
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "format": "date"
    },
    "total_assets": {
      "type": "number"
    },
    "total_liabilities": {
      "type": "number"
    },
    "net_worth": {
      "type": "number"
    },
    "accounts_breakdown": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "account_id": {
            "type": "string"
          },
          "account_name": {
            "type": "string"
          },
          "balance": {
            "type": "number"
          }
        }
      }
    },
    "month": {
      "type": "string",
      "description": "YYYY-MM format"
    }
  },
  "required": [
    "date",
    "net_worth"
  ]
}