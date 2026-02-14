import React, { useState, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import moment from "moment";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import CategoryBreakdown from "../components/dashboard/CategoryBreakdown";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import AccountsSummary from "../components/dashboard/AccountsSummary";
import IncomeBreakdown from "../components/dashboard/IncomeBreakdown";
import { formatCurrency } from "../components/shared/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FILTER_MODES = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "ytd", label: "Year to Date" },
  { value: "year", label: "Specific Year" },
];

function getDateRange(mode, year) {
  const now = moment();
  switch (mode) {
    case "this_month":
      return {
        startDate: now.clone().startOf("month").format("YYYY-MM-DD"),
        endDate: now.clone().endOf("month").format("YYYY-MM-DD"),
      };
    case "last_month": {
      const last = now.clone().subtract(1, "month");
      return {
        startDate: last.startOf("month").format("YYYY-MM-DD"),
        endDate: last.endOf("month").format("YYYY-MM-DD"),
      };
    }
    case "ytd":
      return {
        startDate: now.clone().startOf("year").format("YYYY-MM-DD"),
        endDate: now.clone().endOf("month").format("YYYY-MM-DD"),
      };
    case "year":
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
    default:
      return {
        startDate: now.clone().startOf("month").format("YYYY-MM-DD"),
        endDate: now.clone().endOf("month").format("YYYY-MM-DD"),
      };
  }
}

export default function Dashboard() {
  const currentYear = moment().format("YYYY");
  const [filterMode, setFilterMode] = useState("this_month");
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { startDate, endDate } = useMemo(
    () => getDateRange(filterMode, selectedYear),
    [filterMode, selectedYear]
  );

  // Fetch report data for the selected period
  const { data: cashFlowData = [], isLoading: loadingReport } = useQuery({
    queryKey: ["cash-flow", startDate, endDate],
    queryFn: () => apiClient.getCashFlow(startDate, endDate, "month"),
  });

  // Available years for the year dropdown
  const { data: availableYears = [] } = useQuery({
    queryKey: ["report-years"],
    queryFn: () => apiClient.getReportYears(),
  });

  const { data: accounts = [], isLoading: loadingAcc } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ["nw-snapshots"],
    queryFn: () => apiClient.entities.NetWorthSnapshot.list("-date", 2),
  });

  // Fetch recent transactions for the sub-components
  const { data: transactions = [] } = useQuery({
    queryKey: ["dashboard-transactions"],
    queryFn: () => apiClient.entities.Transaction.list("-date", 200),
  });

  // Aggregate totals from report data
  const totals = useMemo(() => {
    const income = cashFlowData.reduce((s, d) => s + d.income, 0);
    const expenses = cashFlowData.reduce((s, d) => s + d.expenses, 0);
    const savings = cashFlowData.reduce((s, d) => s + d.savings, 0);
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    return { income, expenses, savings, savingsRate };
  }, [cashFlowData]);

  // Calculate live net worth from active accounts only (matching NetWorth page)
  const activeAssets = accounts.filter(a => a.is_asset !== false && a.is_active !== false);
  const activeLiabilities = accounts.filter(a => a.is_asset === false && a.is_active !== false);
  const totalAssets = activeAssets.reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = activeLiabilities.reduce((s, a) => s + (a.balance || 0), 0);
  const liveNetWorth = totalAssets - totalLiabilities;

  const netWorth = liveNetWorth;
  const lastSnapshotNW = snapshots[0]?.net_worth;
  const nwChange = lastSnapshotNW != null ? netWorth - lastSnapshotNW : null;
  const nwTrend = lastSnapshotNW ? (nwChange / Math.abs(lastSnapshotNW)) * 100 : null;

  const isLoading = loadingReport || loadingAcc;

  const filterLabel = FILTER_MODES.find(m => m.value === filterMode)?.label || "This Month";
  const yearOptions = availableYears.length > 0 ? availableYears : [currentYear];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`${filterLabel}${filterMode === "year" ? ` ${selectedYear}` : ""} overview`} />

      {/* Global Date Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {FILTER_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setFilterMode(mode.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterMode === mode.value
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        {filterMode === "year" && (
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Net Worth" value={formatCurrency(netWorth)} icon={DollarSign} trend={nwTrend} trendLabel="vs last snapshot" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
          <StatCard label="Income" value={formatCurrency(totals.income)} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard label="Expenses" value={formatCurrency(totals.expenses)} icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-500" />
          <StatCard label="Savings Rate" value={`${totals.savingsRate.toFixed(1)}%`} icon={PiggyBank} iconBg="bg-amber-50" iconColor="text-amber-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CashFlowChart data={cashFlowData} isLoading={loadingReport} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          <IncomeBreakdown transactions={transactions} startDate={startDate} endDate={endDate} />
          <CategoryBreakdown transactions={transactions} startDate={startDate} endDate={endDate} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} />
        </div>
        <AccountsSummary accounts={accounts} />
      </div>
    </div>
  );
}
