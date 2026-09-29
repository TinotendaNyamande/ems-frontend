"use client";

import { useEffect, useMemo, useState } from "react";
import { GetSLAForTask, parseUtc, type SLADto } from "@/services/tasks";

type Props = {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
};

function formatDate(value?: string | Date) {
  if (!value) return "N/A";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

/**
 * Format a duration (in ms) into a human-readable string.
 * Always includes seconds. Examples: "3d 4h 12m 05s", "5h 03m 20s", "42s"
 */
function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "—";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0)
    return `${days}d ${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  if (hours > 0)
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  if (minutes > 0)
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

export default function SlaModal({ taskId, open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SLADto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ticks every second while the modal is open so "ongoing" durations update live.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open || !taskId) return;
    setLoading(true);
    setError(null);
    GetSLAForTask(taskId)
      .then((d) => setData(d))
      .catch((e) => setError(e?.message || "Failed to load SLA"))
      .finally(() => setLoading(false));
  }, [open, taskId]);

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // Reset state when modal closes so next open starts fresh.
  useEffect(() => {
    if (!open) {
      setData(null);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const hasOngoing = useMemo(
    () => Boolean(data?.some((s) => !s.endTime)),
    [data]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">SLA History</h3>
          </div>
          <button
            type="button"
            aria-label="Close SLA"
            onClick={onClose}
            className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="text-sm text-slate-600">Loading SLA...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-slate-600">No SLA entries found.</p>
          ) : (
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Comments</th>
                  <th className="px-3 py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s, idx) => {
                  const start = s.startTime ? parseUtc(s.startTime) : null;
                  const end = s.endTime ? parseUtc(s.endTime) : null;

                  const isOngoing = !end;
                  const effectiveEnd = end ?? new Date(now);

                  const durationMs =
                    start && !Number.isNaN(start.getTime())
                      ? effectiveEnd.getTime() - start.getTime()
                      : null;

                  return (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 align-top text-slate-900">
                        {s.userName}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-900">
                        {s.status}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {s.comments}
                      </td>
                      <td className="px-3 py-2 align-top tabular-nums text-slate-700">
                        {durationMs != null ? formatDuration(durationMs) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}