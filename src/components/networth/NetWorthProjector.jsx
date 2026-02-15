import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "../shared/formatters";
import { Calculator, TrendingUp } from "lucide-react";

export default function NetWorthProjector({ currentNetWorth, monthlyIncome, monthlyExpenses }) {
  const currentSavingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  const currentMonthlySavings = monthlyIncome - monthlyExpenses;

  const [projectionYears, setProjectionYears] = useState(10);
  const [additionalSavings, setAdditionalSavings] = useState(0);
  const [expenseReduction, setExpenseReduction] = useState(0);
  const [annualReturn, setAnnualReturn] = useState(7);

  const projectionData = useMemo(() => {
    const data = [];
    const monthlyReturn = annualReturn / 100 / 12;
    
    // Current trajectory
    let currentNW = currentNetWorth;
    let optimizedNW = currentNetWorth;
    let aggressiveNW = currentNetWorth;

    // Calculate optimized monthly savings
    const optimizedMonthlySavings = currentMonthlySavings + additionalSavings + expenseReduction;
    const aggressiveMonthlySavings = currentMonthlySavings + (additionalSavings * 2) + (expenseReduction * 1.5);

    for (let year = 0; year <= projectionYears; year++) {
      data.push({
        year: new Date().getFullYear() + year,
        current: Math.round(currentNW),
        optimized: Math.round(optimizedNW),
        aggressive: Math.round(aggressiveNW),
      });

      // Project next year (12 months of compounding + monthly contributions)
      for (let month = 0; month < 12; month++) {
        currentNW = currentNW * (1 + monthlyReturn) + currentMonthlySavings;
        optimizedNW = optimizedNW * (1 + monthlyReturn) + optimizedMonthlySavings;
        aggressiveNW = aggressiveNW * (1 + monthlyReturn) + aggressiveMonthlySavings;
      }
    }

    return data;
  }, [currentNetWorth, currentMonthlySavings, additionalSavings, expenseReduction, annualReturn, projectionYears]);

  const finalOptimized = projectionData[projectionData.length - 1]?.optimized || 0;
  const finalCurrent = projectionData[projectionData.length - 1]?.current || 0;
  const difference = finalOptimized - finalCurrent;

  const optimizedSavingsRate = monthlyIncome > 0 ? ((currentMonthlySavings + additionalSavings + expenseReduction) / monthlyIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Net Worth Projections</h3>
            <p className="text-xs text-slate-500">Model different financial scenarios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="text-xs">Projection Years</Label>
            <Input type="number" min="1" max="50" value={projectionYears} onChange={(e) => setProjectionYears(parseInt(e.target.value) || 10)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Additional Monthly Savings ($)</Label>
            <Input type="number" min="0" step="100" value={additionalSavings} onChange={(e) => setAdditionalSavings(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Expense Reduction ($)</Label>
            <Input type="number" min="0" step="50" value={expenseReduction} onChange={(e) => setExpenseReduction(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Expected Annual Return (%)</Label>
            <div className="flex items-center gap-2">
              <Slider value={[annualReturn]} onValueChange={(v) => setAnnualReturn(v[0])} min={0} max={15} step={0.5} className="flex-1" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-10">{annualReturn}%</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, true)} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="current" stroke="#94a3b8" strokeWidth={2} dot={false} name="Current Trajectory" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="optimized" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Optimized Plan" />
            <Line type="monotone" dataKey="aggressive" stroke="#10b981" strokeWidth={2} dot={false} name="Aggressive Savings" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Current Trajectory</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{formatCurrency(finalCurrent)}</p>
          <p className="text-xs text-slate-500">in {projectionYears} years</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Savings rate: <span className="font-semibold">{currentSavingsRate.toFixed(1)}%</span></p>
        </Card>

        <Card className="p-5 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-medium text-indigo-700">Optimized Plan</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900 mb-1">{formatCurrency(finalOptimized)}</p>
          <p className="text-xs text-indigo-600">in {projectionYears} years</p>
          <p className="text-xs text-indigo-700 mt-2">Savings rate: <span className="font-semibold">{optimizedSavingsRate.toFixed(1)}%</span></p>
          <p className="text-xs font-semibold text-indigo-600 mt-3">+{formatCurrency(difference)} better</p>
        </Card>

        <Card className="p-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Current Monthly Savings:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(currentMonthlySavings)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">+ Additional Savings:</span>
              <span className="font-semibold text-emerald-600">+{formatCurrency(additionalSavings)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">+ Expense Cuts:</span>
              <span className="font-semibold text-emerald-600">+{formatCurrency(expenseReduction)}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">New Monthly Savings:</span>
              <span className="font-bold text-indigo-600">{formatCurrency(currentMonthlySavings + additionalSavings + expenseReduction)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-3">
              At {annualReturn}% annual return, compounding monthly
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}