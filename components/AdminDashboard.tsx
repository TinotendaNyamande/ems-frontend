"use client";

import Link from "next/link";

type AdminCard = {
  title: string;
  description: string;
  href: string;
  accent: string;
};

function AdminActionCard({ title, description, href, accent }: AdminCard) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-4">
        <div className={`grid size-11 place-items-center rounded-xl ${accent} text-white shadow-sm`}>
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

const adminActions: AdminCard[] = [
  {
    title: "Users",
    description: "Review users and manage assignments from one place.",
    href: "/users",
    accent: "bg-indigo-600",
  },
  {
    title: "Create users",
    description: "Add new users and assign them to the workspace.",
    href: "/users/manage",
    accent: "bg-blue-600",
  },
  {
    title: "Email accounts",
    description: "Create, edit, and maintain the mailboxes connected to the app.",
    href: "/email-accounts",
    accent: "bg-emerald-600",
  },
  {
    title: "Email categories",
    description: "Shape the categories available for message routing.",
    href: "/email-settings/email-categories",
    accent: "bg-cyan-600",
  },
  {
    title: "Category matrix",
    description: "Map categories to the users who need them.",
    href: "/email-settings/email-category-matrix",
    accent: "bg-violet-600",
  },
  {
    title: "Task queue",
    description: "Review the full task list and move into the operational view.",
    href: "/tasks?view=all",
    accent: "bg-slate-700",
  },
];

export const AdminDashboard = () => {
  return (
    <section className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
              Admin workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Administration dashboard
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Keep the management surfaces grouped together here while the regular dashboard stays
              focused on the work a user needs to handle day to day.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Back to user dashboard
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {adminActions.map((action) => (
          <AdminActionCard key={action.title} {...action} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Admin notes</p>
        <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <li className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            Keep user management and email setup together in one place.
          </li>
          <li className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            Use the task queue when you need the full operational picture.
          </li>
          <li className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            Leave permission enforcement for the RBAC pass you plan to add next.
          </li>
          <li className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            Keep the user dashboard lightweight and task-first.
          </li>
        </ul>
      </div>
    </section>
  );
};
