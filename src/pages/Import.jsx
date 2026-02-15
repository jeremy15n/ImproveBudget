import React from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Shield, RefreshCw, FileSpreadsheet } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import CsvImporter from "../components/import/CsvImporter";

export default function Import() {
  const qc = useQueryClient();
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });

  return (
    <div>
      <PageHeader title="Import Data" subtitle="Bring in your financial data from banks and brokerages" icon={Upload} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CsvImporter accounts={accounts} onImportComplete={() => qc.invalidateQueries({ queryKey: ["transactions"] })} />
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Security</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">All uploads are stored locally so YOU own YOUR data!</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Duplicate Detection</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Our system generates a unique fingerprint for each transaction using date + amount + merchant. Duplicate imports are automatically skipped.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Supported Formats</h3>
            </div>
            <ul className="text-xs text-slate-500 space-y-1.5 mt-2">
              <li>• <strong>AMEX</strong> — Download CSV/XLSX from activity page</li>
              <li>• <strong>USAA</strong> — Export transactions as CSV</li>
              <li>• <strong>Abound CU</strong> — Download statement CSV</li>
              <li>• <strong>PayPal</strong> — Export activity to CSV</li>
              <li>• <strong>Fidelity</strong> — Download positions or activity</li>
              <li>• <strong>Schwab</strong> — Export from transactions tab</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}