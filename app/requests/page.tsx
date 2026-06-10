"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";
import { CanPerformAction } from "@/components/CanPerformAction";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/context/AuthContext";
import { PermissionKeys } from "@/contants/PermissionKey";
import {
  approveJoinRequest,
  deleteJoinRequest,
  getOrganisationJoinRequests,
  getOrganisationPendingJoinRequests,
  rejectJoinRequest,
  type JoinRequestDto,
} from "@/services/joinRequests";
import { getRolesForOrganisation } from "@/services/roles";

type RequestView = "pending" | "all";

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function getUserLabel(user?: JoinRequestDto["requestedBy"] | null) {
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return fullName || user?.email || "Unknown user";
}

function getStatusStyle(status?: string | null) {
  const value = status?.trim().toLowerCase();

  if (value === "approved") return "bg-emerald-100 text-emerald-800";
  if (value === "rejected") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-800";
}

function getDecisionLabel(request: JoinRequestDto) {
  if (request.approvedAt || request.approvedBy) {
    return `Approved ${formatDateTime(request.approvedAt)} by ${getUserLabel(request.approvedBy)}`;
  }

  if (request.rejectedAt || request.rejectedBy) {
    return `Rejected ${formatDateTime(request.rejectedAt)} by ${getUserLabel(request.rejectedBy)}`;
  }

  return "Awaiting review";
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
      <p className="text-sm font-semibold text-rose-900">Failed to load join requests</p>
      <p className="mt-1 text-sm text-rose-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
      >
        Retry
      </button>
    </div>
  );
}

export default function OrganisationRequestsPage() {
  const { user, token, isAuthReady } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const organisationId = user?.organisationId ?? "";
  const userId = user?.id ?? "";
  const [view, setView] = useState<RequestView>("pending");
  const [roleByRequestId, setRoleByRequestId] = useState<Record<string, string>>({});

  const pendingQueryKey = useMemo(
    () => ["organisationJoinRequests", "pending", organisationId, token],
    [organisationId, token]
  );
  const allQueryKey = useMemo(
    () => ["organisationJoinRequests", "all", organisationId, token],
    [organisationId, token]
  );
  const rolesQueryKey = useMemo(
    () => ["organisationRoles", organisationId, token],
    [organisationId, token]
  );

  const {
    data: pendingRequests,
    isLoading: isPendingLoading,
    isError: isPendingError,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery({
    queryKey: pendingQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => getOrganisationPendingJoinRequests(organisationId, token!),
  });

  const {
    data: allRequests,
    isLoading: isAllLoading,
    isError: isAllError,
    error: allError,
    refetch: refetchAll,
  } = useQuery({
    queryKey: allQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => getOrganisationJoinRequests(organisationId, token!),
  });

  const {
    data: roles,
    isLoading: isRolesLoading,
    isError: isRolesError,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: rolesQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => getRolesForOrganisation(organisationId, token!),
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, roleId }: { requestId: string; roleId: string }) =>
      approveJoinRequest(
        requestId,
        {
          requestId,
          organisationId,
          approvingUserId: userId,
          roleId,
        },
        token!
      ),
    onSuccess: async () => {
      enqueueSnackbar("Join request approved.", { variant: "success" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pendingQueryKey }),
        queryClient.invalidateQueries({ queryKey: allQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["organisationUsers", organisationId] }),
      ]);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to approve join request.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) =>
      rejectJoinRequest(
        requestId,
        {
          requestId,
          organisationId,
          rejectingUserId: userId,
        },
        token!
      ),
    onSuccess: async () => {
      enqueueSnackbar("Join request rejected.", { variant: "success" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pendingQueryKey }),
        queryClient.invalidateQueries({ queryKey: allQueryKey }),
      ]);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to reject join request.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (requestId: string) => deleteJoinRequest(requestId, token!),
    onSuccess: async () => {
      enqueueSnackbar("Join request deleted.", { variant: "success" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pendingQueryKey }),
        queryClient.invalidateQueries({ queryKey: allQueryKey }),
      ]);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to delete join request.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const requests = view === "pending" ? pendingRequests : allRequests;
  const isLoading = view === "pending" ? isPendingLoading : isAllLoading;
  const isError = view === "pending" ? isPendingError : isAllError;
  const error = view === "pending" ? pendingError : allError;
  const refetch = view === "pending" ? refetchPending : refetchAll;
  const firstRoleId = roles?.[0]?.id ?? "";

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p>Not logged in</p>
      </div>
    );
  }

  if (!organisationId) {
    return <NoOrganisation />;
  }

  return (
    <ProtectedPage permission={PermissionKeys.JoinRequestsView}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                Organisation access
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Join requests
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review pending applications, approve users into a role, or audit all previous requests.
              </p>
            </div>
            <CanPerformAction permission={PermissionKeys.OrganisationView}>
              <Link
                href="/organisation"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Back to organisation
              </Link>
            </CanPerformAction>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setView("pending")}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold transition",
                  view === "pending"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setView("all")}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold transition",
                  view === "all"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                All requests
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                {pendingRequests?.length ?? 0} pending
              </span>
              <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {allRequests?.length ?? 0} total
              </span>
            </div>
          </div>

          {isRolesError && view === "pending" ? (
            <ErrorPanel
              message={(rolesError as Error)?.message || "Could not load organisation roles."}
              onRetry={() => refetchRoles()}
            />
          ) : isLoading || (view === "pending" && isRolesLoading) ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-700">Loading join requests...</p>
            </div>
          ) : isError ? (
            <ErrorPanel
              message={(error as Error)?.message || "An unexpected error occurred."}
              onRetry={() => refetch()}
            />
          ) : requests?.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">
                {view === "pending" ? "No pending requests" : "No join requests found"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {view === "pending"
                  ? "New applications will appear here when users apply to join."
                  : "Join request history will appear here once users apply."}
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {requests?.map((request) => {
                const selectedRoleId = roleByRequestId[request.id] || firstRoleId;
                const isApproving =
                  approveMutation.isPending &&
                  approveMutation.variables?.requestId === request.id;
                const isRejecting =
                  rejectMutation.isPending && rejectMutation.variables === request.id;
                const isDeleting =
                  deleteMutation.isPending && deleteMutation.variables === request.id;

                return (
                  <li
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-slate-900">
                            {getUserLabel(request.requestedBy)}
                          </h3>
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                              getStatusStyle(request.status),
                            ].join(" ")}
                          >
                            {request.status || "Pending"}
                          </span>
                        </div>
                        <p className="mt-1 break-all text-sm text-slate-600">
                          {request.requestedBy?.email || "No email available"}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Requested {formatDateTime(request.requestedAt)}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                          {getDecisionLabel(request)}
                        </p>
                        <p className="mt-2 break-all text-xs text-slate-500">
                          Request ID: {request.id}
                        </p>
                      </div>

                      {view === "pending" ? (
                        <CanPerformAction permission={PermissionKeys.JoinRequestsApprove}>
                          <div className="flex w-full flex-col gap-3 lg:w-80">
                            <select
                              aria-label={`Role for ${getUserLabel(request.requestedBy)}`}
                              value={selectedRoleId}
                              disabled={!roles?.length || isApproving || isRejecting || isDeleting}
                              onChange={(event) =>
                                setRoleByRequestId((current) => ({
                                  ...current,
                                  [request.id]: event.target.value,
                                }))
                              }
                              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <option value="">Select role</option>
                              {roles?.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.roleName}
                                </option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={!selectedRoleId || isApproving || isRejecting || isDeleting}
                                onClick={() =>
                                  approveMutation.mutate({
                                    requestId: request.id,
                                    roleId: selectedRoleId,
                                  })
                                }
                                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300"
                              >
                                {isApproving ? "Approving..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                disabled={isApproving || isRejecting || isDeleting}
                                onClick={() => rejectMutation.mutate(request.id)}
                                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-rose-300"
                              >
                                {isRejecting ? "Rejecting..." : "Reject"}
                              </button>
                            </div>
                            <button
                              type="button"
                              disabled={isApproving || isRejecting || isDeleting}
                              onClick={() => deleteMutation.mutate(request.id)}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDeleting ? "Deleting..." : "Delete request"}
                            </button>
                          </div>
                        </CanPerformAction>
                      ) : (
                        <CanPerformAction permission={PermissionKeys.JoinRequestsApprove}>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => deleteMutation.mutate(request.id)}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                          >
                            {isDeleting ? "Deleting..." : "Delete request"}
                          </button>
                        </CanPerformAction>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      </div>
    </ProtectedPage>
  );
}
