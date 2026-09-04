"use client";

import Link from "next/link";

type MetricCardProps = {
  label: string;
  value: string;
  tone?: "indigo" | "blue" | "emerald" | "slate";
};

function MetricCard({ label, value, tone = "slate" }: MetricCardProps) {
  const tones: Record<NonNullable<MetricCardProps["tone"]>, string> = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
          placeholder
        </div>
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  widthClass,
}: {
  label: string;
  value: string;
  widthClass: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 ${widthClass}`} />
      </div>
    </div>
  );
}

export const Dashboard = ({data}:{data:any}) => {
  return (
    <section className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
              Dashboard
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Overview
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Tasks" value={data.totalTasks} tone="indigo" />
          <MetricCard label="Open Tasks" value={data.open} tone="blue" />
          <MetricCard label="Closed" value={data.closed} tone="emerald" />
          <MetricCard label="On Hold" value={data.onHold} tone="slate" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.85fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniBar label="Metric 05" value="72" widthClass="w-[72%]" />
            <MiniBar label="Metric 06" value="41" widthClass="w-[41%]" />
            <MiniBar label="Metric 07" value="58" widthClass="w-[58%]" />
            <MiniBar label="Metric 08" value="33" widthClass="w-[33%]" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Metric 09" value="15" tone="indigo" />
            <MetricCard label="Metric 10" value="03" tone="emerald" />
            <MetricCard label="Metric 11" value="21" tone="blue" />
            <MetricCard label="Metric 12" value="08" tone="slate" />
          </div>
        </div>
      </div>
    </section>
  );
};
