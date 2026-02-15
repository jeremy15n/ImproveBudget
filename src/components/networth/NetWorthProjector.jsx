import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calculator, ChevronDown, ChevronUp, TrendingUp, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "../shared/formatters";
import { Button } from "@/components/ui/button";

export default function NetWorthProjector({ currentNetWorth, monthlyIncome, monthlyExpenses }) {
  const [years, setYears] = useState(10);
  const [returnRate, setReturnRate] = useState(7);
  const [expenseReduction, setExpenseReduction] = useState(0);
  const [additionalSavings, setAdditionalSavings] = useState(0);
  const [showTable, setShowTable] = useState(false);

  // Base Calculation
  const currentMonthlySavings = Math.max(0, monthlyIncome - monthlyExpenses);
  const optimizedMonthlySavings = currentMonthlySavings + expenseReduction + additionalSavings;

  const data = useMemo(() => {
    const points = [];
    
    let nwCurrent = currentNetWorth;
    let nwOptimized = currentNetWorth;
    
    let contribCurrent = currentMonthlySavings;
    let contribOptimized = optimizedMonthlySavings;

    const currentYear = new Date().getFullYear();

    // Initial Point
    points.push({
      year: currentYear,
      current: Math.round(nwCurrent),
      optimized: Math.round(nwOptimized),
      gap: 0
    });

    for (let i = 1; i <= years; i++) {
      // Calculate 12 months of growth + contribution
      for (let m = 0; m < 12; m++) {
        // Current Path
        nwCurrent += contribCurrent;
        nwCurrent *= (1 + (returnRate / 100) / 12);

        // Optimized Path
        nwOptimized += contribOptimized;
        nwOptimized *= (1 + (returnRate / 100) / 12);
      }

      points.push({
        year: currentYear + i,
        current: Math.round(nwCurrent),
        optimized: Math.round(nwOptimized),
        gap: Math.round(nwOptimized - nwCurrent)
      });
    }
    return points;
  }, [currentNetWorth, currentMonthlySavings, optimizedMonthlySavings, years, returnRate]);

  const endCurrent = data[data.length - 1].current;
  const endOptimized = data[data.length - 1].optimized;
  const difference = endOptimized - endCurrent;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Net Worth Projection</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Compare your current trajectory vs. optimized plan</p>
          </div>
        </div>
        
        {/* Big Impact Number */}
        {difference > 0 && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-2 rounded-xl">
            <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">Potential Gain</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">+{formatCurrency(difference)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Section 1: Assumptions */}
          <div className="space-y-5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Market Assumptions</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Time Horizon</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">{years} Years</span>
              </div>
              <Slider value={[years]} onValueChange={(v) => setYears(v[0])} min={1} max={40} step={1} className="py-2" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Annual Return</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">{returnRate}%</span>
              </div>
              <Slider value={[returnRate]} onValueChange={(v) => setReturnRate(v[0])} min={1} max={15} step={0.5} className="py-2" />
            </div>
          </div>

          {/* Section 2: Optimization Inputs */}
          <div className="space-y-5">
            <h4 className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <div className="h-px bg-indigo-200 dark:bg-indigo-900 flex-1"></div>
              Optimization Strategy
              <div className="h-px bg-indigo-200 dark:bg-indigo-900 flex-1"></div>
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Reduce Monthly Expenses</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">+{formatCurrency(expenseReduction)}</span>
              </div>
              <Slider value={[expenseReduction]} onValueChange={(v) => setExpenseReduction(v[0])} min={0} max={2000} step={50} className="py-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Additional Monthly Income</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">+{formatCurrency(additionalSavings)}</span>
              </div>
              <Slider value={[additionalSavings]} onValueChange={(v) => setAdditionalSavings(v[0])} min={0} max={5000} step={100} className="py-2" />
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Current Monthly Save</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatCurrency(currentMonthlySavings)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">Optimized Monthly Save</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(optimizedMonthlySavings)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Projected Difference</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(difference)}</span>
            </div>
          </div>
        </div>

        {/* CHART COLUMN */}
        <div className="lg:col-span-2 h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:opacity-10" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12, fill: "#94a3b8" }} 
                axisLine={false} 
                tickLine={false}
                tickMargin={10} 
              />
              <YAxis 
                tick={{ fontSize: 11, fill: "#94a3b8" }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                formatter={(v, name) => [
                  formatCurrency(v), 
                  name === 'optimized' ? 'Optimized Plan' : 'Current Path'
                ]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} 
              />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">{value === 'optimized' ? 'Optimized Plan' : 'Current Path'}</span>}
              />
              
              {/* Current Path (Grey/Muted) */}
              <Area 
                type="monotone" 
                dataKey="current" 
                name="current"
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                fill="url(#currentGrad)" 
              />

              {/* Optimized Path (Indigo/Vibrant) */}
              <Area 
                type="monotone" 
                dataKey="optimized" 
                name="optimized"
                stroke="#6366f1" 
                strokeWidth={3} 
                fill="url(#optGrad)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* YEARLY BREAKDOWN TABLE */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowTable(!showTable)}
          className="w-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {showTable ? "Hide Breakdown" : "View Breakdown Table"}
          {showTable ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
        </Button>

        {showTable && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Current Trajectory</th>
                  <th className="px-4 py-3 text-indigo-600 dark:text-indigo-400">Optimized Plan</th>
                  <th className="px-4 py-3 text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {data.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{row.year}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatCurrency(row.current)}</td>
                    <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency(row.optimized)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">+{formatCurrency(row.gap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}