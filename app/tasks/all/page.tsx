"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { GetTasksByUser, TaskStatusList, type TaskDto } from "@/services/tasks";
import { ErrorPanel } from "@/components/ErrorPanel";



function isClosedTask(task: TaskDto) {
  return task.status?.toLowerCase() === "closed";
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function TasksPage() {
  const { user, isAuthReady } = useAuth();
  const userId = user?.id ?? "";

  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatusList>("all");

  const tasksQueryKey = useMemo(() => ["tasks", userId], [userId]);

  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: tasksQueryKey,
    enabled: isAuthReady && Boolean(userId),
    queryFn: () => GetTasksByUser(userId, null),
  });

  const openTasks = useMemo(() => (tasks ?? []).filter((task) => !isClosedTask(task)), [tasks]);

  const visibleTasks = useMemo(() => {
    return tasks?.filter((task) => task.status === statusFilter);
  }, [tasks, openTasks, statusFilter]);

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-3">
          <svg className="size-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              fill="currentColor"
            />
          </svg>
          <p className="text-sm font-semibold text-indigo-900">Loading workspace...</p>
        </div>
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
          <section className="rounded-2xl border border-slate-200 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                  Task management
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  All tasks
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">View and manage all tasks in the system.</p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Back to dashboard
              </Link>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  const val = event.target.value;
                  setStatusFilter(val === "all" ? "all" : (val as TaskStatusList));
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">ALL STATUSES</option>
                <option value={TaskStatusList.New}>NEW</option>
                <option value={TaskStatusList.Assigned}>ASSIGNED</option>
                <option value={TaskStatusList.InProgress}>IN PROGRESS</option>
                <option value={TaskStatusList.Blocked}>BLOCKED</option>
                <option value={TaskStatusList.Escalated}>ESCALATED</option>
                <option value={TaskStatusList.Closed}>CLOSED</option>
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <svg className="size-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    fill="currentColor"
                  />
                </svg>
                <p className="text-sm font-medium text-slate-600">Loading tasks...</p>
              </div>
            ) : isError ? (
              <ErrorPanel
                title="Could not load tasks"
                message={(error as Error)?.message || "An unexpected error occurred."}
                onRetry={() => refetch()}
              />
            ) : visibleTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900">No tasks found</p>
                <p className="mt-1 text-sm text-slate-600">
                  There are no tasks matching the selected view and status filter.
                </p>
              </div>
            ) : (
              <div>
                <div className="hidden rounded-t-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.6fr)]">
                  <span>Task</span>
                  <span>Category</span>
                  <span>Status</span>
                </div>
                <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {visibleTasks.map((task) => {
                    const assignedLabel =
                      [task.assignedToUserFirstName, task.assignedToUserLastName].filter(Boolean).join(" ") ||
                      task.assignedToUser ||
                      "Unassigned";
                    const isClosed = isClosedTask(task);

                    return (
                      <li key={task.id} className="transition-colors hover:bg-slate-50">
                        <Link href={`/tasks/${task.id}`} className="block px-4 py-4">
                          <div className="space-y-3 md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.6fr)] md:items-center md:gap-4 md:space-y-0">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {task.subject || "(No Subject)"}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-500 md:hidden">Category</p>
                              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                {task.category || "General"}
                              </span>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-slate-500 md:hidden">Status</p>
                              <span
                                className={[
                                  "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                                  isClosed
                                    ? "bg-slate-50 text-slate-700 ring-slate-600/10"
                                    : task.status === TaskStatusList.New
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                    : "bg-blue-50 text-blue-700 ring-blue-600/20",
                                ].join(" ")}
                              >
                                {task.status}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </main>
      </div>
  );
}
