import React, { useState, useCallback } from "react";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Check, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CsvImporter({ accounts, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState("idle"); // idle, uploading, processing, done, error
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const generateHash = (tx) => {
    const str = `${tx.date}|${tx.amount}|${tx.merchant_raw || ""}`.toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash.toString(36);
  };

  const handleImport = async () => {
    if (!file || !accountId) return;
    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("account_id", accountId);

      setStatus("processing");

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const response = await fetch(`${baseUrl}/import`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Import failed");
      }

      setStatus("done");
      setResults({ imported: data.imported, duplicates: data.duplicates, total: data.total });
      if (onImportComplete) onImportComplete();
    } catch (error) {
      setStatus("error");
      setResults({ error: error.message });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Import CSV / Excel</h3>
      <p className="text-xs text-slate-500 mb-6">Upload bank statements in CSV or XLSX format. Our AI will automatically parse and categorize your transactions.</p>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>Account</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger><SelectValue placeholder="Select account to import into" /></SelectTrigger>
            <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.institution})</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors">
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" id="csv-upload" />
          <label htmlFor="csv-upload" className="cursor-pointer">
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-slate-700">{file.name}</span>
                <Badge variant="secondary" className="text-xs">Ready</Badge>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Click to upload CSV or Excel file</p>
                <p className="text-xs text-slate-400 mt-1">Supports AMEX, USAA, Abound, PayPal, Fidelity, Schwab exports</p>
              </div>
            )}
          </label>
        </div>

        <Button onClick={handleImport} disabled={!file || !accountId || status === "uploading" || status === "processing"} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {status === "uploading" || status === "processing" ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{status === "uploading" ? "Uploading..." : "Processing with AI..."}</>
          ) : "Import Transactions"}
        </Button>

        {status === "done" && results && (
          <div className="bg-emerald-50 rounded-xl p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Import complete</p>
              <p className="text-xs text-emerald-600 mt-1">{results.imported} transactions imported · {results.duplicates} duplicates skipped · {results.total} total rows</p>
            </div>
          </div>
        )}

        {status === "error" && results && (
          <div className="bg-red-50 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Import failed</p>
              <p className="text-xs text-red-600 mt-1">{results.error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}