"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  GetTasksByUser,
  GetOpenTasks,
  GetAllTasks,
  GetOpenTasksByUser,
} from "@/services/tasks";
import { ErrorPanel } from "@/components/ErrorPanel";

type TaskView = {
  id: "my-open" | "my-all" | "open" | "all";
  label: string;
  adminOnly?: boolean;
};

const taskViews: TaskView[] = [
  {
    id: "my-open",
    label: "My Open Tasks",
  },
  {
    id: "my-all",
    label: "All My Tasks",
  },
  {
    id: "open",
    label: "Open Tasks",
    adminOnly: true,
  },
  {
    id: "all",
    label: "All Tasks",
    adminOnly: true,
  },
];

// Single source of truth for the table grid so header and rows never drift.
const TASK_GRID =
  "grid-cols-[2.2fr_1.5fr_1fr_1.1fr_1.3fr_1fr_7rem]";

function hasAdminAccess(role?: string | null) {
  const normalized = role?.trim().toLowerCase();
  return normalized === "admin" || normalized === "supervisor";
}

export default function TasksPage() {
  const { user, isAuthReady } = useAuth();

  const userId = user?.id ?? "";
  const isAdmin = hasAdminAccess(user?.role);

  const [selectedView, setSelectedView] = useState<
    "my-open" | "my-all" | "open" | "all"
  >("my-open");

  const visibleViews = useMemo(
    () => taskViews.filter((view) => !view.adminOnly || isAdmin),
    [isAdmin]
  );

  const currentView =
    taskViews.find((view) => view.id === selectedView) ?? taskViews[0];

  const tasksQueryKey = useMemo(
    () => ["tasks", selectedView, userId],
    [selectedView, userId]
  );

  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: tasksQueryKey,
    enabled:
      isAuthReady &&
      Boolean(userId) &&
      (!currentView.adminOnly || isAdmin),
    queryFn: async () => {
      switch (selectedView) {
        case "my-open":
          return GetOpenTasksByUser(userId);
        case "my-all":
          return GetTasksByUser(userId);
        case "open":
          return GetOpenTasks();
        case "all":
          return GetAllTasks();
        default:
          return GetOpenTasksByUser(userId);
      }
    },
  });

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-sm font-semibold text-indigo-900">
          Loading tasks...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="font-semibold text-slate-800">Not logged in</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white/75 p-8 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                Task management
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                {currentView.label}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="inline-flex w-fit items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Back to dashboard
            </button>
          </div>

          {/* Task View Tabs */}
          <div className="mt-7 border-b border-slate-200">
            <nav
              className="-mb-px flex gap-6 overflow-x-auto"
              aria-label="Task views"
            >
              {visibleViews.map((view) => {
                const isActive = selectedView === view.id;
                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setSelectedView(view.id)}
                    className={[
                      "whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-semibold transition-colors",
                      isActive
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
                    ].join(" ")}
                  >
                    {view.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </section>

        {/* Task List */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <svg
                className="size-8 animate-spin text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                />
              </svg>
              <p className="text-sm font-medium text-slate-600">
                Loading tasks...
              </p>
            </div>
          ) : isError ? (
            <ErrorPanel
              title="Could not load tasks"
              message={
                (error as Error)?.message ||
                "An unexpected error occurred."
              }
              onRetry={() => refetch()}
            />
          ) : !tasks || tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                <svg
                  className="size-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 006 0M9 5a3 3 0 012-2h2a3 3 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                No tasks found
              </p>
              <p className="mt-1 max-w-md text-sm text-slate-600">
                There are no tasks available in this view.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              {/* Header */}
              <div
                className={`grid items-center gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${TASK_GRID}`}
              >
                <span>Task</span>
                <span>Sender</span>
                <span>Category</span>
                <span>Date</span>
                <span>Assigned To</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>

              {/* Rows */}
              <ul className="divide-y divide-slate-200 bg-white">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <div
                      className={`grid items-center gap-4 px-5 py-4 ${TASK_GRID}`}
                    >
                      {/* Task */}
                      <div className="min-w-0">
                        <a
                          href={`/tasks/${task.id}`}
                          className="block truncate font-semibold text-slate-900 transition hover:text-indigo-700 hover:underline"
                          title={task.subject || "(No Subject)"}
                        >
                          {task.subject || "(No Subject)"}
                        </a>
                      </div>

                      {/* Sender */}
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm text-slate-600"
                          title={task.fromEmail || "Unknown Sender"}
                        >
                          {task.fromEmail || "Unknown Sender"}
                        </p>
                      </div>

                      {/* Category */}
                      <div className="min-w-0">
                        <span
                          className="inline-flex max-w-full items-center truncate rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10"
                          title={task.category || "General"}
                        >
                          {task.category || "General"}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-sm text-slate-600">
                          {task.createdAt
                            ? new Date(task.createdAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>

                      {/* Assigned To */}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {task.assignedToUserFirstName && task.assignedToUserLastName
                            ? `${task.assignedToUserFirstName} ${task.assignedToUserLastName}`
                            : "Unassigned"}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="min-w-0">
                        <span
                          className={[
                            "inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            task.status === "Closed"
                              ? "bg-slate-50 text-slate-700 ring-slate-600/10"
                              : task.status === "Assigned"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                : task.status === "Hold"
                                  ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                  : task.status === "Escalated"
                                    ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                                    : "bg-blue-50 text-blue-700 ring-blue-600/20",
                          ].join(" ")}
                        >
                          {task.status || "Unknown"}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="flex justify-end">
                        <a
                          href={`/tasks/${task.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        >
                          Details
                          <svg
                            className="size-3.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 011.06-.02z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}