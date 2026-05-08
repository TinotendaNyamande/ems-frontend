"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function EmailFeaturePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { user, isAuthReady } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
          Email Management System
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {!isAuthReady
            ? "Checking your session..."
            : user?.organisationId
              ? "This area is ready for mailbox and contact workflows when the backend endpoints are connected."
              : "Create or join an organisation before using this workspace area."}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 sm:w-auto"
          >
            Back to dashboard
          </Link>
          <Link
            href="/organisation"
            className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 sm:w-auto"
          >
            Organisation
          </Link>
        </div>
      </section>
    </main>
  );
}
