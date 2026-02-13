import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Plus, TrendingUp, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import NetWorthProjector from "../components/networth/NetWorthProjector";
import { formatCurrency } from "../components/shared/formatters";

export default function NetWorth() {
  const qc = useQueryClient();
  const { data: snapshots = [] } = useQuery({
    queryKey: ["nw-snapshots"],
    queryFn: () => base44.entities.NetWorthSnapshot.list("date"),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => base44.entities.Account.list(),
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.list("-date", 500),
  });

  const snapshotMut = useMutation({
    mutationFn: (d) => base44.entities.NetWorthSnapshot.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nw-snapshots"] }),
  });

  const takeSnapshot = () => {
    const totalAssets = accounts.filter(a => a.is_asset !== false && a.is_active !== false).reduce((s, a) => s + (a.balance || 0), 0);
    const totalLiabilities = accounts.filter(a => a.is_asset === false && a.is_active !== false).reduce((s, a) => s + (a.balance || 0), 0);
    snapshotMut.mutate({
      date: moment().format("YYYY-MM-DD"),
      month: moment().format("YYYY-MM"),
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_worth: totalAssets - totalLiabilities,
      accounts_breakdown: accounts.filter(a => a.is_active !== false).map(a => ({ account_id: a.id, account_name: a.name, balance: a.balance || 0 })),
    });
  };

  const chartData = useMemo(() => {
    return snapshots.map(s => ({
      date: moment(s.date).format("MMM YY"),
      netWorth: s.net_worth,
      assets: s.total_assets,
      liabilities: s.total_liabilities,
    }));
  }, [snapshots]);

  const latest = snapshots[snapshots.length - 1];
  const previous = snapshots[snapshots.length - 2];
  const currentNW = latest?.net_worth ?? accounts.reduce((s, a) => s + (a.is_asset !== false ? (a.balance || 0) : -(a.balance || 0)), 0);
  const prevNW = previous?.net_worth;
  const nwChange = prevNW ? currentNW - prevNW : null;
  const nwChangePct = prevNW ? (nwChange / Math.abs(prevNW)) * 100 : null;

  const assets = accounts.filter(a => a.is_asset !== false && a.is_active !== false);
  const liabilities = accounts.filter(a => a.is_asset === false && a.is_active !== false);
  const totalAssets = assets.reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + (a.balance || 0), 0);

  // Calculate monthly income and expenses for projections
  const currentMonth = moment().format("YYYY-MM");
  const monthTx = transactions.filter((t) => moment(t.date).format("YYYY-MM") === currentMonth && t.type !== "transfer");
  const monthlyIncome = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div>
      <PageHeader
        title="Net Worth"
        subtitle="Track your wealth over time"
        actions={<Button onClick={takeSnapshot} className="bg-indigo-600 hover:bg-indigo-700" disabled={snapshotMut.isPending}><Camera className="w-4 h-4 mr-2" />Take Snapshot</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Net Worth" value={formatCurrency(currentNW)} icon={TrendingUp} trend={nwChangePct} trendLabel="vs last snapshot" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <StatCard label="Total Assets" value={formatCurrency(totalAssets)} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Total Liabilities" value={formatCurrency(totalLiabilities)} icon={TrendingUp} iconBg="bg-red-50" iconColor="text-red-500" />
      </div>

      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Net Worth Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, true)} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={2.5} fill="url(#nwGrad)" name="Net Worth" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <NetWorthProjector currentNetWorth={currentNW} monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-emerald-700 mb-4">Assets</h3>
          {assets.length === 0 ? <p className="text-sm text-slate-400">No asset accounts</p> : (
            <div className="space-y-3">
              {assets.map(a => (
                <div key={a.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{a.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(a.balance || 0)}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Total Assets</span>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-red-600 mb-4">Liabilities</h3>
          {liabilities.length === 0 ? <p className="text-sm text-slate-400">No liability accounts</p> : (
            <div className="space-y-3">
              {liabilities.map(a => (
                <div key={a.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{a.name}</span>
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(a.balance || 0)}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Total Liabilities</span>
                <span className="text-sm font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}