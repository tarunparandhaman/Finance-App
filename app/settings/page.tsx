"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2, ShieldCheck } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useFinanceStore } from "@/lib/store";
import type { BackupData } from "@/lib/store";

export default function SettingsPage() {
  const holdings = useFinanceStore((s) => s.holdings);
  const liabilities = useFinanceStore((s) => s.liabilities);
  const transactions = useFinanceStore((s) => s.transactions);
  const snapshots = useFinanceStore((s) => s.snapshots);
  const targetAllocation = useFinanceStore((s) => s.targetAllocation);
  const fxRate = useFinanceStore((s) => s.fxRate);
  const restoreBackup = useFinanceStore((s) => s.restoreBackup);
  const clearAll = useFinanceStore((s) => s.clearAll);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const totalItems = holdings.length + liabilities.length + transactions.length + snapshots.length;

  function handleExport() {
    const payload: BackupData & { exportedAt: string } = {
      holdings,
      liabilities,
      transactions,
      snapshots,
      targetAllocation,
      fxRate,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.holdings)) throw new Error("Invalid file");
      restoreBackup(data as Partial<BackupData>);
      const count =
        (data.holdings?.length ?? 0) +
        (data.liabilities?.length ?? 0) +
        (data.transactions?.length ?? 0) +
        (data.snapshots?.length ?? 0);
      setMessage(`Imported ${count} items.`);
    } catch {
      setMessage("Couldn't read that file — make sure it's a backup exported from this app.");
    } finally {
      e.target.value = "";
      setTimeout(() => setMessage(null), 4000);
    }
  }

  function handleClear() {
    if (confirm("Delete all data? This can't be undone unless you have a backup exported.")) {
      clearAll();
      setMessage("All data cleared.");
      setTimeout(() => setMessage(null), 4000);
    }
  }

  return (
    <PageShell title="Settings">
      <div className="space-y-6">
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" />
            <div className="text-sm">
              <div className="font-medium">Your data stays on this device</div>
              <p className="mt-0.5 text-muted">
                Everything is stored in this browser&apos;s local storage — nothing is sent to a server.
                Clearing your browser data or switching devices/browsers will lose it, so back up regularly
                using export below.
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{message}</div>
        )}

        <div className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-muted">Backup</h2>
          <button
            onClick={handleExport}
            className="flex w-full items-center gap-3 card p-4 text-left"
          >
            <Download size={18} className="text-primary" />
            <div>
              <div className="text-sm font-medium">Export backup (.json)</div>
              <div className="text-xs text-muted">Save a copy of all {totalItems} items</div>
            </div>
          </button>
          <button
            onClick={handleImportClick}
            className="flex w-full items-center gap-3 card p-4 text-left"
          >
            <Upload size={18} className="text-primary" />
            <div>
              <div className="text-sm font-medium">Import backup</div>
              <div className="text-xs text-muted">Replaces current data with a backup file</div>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-muted">Danger zone</h2>
          <button
            onClick={handleClear}
            className="flex w-full items-center gap-3 rounded-xl border border-negative/30 bg-surface p-4 text-left"
          >
            <Trash2 size={18} className="text-negative" />
            <div>
              <div className="text-sm font-medium text-negative">Clear all data</div>
              <div className="text-xs text-muted">Delete every holding from this device</div>
            </div>
          </button>
        </div>
      </div>
    </PageShell>
  );
}
