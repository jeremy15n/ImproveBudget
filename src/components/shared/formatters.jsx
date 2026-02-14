export function formatCurrency(amount, compact = false) {
  if (amount === null || amount === undefined) return "$0.00";
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value) {
  if (value === null || value === undefined) return "0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getCategoryLabel(cat) {
  if (!cat) return "Uncategorized";
  return cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export const CATEGORY_COLORS = {
  // Expenses
  mortgage: "#6366f1",
  gas: "#8b5cf6",
  car_payment: "#a855f7",
  phone_payment: "#d946ef",
  phone_bill: "#ec4899",
  car_insurance: "#f43f5e",
  home_maintenance: "#ef4444",
  car_maintenance: "#dc2626",
  clothes: "#f97316",
  haircut: "#f59e0b",
  eating_out: "#eab308",
  groceries: "#84cc16",
  subscriptions: "#14b8a6",
  pay_back_taxes: "#06b6d4",
  entertainment: "#0ea5e9",
  wants: "#3b82f6",
  medical: "#10b981",
  emergency: "#ef4444",
  hygiene: "#d946ef",
  life_insurance: "#14b8a6",
  water_bill: "#0ea5e9",
  electric_bill: "#f59e0b",
  internet_bill: "#8b5cf6",
  trash_bill: "#64748b",
  miscellaneous_expenses: "#94a3b8",
  amex_gold_fee: "#f59e0b",
  car_registration: "#6366f1",
  // Income
  w2_job: "#22c55e",
  va_benefits: "#16a34a",
  tax_refund: "#059669",
  side_job: "#047857",
  other_income: "#10b981",
  mgib: "#34d399",
  // Savings
  hysa: "#6366f1",
  individual_account: "#818cf8",
  traditional_ira: "#a78bfa",
  roth_ira: "#c084fc",
  hsa: "#e879f9",
  mortgage_principal_payment: "#8b5cf6",
  // System
  uncategorized: "#cbd5e1",
};

export const INSTITUTION_COLORS = {
  AMEX: "#006FCF",
  USAA: "#003366",
  "Abound Credit Union": "#2563eb",
  "PayPal Savings": "#003087",
  Fidelity: "#4a8c2a",
  Schwab: "#00a0df",
  Other: "#94a3b8",
};