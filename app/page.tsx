"use client";

import { useAuth } from "@/context/AuthContext";
import NotLoggedInDashboard from "@/components/NotLoggedInDashboard";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";
import { OrganisationDashboard } from "@/components/OrganisationDashboard";

export default function DashboardPage() {
  const { user, isAuthReady, token } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Loading your email workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return <NotLoggedInDashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                Email Management System
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {user.organisationId ? "Workspace dashboard" : "Set up your email workspace"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {user.organisationId
                  ? "Monitor shared inbox activity, team ownership, contacts, and operational next steps from one place."
                  : "Create or join an organisation so your team can manage shared inboxes, contacts, and email follow-ups together."}
              </p>
            </div>

            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:min-w-72">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-slate-500">Signed in as</span>
                <span className="truncate font-semibold text-slate-900">{user.email}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-slate-500">Workspace</span>
                <span className="font-semibold text-slate-900">
                  {user.organisationId ? "Connected" : "Not connected"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {user.organisationId ? (
          <OrganisationDashboard organisationId={user.organisationId} token={token} />
        ) : (
          <NoOrganisation />
        )}
      </main>
    </div>
  );
}
