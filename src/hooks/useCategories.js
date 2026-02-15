import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient";
import { CATEGORY_COLORS, getCategoryLabel as fallbackGetCategoryLabel } from "../components/shared/formatters";

const FALLBACK_CATEGORIES = ["mortgage", "gas", "car_payment", "phone_payment", "phone_bill", "car_insurance", "home_maintenance", "car_maintenance", "clothes", "haircut", "eating_out", "groceries", "subscriptions", "pay_back_taxes", "entertainment", "wants", "medical", "emergency", "hygiene", "life_insurance", "water_bill", "electric_bill", "internet_bill", "trash_bill", "miscellaneous_expenses", "amex_gold_fee", "car_registration", "w2_job", "va_benefits", "tax_refund", "side_job", "other_income", "mgib", "hysa", "individual_account", "traditional_ira", "roth_ira", "hsa", "mortgage_principal_payment", "uncategorized"];

// Fallback type mapping for when DB doesn't have type column yet
const FALLBACK_TYPE_MAP = {
  w2_job: 'income', va_benefits: 'income', tax_refund: 'income',
  side_job: 'income', other_income: 'income', mgib: 'income',
  hysa: 'savings', individual_account: 'savings', traditional_ira: 'savings',
  roth_ira: 'savings', hsa: 'savings', mortgage_principal_payment: 'savings',
};

export function useCategories() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.entities.Category.list("sort_order", 500),
    staleTime: 60000, // Cache for 1 minute
  });

  const hasDynamic = categories.length > 0;

  const categoryList = hasDynamic ? categories.map(c => c.name) : FALLBACK_CATEGORIES;

  const categoryColors = hasDynamic
    ? Object.fromEntries(categories.map(c => [c.name, c.color]))
    : CATEGORY_COLORS;

  const getCategoryLabel = (name) => {
    if (hasDynamic) {
      const cat = categories.find(c => c.name === name);
      if (cat) return cat.label;
    }
    return fallbackGetCategoryLabel(name);
  };

  const getCategoryType = (name) => {
    if (hasDynamic) {
      const cat = categories.find(c => c.name === name);
      if (cat && cat.type) return cat.type;
    }
    return FALLBACK_TYPE_MAP[name] || 'expense';
  };

  const categoriesByType = (() => {
    const grouped = { income: [], expense: [], savings: [] };
    const list = hasDynamic ? categories : FALLBACK_CATEGORIES.map(name => ({ name }));
    for (const item of list) {
      const name = typeof item === 'string' ? item : item.name;
      const type = getCategoryType(name);
      if (grouped[type]) grouped[type].push(name);
    }
    return grouped;
  })();

  return {
    categories,
    categoryList,
    categoryColors,
    getCategoryLabel,
    getCategoryType,
    categoriesByType,
    isLoading,
  };
}
