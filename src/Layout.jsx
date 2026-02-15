import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, PieChart, TrendingUp,
  Target, LineChart, Upload, Settings, BookOpen, Menu, X, ChevronRight,
  DollarSign, Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Transactions", icon: ArrowLeftRight, page: "Transactions" },
  { name: "Accounts & Assets", icon: Wallet, page: "Accounts" },
  { name: "Budget", icon: PieChart, page: "Budget" },
  { name: "Investments", icon: TrendingUp, page: "Investments" },
  { name: "Net Worth", icon: LineChart, page: "NetWorth" },
  { name: "Goals", icon: Target, page: "Goals" },
  { name: "Import", icon: Upload, page: "Import" },
  { name: "Rules", icon: Settings, page: "Rules" },
  { name: "Categories", icon: Palette, page: "Categories" }, 
  { name: "Docs", icon: BookOpen, page: "Documentation" },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <style>{`
        :root {
          --accent: #6366f1;
          --accent-light: #818cf8;
          --accent-dark: #4f46e5;
          --surface: #ffffff;
          --surface-hover: #f1f5f9;
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --text-muted: #94a3b8;
          --border: #e2e8f0;
          --success: #10b981;
          --danger: #ef4444;
          --warning: #f59e0b;
        }
      `}</style>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 h-14 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors">
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">BetterBudget</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setSidebarOpen(false)}>
          <div className="w-72 h-full bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <SidebarContent currentPageName={currentPageName} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200/60 z-40">
        <SidebarContent currentPageName={currentPageName} />
      </div>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarContent({ currentPageName, onClose }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-lg">BetterBudget</h1>
            <p className="text-[11px] text-slate-400 -mt-0.5">Personal Finance</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 lg:hidden">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-indigo-600" : "text-slate-400")} />
              <span>{item.name}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60">
        <p className="text-xs font-medium text-slate-700">Data Secured</p>
        <p className="text-[11px] text-slate-500 mt-0.5">All data is locally stored.</p>
      </div>
    </div>
  );
}