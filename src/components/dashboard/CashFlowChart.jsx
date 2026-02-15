import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "../shared/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export default function CashFlowChart({ data, isLoading }) {
  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-2xl" />;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 h-full">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-6">Cash Flow</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:opacity-10" />
          
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "#94a3b8" }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "#94a3b8" }} 
            tickFormatter={(v) => `$${v/1000}k`} 
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => formatCurrency(value)}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
          
          {/* INCOME (Green) */}
          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          
          {/* EXPENSES (Red) */}
          <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          
          {/* SAVINGS (Indigo) - Restored */}
          <Bar dataKey="savings" name="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}