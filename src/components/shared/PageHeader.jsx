import React from "react";

export default function PageHeader({ title, subtitle, actions = null, icon: Icon = null, iconBg = "bg-indigo-50 dark:bg-indigo-500/10", iconColor = "text-indigo-600 dark:text-indigo-400" }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-indigo-400 tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}