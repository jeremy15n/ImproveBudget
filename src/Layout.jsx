import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, PieChart, TrendingUp,
  Target, LineChart, Upload, Settings, BookOpen, Menu, X, ChevronRight,
  Palette, Sun, Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
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
        
        /* Dark Mode Overrides */
        .dark {
          --accent: #818cf8; 
          --accent-light: #6366f1;
          --accent-dark: #a5b4fc;
          --surface: #0f172a; /* slate-900 */
          --surface-hover: #1e293b; /* slate-800 */
          --text-primary: #f8fafc; /* slate-50 */
          --text-secondary: #94a3b8; /* slate-400 */
          --text-muted: #64748b; /* slate-500 */
          --border: #1e293b; /* slate-800 */
        }
      `}</style>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 px-4 h-14 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        </button>
        
        {/* LOGO: Mobile Center */}
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="BetterBudget" 
            className="h-10 w-auto object-contain"
          />
        </div>
        
        <div className="w-9" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setSidebarOpen(false)}>
          <div className="w-72 h-full bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <SidebarContent currentPageName={currentPageName} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 z-40 transition-colors duration-300">
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
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 flex items-center justify-between">
        {/* LOGO: Sidebar Header */}
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="BetterBudget" 
            className="h-20 w-auto object-contain" 
          />
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
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
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500")} />
              <span>{item.name}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-400 dark:text-indigo-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
         {/* Theme Toggle Button */}
         <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 mb-2"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
         >
            {theme === "dark" ? (
               <>
                  <Sun className="w-4 h-4 mr-2" /> Light Mode
               </>
            ) : (
               <>
                  <Moon className="w-4 h-4 mr-2" /> Dark Mode
               </>
            )}
         </Button>

        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/50">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Data Secured</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">All data is locally stored.</p>
        </div>
      </div>
    </div>
  );
}