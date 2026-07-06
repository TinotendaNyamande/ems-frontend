"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";
import { useAuth } from "@/context/AuthContext";
import {
  GetTaskById,
  addTaskNotes,
  closeTask,
  reassignedTask,
  deleteTask,
  changeTaskStatus,
  ReOpenTask,
} from "@/services/tasks";
import { getAllUsers } from "@/services/users";
import { ProtectedPage } from "@/components/ProtectedPage";
import { PermissionKeys } from "@/contants/PermissionKey";
import { ErrorPanel } from "@/components/ErrorPanel";
import { CanPerformAction } from "@/components/CanPerformAction";
import { useConfirm } from "@/context/useConfirm";
import { TaskStatusList } from "../page";

export default function TaskDetailsPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const router = useRouter();
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const organisationId = user?.organisationId ?? "";

  const [noteText, setNoteText] = useState("");
  const [reassignUserId, setReassignUserId] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [closingNotes, setClosingNotes] = useState("");
  const [newStatus, setNewStatus] = useState<TaskStatusList | "">("");

  const taskQueryKey = useMemo(() => ["task", taskId, token], [taskId, token]);
  const usersQueryKey = useMemo(() => ["organisationUsers", organisationId, token], [organisationId, token]);

  const {
    data: task,
    isLoading: isTaskLoading,
    isError: isTaskError,
    error: taskError,
    refetch: refetchTask,
  } = useQuery({
    queryKey: taskQueryKey,
    enabled: isAuthReady && Boolean(taskId && token),
    queryFn: () => GetTaskById(taskId),
  });

  const { data: orgUsers } = useQuery({
    queryKey: usersQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => getAllUsers(token!, organisationId),
  });

  const addNoteMutation = useMutation({
    mutationFn: (notes: string) => addTaskNotes(taskId, notes),
    onSuccess: () => {
      enqueueSnackbar("Note added successfully.", { variant: "success" });
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
    },
    onError: (err: unknown) => {
      enqueueSnackbar((err as Error)?.message || "Failed to add note.", { variant: "error" });
    },
  });

  const reassignMutation = useMutation({
    mutationFn: (newUserId: string) => reassignedTask(taskId, newUserId),
    onSuccess: () => {
      enqueueSnackbar("Task reassigned successfully.", { variant: "success" });
      setReassignUserId("");
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
    },
    onError: (err: unknown) => {
      enqueueSnackbar((err as Error)?.message || "Failed to reassign task.", { variant: "error" });
    },
  });

  const reopenTaskMutation = useMutation({
    mutationFn: () => ReOpenTask(taskId),
    onSuccess: () => {
      enqueueSnackbar("Task reopened successfully.", { variant: "success" });
      setClosingNotes("");
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
    },
    onError: (err: unknown) => {
      enqueueSnackbar((err as Error)?.message || "Failed to reopen task.", { variant: "error" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => changeTaskStatus(taskId, newStatus, closingNotes,user?.organisationId),
    onSuccess: () => {
      enqueueSnackbar("Task status updated successfully.", { variant: "success" });
      setIsStatusModalOpen(false);
      setClosingNotes("");
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
    },
    onError: (err: unknown) => {
      enqueueSnackbar((err as Error)?.message || "Failed to update task status.", { variant: "error" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      enqueueSnackbar("Task deleted successfully.", { variant: "success" });
      router.push("/tasks");
    },
    onError: (err: unknown) => {
      enqueueSnackbar((err as Error)?.message || "Failed to delete task.", { variant: "error" });
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNoteMutation.mutate(noteText.trim());
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignUserId) return;
    reassignMutation.mutate(reassignUserId);
    setTimeout(() => { setIsReassignModalOpen(false) }, 1000);
  };


  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;
    updateStatusMutation.mutate(newStatus);
    setTimeout(() => { setIsStatusModalOpen(false) }, 1000);
  }

  const handleDeleteClick = async () => {
    const confirmed = await confirm({
      title: "Delete Task",
      message: "Are you sure you want to delete this task? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      deleteTaskMutation.mutate();
    }
  };

  const handleReopenClick = async () => {
    const confirmed = await confirm({
      title: "Reopen Task",
      message: "Are you sure you want to reopen this task?",
      confirmText: "Reopen",
      cancelText: "Cancel",
    });

    if (confirmed) {
      reopenTaskMutation.mutate();
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-sm font-semibold text-indigo-900">Loading details...</p>
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

  if (!organisationId) {
    return <NoOrganisation />;
  }

  const assignedUserLabel = task
    ? [task.assignedToUserFirstName, task.assignedToUserLastName].filter(Boolean).join(" ") || task.assignedToUser || "Unassigned"
    : "Unassigned";

  const isClosed = task?.status === TaskStatusList.Closed;

  return (
    <ProtectedPage permission={PermissionKeys.TasksView}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Tasks
            </Link>

            <div className="flex items-center gap-2">
              {isClosed && (
                <button
                  type="button"
                  onClick={handleReopenClick}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                >
                  Reopen Task
                </button>
              )}
              <CanPerformAction permission={PermissionKeys.TasksEdit}>
                {!isClosed && (
                  <button
                    type="button"
                    onClick={() => setIsStatusModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                  >
                    Update Status
                  </button>
                )}
              </CanPerformAction>
              <CanPerformAction permission={PermissionKeys.TasksEdit}>
                {!isClosed && (
                  <button
                    type="button"
                    onClick={() => setIsReassignModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                  >
                    Reassign Task
                  </button>
                )}
              </CanPerformAction>
              <CanPerformAction permission={PermissionKeys.TasksDelete}>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deleteTaskMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer disabled:opacity-50"
                >
                  Delete Task
                </button>
              </CanPerformAction>
            </div>
          </div>

          {/* Load States */}
          {isTaskLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl bg-white/50 border border-slate-200 shadow-sm backdrop-blur">
              <svg className="size-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
              </svg>
              <p className="text-sm font-semibold text-slate-700">Loading task details...</p>
            </div>
          ) : isTaskError || !task ? (
            <ErrorPanel
              title="Could not load task details"
              message={(taskError as Error)?.message || "The requested task could not be retrieved."}
              onRetry={() => refetchTask()}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column (2/3 width) - Task Details and Email Body */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Email Viewer Card */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {task.subject || "(No Subject)"}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                          {task.category || "General"}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                            isClosed
                              ? "bg-slate-50 text-slate-700 ring-slate-600/10"
                              : task.status === TaskStatusList.New
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                : "bg-blue-50 text-blue-700 ring-blue-600/20"
                          ].join(" ")}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <span className="font-semibold text-slate-800">From:</span> {task.fromEmail || "Unknown Sender"}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">To Mailbox:</span> {task.emailAccountAddress || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Body</h3>
                    <div className="mt-3 min-h-48 overflow-y-auto rounded-xl border border-slate-150 bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                      {task.emailBody || "(No Body Content)"}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">Task Notes & Updates</h3>

                  {task.additionalInformation ? (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                      {task.additionalInformation}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500 italic">No notes added yet.</p>
                  )}

                  {!isClosed && (
                    <form onSubmit={handleAddNote} className="mt-6 border-t border-slate-100 pt-4">
                      <label htmlFor="noteInput" className="block text-sm font-semibold text-slate-700">
                        Add Note
                      </label>
                      <div className="mt-2 flex gap-3">
                        <textarea
                          id="noteInput"
                          rows={2}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Type notes or updates here..."
                          className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                        <button
                          type="submit"
                          disabled={addNoteMutation.isPending || !noteText.trim()}
                          className="self-end rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                        >
                          {addNoteMutation.isPending ? "Adding..." : "Add"}
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              </div>

              <div className="flex flex-col gap-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">Task Ownership</h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Teammate</span>
                      <p className="mt-1 font-semibold text-slate-900">{assignedUserLabel}</p>
                    </div>

                    {!isClosed && (
                      <form onSubmit={handleReassign} className="border-t border-slate-100 pt-4">
                        <label htmlFor="reassignSelect" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Reassign Task
                        </label>
                        <div className="mt-2 flex gap-2">
                          <select
                            id="reassignSelect"
                            value={reassignUserId}
                            onChange={(e) => setReassignUserId(e.target.value)}
                            className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          >
                            <option value="">Select teammate...</option>
                            {orgUsers
                              ?.filter((u) => u.id !== task.assignedToUser)
                              ?.map((u) => {
                                const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
                                return (
                                  <option key={u.id} value={u.id}>
                                    {name}
                                  </option>
                                );
                              })}
                          </select>
                          <button
                            type="submit"
                            disabled={reassignMutation.isPending || !reassignUserId}
                            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                          >
                            Go
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">Task Timeline</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800">Created:</span>{" "}
                      {task.createdAt ? new Date(task.createdAt).toLocaleString() : "N/A"}
                    </div>
                    {task.updatedAt && (
                      <div>
                        <span className="font-semibold text-slate-800">Last Updated:</span>{" "}
                        {new Date(task.updatedAt).toLocaleString()}
                      </div>
                    )}
                    {task.assignedToUserDate && (
                      <div>
                        <span className="font-semibold text-slate-800">Assigned on:</span>{" "}
                        {new Date(task.assignedToUserDate).toLocaleString()}
                      </div>
                    )}
                    {task.closedDate && (
                      <div>
                        <span className="font-semibold text-slate-800">Closed on:</span>{" "}
                        {new Date(task.closedDate).toLocaleString()}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Update Status</h3>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="newStatus" className="block text-sm font-semibold text-slate-700">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewStatus(val.toString() as TaskStatusList | "");
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value={TaskStatusList.New}>NEW</option>
                  <option value={TaskStatusList.Assigned}>ASSIGNED</option>
                  <option value={TaskStatusList.InProgress}>IN PROGRESS</option>
                  <option value={TaskStatusList.Blocked}>BLOCKED</option>
                  <option value={TaskStatusList.Escalated}>ESCALATED</option>
                  <option value={TaskStatusList.Closed}>CLOSED</option>
                </select>
              </div>
              {newStatus === TaskStatusList.Closed && (
                <div>
                  <label htmlFor="closingNotes" className="block text-sm font-semibold text-slate-700">
                    Closing Notes / Resolution Information
                  </label>
                  <textarea
                    id="closingNotes"
                    required
                    rows={4}
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Summarize the action taken to resolve this task..."
                    className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Reassign Task</h3>
              <button
                type="button"
                onClick={() => setIsReassignModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleReassign} className="mt-4 space-y-4">
              <label htmlFor="reassignSelect" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                New user
              </label>
              <div className="mt-2 flex gap-2">
                <select
                  id="reassignSelect"
                  value={reassignUserId}
                  onChange={(e) => setReassignUserId(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Select teammate...</option>
                  {orgUsers
                    ?.filter((u) => u.id !== task?.assignedToUser)
                    ?.map((u) => {
                      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
                      return (
                        <option key={u.id} value={u.id}>
                          {name}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassignMutation.isPending || !reassignUserId}
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
