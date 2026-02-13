{
  "name": "Investment",
  "type": "object",
  "properties": {
    "symbol": {
      "type": "string",
      "description": "Ticker symbol"
    },
    "name": {
      "type": "string",
      "description": "Investment name"
    },
    "account_id": {
      "type": "string",
      "description": "Reference to Account entity"
    },
    "account_name": {
      "type": "string"
    },
    "asset_class": {
      "type": "string",
      "enum": [
        "us_stock",
        "intl_stock",
        "bond",
        "real_estate",
        "cash",
        "crypto",
        "commodity",
        "other"
      ],
      "description": "Asset class"
    },
    "shares": {
      "type": "number"
    },
    "cost_basis": {
      "type": "number",
      "description": "Total cost basis"
    },
    "current_value": {
      "type": "number"
    },
    "current_price": {
      "type": "number"
    },
    "gain_loss": {
      "type": "number"
    },
    "gain_loss_pct": {
      "type": "number"
    },
    "last_updated": {
      "type": "string",
      "format": "date"
    }
  },
  "required": [
    "symbol",
    "name"
  ]
}