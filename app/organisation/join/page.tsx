"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuth } from "@/context/AuthContext";
import {
  createCompanyJoinRequest,
  getCompanyJoinRequestsByUser,
} from "@/services/companyJoinRequests";
import { getOrganisation } from "@/services/organisation";

type CompanyPreview = {
  name?: string;
  owner?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt?: string;
  pendingJoinRequestsCount?: number;
};


const getOwnerLabel = (owner?: CompanyPreview["owner"]) => {
  const fullName = `${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`.trim();
  return fullName || owner?.email || "Unknown";
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

export default function JoinOrganisationPage() {
  const { user, token, isAuthReady } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [companyIdInput, setCompanyIdInput] = useState("");
  const [lookupCompanyId, setLookupCompanyId] = useState("");
  const trimmedCompanyId = companyIdInput.trim();
  const userId = user?.id ?? null;

  const {
    data: existingRequests,
    isLoading: isRequestsLoading,
    error: existingRequestsError,
    isError: isRequestsError,
  } = useQuery({
    queryKey: ["joinRequestsByUser", userId, token],
    enabled: isAuthReady && !!userId && !!token,
    queryFn: () => getCompanyJoinRequestsByUser(userId!, token),
  });

  const hasPendingRequest = (existingRequests?.length ?? 0) > 0;

  const applyMutation = useMutation({
    mutationFn: (companyId: string) => createCompanyJoinRequest(companyId, userId!, token),
    onSuccess: async () => {
      enqueueSnackbar("Join request submitted successfully.", { variant: "success" });
      await queryClient.invalidateQueries({
        queryKey: ["joinRequestsByUser", userId, token],
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to submit join request. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedCompanyId) {
      enqueueSnackbar("Company ID is required.", { variant: "warning" });
      return;
    }


    if (hasPendingRequest) {
      enqueueSnackbar("You already have a pending join request.", { variant: "warning" });
      return;
    }

    await applyMutation.mutateAsync(trimmedCompanyId);
  };

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

  if (user.companyId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur">
          <h1 className="text-xl font-semibold text-slate-900">You already have an organisation</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account is already linked to a company or organisation.
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
      <div className="mx-auto grid w-full max-w-5xl gap-8">
        <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Apply to join an organisation
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter the company ID shared by your administrator, confirm the organisation details,
            and submit your request for approval.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-slate-700">
                Company ID
              </label>
              <input
                id="companyId"
                type="text"
                value={companyIdInput}
                onChange={(event) => setCompanyIdInput(event.target.value)}
                disabled={applyMutation.isPending}
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
              />
              <p className="mt-2 text-xs text-slate-500">
                Paste the exact organisation ID .
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                // disabled={
                //   applyMutation.isPending ||
                //   hasPendingRequest ||
                //   !trimmedCompanyId ||
                //   !GUID_PATTERN.test(trimmedCompanyId)
                // }
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {applyMutation.isPending ? "Submitting request..." : "Apply to join"}
              </button>
            </div>
          </form>

          {isRequestsError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-900">Could not load your pending requests</p>
              <p className="mt-1 text-sm text-rose-800">
                {(existingRequestsError as Error)?.message || "An unexpected error occurred."}
              </p>
            </div>
          ) : isRequestsLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-700">Loading...</p>
            </div>
          ) : hasPendingRequest ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-sm font-semibold text-amber-900">You already have a pending request</p>
  
              <ul className="mt-3 space-y-2">
                {existingRequests?.map((request, index) => (
                  <li
                    key={request.id ?? `pending-request-${index}`}
                    className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-amber-200"
                  >
                    Request ID: {request.id || "Unavailable"}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <p className="text-sm font-semibold text-emerald-900">No pending requests</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
