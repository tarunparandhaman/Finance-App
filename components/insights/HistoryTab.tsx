"use client";

import { useMemo } from "react";
import { Camera, Trash2 } from "lucide-react";
import NetWorthChart from "@/components/insights/NetWorthChart";
import { useFinanceStore } from "@/lib/store";
import { totalAssets, totalLiabilities } from "@/lib/valuation";
import { formatINR, formatPercent } from "@/lib/format";

export default function HistoryTab() {
  const holdings = useFinanceStore((s) => s.holdings);
  const liabilities = useFinanceStore((s) => s.liabilities);
  const fxRate = useFinanceStore((s) => s.fxRate);
  const snapshots = useFinanceStore((s) => s.snapshots);
  const takeSnapshot = useFinanceStore((s) => s.takeSnapshot);
  const deleteSnapshot = useFinanceStore((s) => s.deleteSnapshot);
  const usdInr = fxRate?.usdInr ?? 87;

  const sorted = useMemo(() => [...snapshots].sort((a, b) => b.date.localeCompare(a.date)), [snapshots]);

  const stats = useMemo(() => {
    if (snapshots.length < 2) return null;
    const chronological = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const first = chronological[0];
    const last = chronological[chronological.length - 1];
    const growth = last.netWorthInr - first.netWorthInr;
    const growthPercent = first.netWorthInr !== 0 ? (growth / Math.abs(first.netWorthInr)) * 100 : 0;

    let bestGain = -Infinity;
    let bestLabel = "";
    for (let i = 1; i < chronological.length; i++) {
      const gain = chronological[i].netWorthInr - chronological[i - 1].netWorthInr;
      if (gain > bestGain) {
        bestGain = gain;
        bestLabel = chronological[i].date;
      }
    }

    return { growth, growthPercent, bestGain, bestLabel, count: snapshots.length };
  }, [snapshots]);

  function handleSnapshot() {
    const assetsInr = totalAssets(holdings, usdInr);
    const liabilitiesInr = totalLiabilities(liabilities, usdInr);
    takeSnapshot(assetsInr, liabilitiesInr);
  }

  return (
    <div className="space-y-4 pb-8">
      <button
        onClick={handleSnapshot}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-ink md:w-auto md:px-6"
      >
        <Camera size={16} />
        Take snapshot of today&apos;s net worth
      </button>

      {snapshots.length === 0 ? (
        <div className="card border-dashed p-8 text-center text-sm text-muted">
          Take your first snapshot to start tracking net worth over time.
        </div>
      ) : (
        <div className="md:grid md:grid-cols-3 md:items-start md:gap-4">
          <div className="space-y-4 md:col-span-2">
            <div className="card p-4 md:p-6">
              <h3 className="mb-3 text-sm font-medium">Net worth over time</h3>
              <NetWorthChart snapshots={snapshots} />
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-3 md:p-4">
                  <div className="text-xs text-muted">Growth</div>
                  <div className={`text-sm font-semibold tabular-nums md:text-base ${stats.growth >= 0 ? "text-positive" : "text-negative"}`}>
                    {formatPercent(stats.growthPercent)}
                  </div>
                </div>
                <div className="card p-3 md:p-4">
                  <div className="text-xs text-muted">Best jump</div>
                  <div className="text-sm font-semibold tabular-nums text-positive md:text-base">{formatINR(stats.bestGain)}</div>
                </div>
                <div className="card p-3 md:p-4">
                  <div className="text-xs text-muted">Snapshots</div>
                  <div className="text-sm font-semibold tabular-nums md:text-base">{stats.count}</div>
                </div>
              </div>
            )}
          </div>

          <div className="card mt-4 p-4 md:mt-0 md:p-6">
            <h3 className="mb-3 text-sm font-medium">Snapshot history</h3>
            <div className="space-y-1">
              {sorted.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0">
                  <div>
                    <div>{s.date}</div>
                    <div className="text-xs text-muted">
                      Assets {formatINR(s.assetsInr)}
                      {s.liabilitiesInr > 0 && ` · Debts ${formatINR(s.liabilitiesInr)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{formatINR(s.netWorthInr)}</span>
                    <button
                      onClick={() => confirm("Delete this snapshot?") && deleteSnapshot(s.id)}
                      className="text-muted hover:text-negative"
                      aria-label="Delete snapshot"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
