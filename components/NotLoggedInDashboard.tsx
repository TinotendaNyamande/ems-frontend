"use client";

import Link from "next/link";

export default function NotLoggedInDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
              Email Management System
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Keep every shared inbox calm, owned, and moving.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Bring team email, contacts, follow-ups, and ownership into one workspace. Create an
              organisation, invite teammates, and manage customer conversations without losing context.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                Log in
              </Link>
              <Link
                href="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                Forgot password
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Shared inboxes</p>
                <p className="mt-1 text-sm text-slate-600">
                  Route messages to the right team and owner.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Contact context</p>
                <p className="mt-1 text-sm text-slate-600">
                  Keep contacts, organisations, and history together.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Follow-up tracking</p>
                <p className="mt-1 text-sm text-slate-600">
                  See what needs a reply before it slips.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Secure sessions</p>
                <p className="mt-1 text-sm text-slate-600">
                  Authenticated access with refresh handling.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Workspace preview</p>
                <p className="text-xs text-slate-600">Email operations</p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                Live
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-indigo-600 p-5 text-white shadow-sm">
                <p className="text-xs font-semibold text-white/90">Connected</p>
                <p className="mt-1 text-2xl font-semibold">5</p>
                <p className="mt-1 text-xs text-white/80">Shared inboxes</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-600">Needs reply</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">12</p>
                <p className="mt-1 text-xs text-slate-500">Messages today</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-600">Team</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">8</p>
                <p className="mt-1 text-xs text-slate-500">Members</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-600">Updates</p>
                <p className="mt-2 text-sm text-slate-700">
                  Assignments, replies, and contact updates appear here.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500">
            By continuing, you agree to your organisation&apos;s policies. Need help?{" "}
            <Link href="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
              Contact your admin
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
