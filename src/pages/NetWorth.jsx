import React, { useState, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Plus, TrendingUp, LineChart, RefreshCw, TrendingDown, Filter, Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from "moment";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import NetWorthProjector from "../components/networth/NetWorthProjector";
import { formatCurrency } from "../components/shared/formatters";
import EmptyState from "../components/shared/EmptyState";

export default function NetWorth() {
  const qc = useQueryClient();
  const [selectedYear, setSelectedYear] = useState("all");

  const { data: snapshots = [] } = useQuery({
    queryKey: ["nw-snapshots"],
    queryFn: () => apiClient.entities.NetWorthSnapshot.list("date"),
  });
  
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });
  
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiClient.entities.Transaction.list("-date", 500),
  });

  const syncBalancesMut = useMutation({
    mutationFn: () => apiClient.post('/accounts/sync-balances', { 
      date: moment().format("YYYY-MM-DD") 
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["nw-snapshots"] });
    },
  });

  const isTrue = (val) => val === 1 || val === true || val === "true";
  const isFalse = (val) => val === 0 || val === false || val === "false";

  const assets = accounts.filter(a => isTrue(a.is_asset) && !isFalse(a.is_active));
  const liabilities = accounts.filter(a => isFalse(a.is_asset) && !isFalse(a.is_active));

  const availableYears = useMemo(() => {
    const years = new Set(snapshots.map(s => moment(s.date).format("YYYY")));
    const currentYear = moment().format("YYYY");
    years.add(currentYear); 
    return Array.from(years).sort().reverse();
  }, [snapshots]);

  const chartData = useMemo(() => {
    let data = snapshots;
    
    if (selectedYear !== "all") {
      data = snapshots.filter(s => moment(s.date).format("YYYY") === selectedYear);
    }

    return data.map(s => ({
      date: moment(s.date).format(selectedYear === "all" ? "MMM D, YY" : "MMM D"),
      fullDate: moment(s.date).format("MMMM D, YYYY"),
      netWorth: s.net_worth,
      assets: s.total_assets,
      liabilities: s.total_liabilities,
    }));
  }, [snapshots, selectedYear]);

  const latest = snapshots[snapshots.length - 1];
  const totalAssets = assets.reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + (a.balance || 0), 0);
  const currentNW = totalAssets - totalLiabilities;

  const lastSnapshotNW = latest?.net_worth;
  const nwChange = lastSnapshotNW ? currentNW - lastSnapshotNW : null;
  const nwChangePct = lastSnapshotNW ? (nwChange / Math.abs(lastSnapshotNW)) * 100 : null;

  const currentMonth = moment().format("YYYY-MM");
  const monthTx = transactions.filter((t) => moment(t.date).format("YYYY-MM") === currentMonth && t.type !== "transfer");
  const monthlyIncome = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div>
      <PageHeader
        title="Net Worth"
        subtitle="Track your wealth over time"
        icon={LineChart}
        actions={<>
          <Button onClick={() => syncBalancesMut.mutate()} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500" disabled={syncBalancesMut.isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncBalancesMut.isPending ? "animate-spin" : ""}`} />
            {syncBalancesMut.isPending ? "Syncing..." : "Sync Balances"}
          </Button>
        </>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard 
          label="Net Worth" 
          value={formatCurrency(currentNW)} 
          icon={LineChart} 
          trend={nwChangePct} 
          trendLabel={latest ? `vs last snapshot` : 'Start tracking today'} 
          iconBg="bg-indigo-100 dark:bg-indigo-500/10" 
          iconColor="text-indigo-600 dark:text-indigo-400" 
        />
        <StatCard 
          label="Total Assets" 
          value={formatCurrency(totalAssets)} 
          icon={Wallet} 
          iconBg="bg-emerald-100 dark:bg-emerald-500/10" 
          iconColor="text-emerald-600 dark:text-emerald-400" 
        />
        <StatCard 
          label="Total Liabilities" 
          value={formatCurrency(totalLiabilities)} 
          icon={CreditCard} 
          iconBg="bg-rose-100 dark:bg-rose-500/10" 
          iconColor="text-rose-600 dark:text-rose-400" 
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Net Worth History</h3>
          
          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                <Filter className="w-3 h-3 mr-2 text-slate-400" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:opacity-10" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: "#94a3b8" }} 
                axisLine={false} 
                tickLine={false}
                tickMargin={10}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: "#94a3b8" }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => formatCurrency(v, true)} 
              />
              <Tooltip 
                labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                formatter={(v) => [formatCurrency(v), "Net Worth"]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} 
              />
              <Area 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#6366f1" 
                strokeWidth={3} 
                fill="url(#nwGrad)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
            <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No snapshots recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Sync Balances" to create your first snapshot.</p>
          </div>
        )}
      </div>

      {/* Asset / Liability Breakdown - DARK MODE & COLOR FIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Assets */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Asset Breakdown
            </h3>
            <span className="text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">{assets.length} Accounts</span>
          </div>
          
          {assets.length === 0 ? <p className="text-sm text-slate-400">No asset accounts found.</p> : (
            <div className="space-y-3">
              {assets.map(a => (
                <div key={a.id} className="flex items-center justify-between group">
                  <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{a.name}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(a.balance || 0)}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total Assets</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Liabilities */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                Liability Breakdown
            </h3>
            <span className="text-xs font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-full">{liabilities.length} Accounts</span>
          </div>

          {liabilities.length === 0 ? <p className="text-sm text-slate-400">No liability accounts found.</p> : (
            <div className="space-y-3">
              {liabilities.map(a => (
                <div key={a.id} className="flex items-center justify-between group">
                  <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{a.name}</span>
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(a.balance || 0)}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total Liabilities</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalLiabilities)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <NetWorthProjector currentNetWorth={currentNW} monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} />
    </div>
  );
}