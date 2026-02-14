import React from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";
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

export default function Dashboard() {
  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiClient.entities.Transaction.list("-date", 500),
  });

  const { data: accounts = [], isLoading: loadingAcc } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ["nw-snapshots"],
    queryFn: () => apiClient.entities.NetWorthSnapshot.list("-date", 2),
  });

  const currentMonth = moment().format("YYYY-MM");
  const monthTx = transactions.filter((t) => moment(t.date).format("YYYY-MM") === currentMonth && t.type !== "transfer");
  const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const netWorth = snapshots[0]?.net_worth ?? accounts.reduce((s, a) => s + (a.is_asset !== false ? (a.balance || 0) : -(a.balance || 0)), 0);
  const prevNetWorth = snapshots[1]?.net_worth;
  const nwTrend = prevNetWorth ? ((netWorth - prevNetWorth) / Math.abs(prevNetWorth)) * 100 : null;

  const isLoading = loadingTx || loadingAcc;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`${moment().format("MMMM YYYY")} overview`} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Net Worth" value={formatCurrency(netWorth)} icon={DollarSign} trend={nwTrend} trendLabel="vs last month" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
          <StatCard label="Income" value={formatCurrency(income)} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard label="Expenses" value={formatCurrency(expenses)} icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-500" />
          <StatCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} icon={Percent} iconBg="bg-amber-50" iconColor="text-amber-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CashFlowChart transactions={transactions} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          <IncomeBreakdown transactions={transactions} />
          <CategoryBreakdown transactions={transactions} />
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