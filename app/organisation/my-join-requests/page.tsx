"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuth } from "@/context/AuthContext";
import {
  deleteJoinRequest,
  getUserJoinRequests,
  type JoinRequestDto,
  type JoinRequestUserDto,
} from "@/services/joinRequests";

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function getUserLabel(user?: JoinRequestUserDto | null) {
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return fullName || user?.email || "Unknown user";
}

function getStatusLabel(status?: string | null) {
  return status?.trim() || "Pending";
}

function getDecisionLabel(request: JoinRequestDto) {
  if (request.approvedAt || request.approvedBy) {
    return `Approved on ${formatDateTime(request.approvedAt)} by ${getUserLabel(request.approvedBy)}`;
  }

  if (request.rejectedAt || request.rejectedBy) {
    return `Rejected on     ${formatDateTime(request.rejectedAt)} by ${getUserLabel(request.rejectedBy)}`;
  }

  return "Awaiting review";
}

export default function MyJoinRequestsPage() {
  const { user, token, isAuthReady } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const joinRequestsQueryKey = ["joinRequestsByUser", userId, token];

  const {
    data: joinRequests,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<JoinRequestDto[]>({
    queryKey: joinRequestsQueryKey,
    enabled: isAuthReady && Boolean(userId && token && !user?.organisationId),
    queryFn: () => getUserJoinRequests(userId!, token!),
  });

  const deleteMutation = useMutation({
    mutationFn: (requestId: string) => deleteJoinRequest(requestId, token!),
    onSuccess: async () => {
      enqueueSnackbar("Join request deleted.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: joinRequestsQueryKey });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to delete join request.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

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

  if (user.organisationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur">
          <h1 className="text-xl font-semibold text-slate-900">You already have an organisation</h1>
          <p className="mt-2 text-sm text-slate-600">
            Join requests are only shown here while your account is waiting to join an organisation.
          </p>
          <Link
            href="/organisation"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Go to organisation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My join requests</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Track the organisation join requests you have submitted.
              </p>
            </div>
            <Link
              href="/organisation/join"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Apply to join
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Requests</h2>
              <p className="mt-1 text-sm text-slate-600">
                Your latest application status appears here.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {joinRequests?.length ?? 0} total
            </span>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-700">Loading join requests...</p>
            </div>
          ) : isError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <p className="text-sm font-semibold text-rose-900">Failed to load join requests</p>
              <p className="mt-1 text-sm text-rose-800">
                {(error as Error)?.message || "An unexpected error occurred."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              >
                Retry
              </button>
            </div>
          ) : joinRequests?.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">No join requests yet</p>
              <p className="mt-1 text-sm text-slate-600">
                Apply to join an organisation and your request will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {joinRequests?.map((request, index) => {
                const requestId = request.id || `join-request-${index}`;
                const isDeleting = deleteMutation.isPending && deleteMutation.variables === request.id;

                return (
                  <li
                    key={requestId}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900">
                          {getStatusLabel(request.status)} request
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Requested by {getUserLabel(request.requestedBy)}
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-600">{request.requestedBy?.email}</p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Requested {formatDateTime(request.requestedAt)}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                          {getDecisionLabel(request)}
                        </p>
                      </div>
                      <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => deleteMutation.mutate(request.id)}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isDeleting ? "Deleting..." : "Delete request"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
