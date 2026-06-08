"use client";

import Link from "next/link";
import { useState } from "react";
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

function OrganisationIdCopy({ organisationId }: { organisationId: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(organisationId);
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 2200);
    }
  };

  return (
    <div className="mt-4 flex max-w-2xl flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Organisation ID
        </p>
        <p className="mt-1 break-all font-mono text-sm font-medium text-slate-900">
          {organisationId}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        aria-label="Copy organisation ID"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
        {copied ? "Copied" : copyFailed ? "Failed" : "Copy"}
      </button>
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
            <OrganisationIdCopy organisationId={organisationId} />
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
          title="Users"
          description="View organisation users, assign roles, and tune permissions."
          href="/organisation/users"
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
        <QuickLinkCard
          title="Roles"
          description="Review organisation roles and manage permission access."
          href="/organisation/roles"
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
              <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
        />
        <QuickLinkCard
          title="Join requests"
          description="Review pending applications and audit all join decisions."
          href="/organisation/requests"
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              <path d="m17 11 2 2 4-4" />
            </svg>
          }
        />
        <QuickLinkCard
          title="Settings"
          description="Rename the organisation, transfer ownership, or delete the workspace."
          href="/organisation/manage"
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
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.1a2 2 0 0 1-3.84-1.1l-.01-.12A1.7 1.7 0 0 0 9 17.5a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 13a1.7 1.7 0 0 0-.6-1l-.1-.08A2 2 0 0 1 5 8.08l.12-.01A1.7 1.7 0 0 0 6.5 7a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 8.93 2.24l.06.06A1.7 1.7 0 0 0 11 2.6a1.7 1.7 0 0 0 1-.6l.08-.1A2 2 0 0 1 15.92 3l.01.12A1.7 1.7 0 0 0 17 4.5a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 21.4 9c.14.38.37.72.6 1l.1.08A2 2 0 0 1 21 13.92l-.12.01A1.7 1.7 0 0 0 19.4 15Z" />
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
