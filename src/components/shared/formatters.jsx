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
  housing: "#6366f1",
  transportation: "#8b5cf6",
  food_dining: "#ec4899",
  groceries: "#f43f5e",
  utilities: "#f59e0b",
  insurance: "#14b8a6",
  healthcare: "#10b981",
  debt_payments: "#ef4444",
  subscriptions: "#a855f7",
  entertainment: "#f97316",
  shopping: "#3b82f6",
  personal_care: "#d946ef",
  education: "#0ea5e9",
  travel: "#06b6d4",
  gifts_donations: "#84cc16",
  investments: "#22c55e",
  savings: "#10b981",
  income_salary: "#22c55e",
  income_freelance: "#16a34a",
  income_investment: "#059669",
  income_other: "#047857",
  transfer: "#94a3b8",
  refund: "#64748b",
  fee: "#dc2626",
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