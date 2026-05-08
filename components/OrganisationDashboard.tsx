"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "./Loading";
import { ErrorComponent } from "./Error";
import { getOrganisation } from "@/services/organisation";

type CompanyUserDto = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type GetCompanyDtoLike = {
  name?: string;
  owner?: CompanyUserDto;
  createdAt?: string;
  projectsCount?: unknown;
  clientsCount?: unknown;
  usersCount?: unknown;
};

function unwrapCompanyDto(payload: unknown): GetCompanyDtoLike | null {
  if (!payload || typeof payload !== "object") return null;
  const maybe = payload as Record<string, unknown>;
  const data = maybe.data;
  if (data && typeof data === "object") return data as GetCompanyDtoLike;
  return payload as GetCompanyDtoLike;
}

function formatCount(value: unknown) {
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return String(value.length);
  return "0";
}

function QuickLinkCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-4">
        <div className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <span className="text-sm font-semibold text-indigo-700 opacity-0 transition group-hover:opacity-100">
              Open -&gt;
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{hint}</p>
    </div>
  );
}

export const OrganisationDashboard = ({
  organisationId,
  token,
}: {
  organisationId: string;
  token: string | null;
}) => {
  const {
    data: organisationPayload,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["organisation", organisationId, token],
    queryFn: () => getOrganisation(organisationId, token),
    enabled: Boolean(organisationId && token),
  });

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <ErrorComponent
        message={error.message || "An error occurred while fetching the organisation."}
      />
    );
  }

  const organisation = unwrapCompanyDto(organisationPayload);
  const organisationName = organisation?.name || "Your organisation";
  const owner = organisation?.owner;
  const ownerLabel =
    [owner?.firstName, owner?.lastName].filter(Boolean).join(" ") ||
    owner?.email ||
    "Not assigned";
  const createdAtValue = organisation?.createdAt || "";
  const createdAtLabel = createdAtValue ? new Date(createdAtValue).toLocaleDateString() : "Not available";

  return (
    <section className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
              Organisation workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {organisationName}
            </h2>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Created {createdAtLabel} | Owner {ownerLabel}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Mailboxes"
            value={formatCount(organisation?.projectsCount)}
            hint="Shared inboxes and message queues."
          />
          <StatCard
            label="Members"
            value={formatCount(organisation?.usersCount)}
            hint="Teammates who can own conversations."
          />
          <StatCard
            label="Contacts"
            value={formatCount(organisation?.clientsCount)}
            hint="People and companies you communicate with."
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <QuickLinkCard
          title="Mailboxes"
          description="Review inboxes, ownership, and message queues."
          href="/mailboxes"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 6h16v12H4z" />
              <path d="m4 7 8 6 8-6" />
            </svg>
          }
        />
        <QuickLinkCard
          title="Members"
          description="Invite teammates, assign roles, and share responsibility."
          href="/organisation/members"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <QuickLinkCard
          title="Contacts"
          description="Manage contacts and keep communication history connected."
          href="/contacts"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 11a4 4 0 1 0-8 0" />
              <path d="M4 21a8 8 0 0 1 16 0" />
              <path d="M19 3h2v2" />
              <path d="m21 3-5 5" />
            </svg>
          }
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Next steps</p>
        <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <li className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            Connect or create the first shared mailbox.
          </li>
          <li className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            Add members and decide who owns each inbox.
          </li>
          <li className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            Import contacts for customers, vendors, or teams.
          </li>
          <li className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            Review organisation settings and response roles.
          </li>
        </ul>
      </div>
    </section>
  );
};
