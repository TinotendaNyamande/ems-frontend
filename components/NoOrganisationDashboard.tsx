"use client";

import Link from "next/link";

export function NoOrganisation() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
              <path d="M12 8v5" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
              No organisation
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              This workspace does not have an organisation yet.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Create or join an organisation before managing email accounts, categories, or task
              assignments.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
