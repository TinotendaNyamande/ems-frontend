"use client";

import Link from "next/link";

export const NoOrganisation = () => {
  return (
    <section className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-8h6v8" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                You are not in an organisation yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                Create a new organisation to start managing team email, or apply to join an existing one
                if your company already uses this system.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/organisation/create"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  Create an organisation
                </Link>
                <Link
                  href="/organisation/join"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  Apply to join one
                </Link>
                <Link
                  href="/organisation/my-join-requests"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  View join requests
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                If you believe this is a mistake, ask your administrator to invite you or check your account email.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">After setup</p>
            <div className="grid gap-2 text-sm text-slate-600">
              <p className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">Connect shared inboxes.</p>
              <p className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">Invite teammates and assign roles.</p>
              <p className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">Start tracking contacts and replies.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
