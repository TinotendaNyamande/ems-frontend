"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuth } from "@/context/AuthContext";
import {
  ChangeOwner,
  deleteOrganisation,
  getOrganisation,
  renameOrganisation,
} from "@/services/organisation";
import { getAllUsers, type User } from "@/services/users";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";

type OrganisationOwner = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type OrganisationDetails = {
  id?: string | null;
  name?: string | null;
  ownerId?: string | null;
  owner?: OrganisationOwner | null;
  createdAt?: string | null;
};

function unwrapOrganisation(payload: unknown): OrganisationDetails | null {
  if (!payload || typeof payload !== "object") return null;
  const maybe = payload as Record<string, unknown>;
  const data = maybe.data;
  if (data && typeof data === "object") return data as OrganisationDetails;
  return payload as OrganisationDetails;
}

function getUserLabel(user: User) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName ? `${fullName} (${user.email})` : user.email;
}

function getOwnerLabel(owner?: OrganisationOwner | null) {
  const fullName = [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim();
  return fullName || owner?.email || "Not assigned";
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function ManageOrganisationPage() {
  const { user, isAuthReady, token, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const organisationId = user?.organisationId ?? "";
  const organisationQueryKey = useMemo(
    () => ["organisation", organisationId, token],
    [organisationId, token]
  );

  const [organisationName, setOrganisationName] = useState("");
  const [newOwnerId, setNewOwnerId] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const {
    data: organisationPayload,
    isLoading: isOrganisationLoading,
    isError: isOrganisationError,
    error: organisationError,
    refetch: refetchOrganisation,
  } = useQuery({
    queryKey: organisationQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => getOrganisation(organisationId, token),
  });

  const organisation = unwrapOrganisation(organisationPayload);
  const currentName = organisation?.name?.trim() || "Your organisation";
  const currentOwnerId = organisation?.ownerId || organisation?.owner?.id || "";

  const {
    data: members,
    isLoading: isMembersLoading,
    isError: isMembersError,
    error: membersError,
  } = useQuery({
    queryKey: ["organisationUsers", organisationId, token],
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => getAllUsers(token!, organisationId),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameOrganisation(organisationId, name, token),
    onSuccess: async () => {
      enqueueSnackbar("Organisation renamed successfully.", { variant: "success" });
      setOrganisationName("");
      await queryClient.invalidateQueries({ queryKey: ["organisation", organisationId] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to rename organisation.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const changeOwnerMutation = useMutation({
    mutationFn: (ownerId: string) => ChangeOwner(organisationId, ownerId, token),
    onSuccess: async () => {
      enqueueSnackbar("Organisation owner changed successfully.", { variant: "success" });
      setNewOwnerId("");
      await queryClient.invalidateQueries({ queryKey: ["organisation", organisationId] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to change organisation owner.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganisation(organisationId, token),
    onSuccess: async () => {
      enqueueSnackbar("Organisation deleted. Please sign in again.", { variant: "success" });
      await logout();
      router.push("/login");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete organisation.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const handleRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = organisationName.trim();
    if (!trimmedName) {
      enqueueSnackbar("Organisation name is required.", { variant: "warning" });
      return;
    }
    renameMutation.mutate(trimmedName);
  };

  const handleChangeOwner = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newOwnerId) {
      enqueueSnackbar("Select the new owner.", { variant: "warning" });
      return;
    }
    changeOwnerMutation.mutate(newOwnerId);
  };

  const handleDelete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (deleteConfirmation.trim() !== currentName) {
      enqueueSnackbar("Type the organisation name exactly to confirm deletion.", {
        variant: "warning",
      });
      return;
    }
    deleteMutation.mutate();
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

  if (!organisationId) {
    return <NoOrganisation />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                Organisation settings
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Manage organisation
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Update organisation details, transfer ownership, or remove the workspace.
              </p>
            </div>
            <Link
              href="/organisation"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Back to organisation
            </Link>
          </div>
        </section>

        {isOrganisationLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-700">Loading organisation details...</p>
          </section>
        ) : isOrganisationError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-900">Could not load organisation</p>
            <p className="mt-1 text-sm text-rose-800">
              {(organisationError as Error)?.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => refetchOrganisation()}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              Retry
            </button>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
                <p className="mt-2 break-words text-lg font-semibold text-slate-900">{currentName}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</p>
                <p className="mt-2 break-words text-lg font-semibold text-slate-900">
                  {getOwnerLabel(organisation?.owner)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatDate(organisation?.createdAt)}
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <form
                onSubmit={handleRename}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">Rename organisation</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Set the display name your team sees across the workspace.
                </p>
                <label htmlFor="organisationName" className="mt-5 block text-sm font-medium text-slate-700">
                  New name
                </label>
                <input
                  id="organisationName"
                  type="text"
                  value={organisationName}
                  onChange={(event) => setOrganisationName(event.target.value)}
                  disabled={renameMutation.isPending}
                  placeholder={currentName}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={renameMutation.isPending || !organisationName.trim()}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {renameMutation.isPending ? "Saving..." : "Save name"}
                </button>
              </form>

              <form
                onSubmit={handleChangeOwner}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">Change owner</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Transfer organisation ownership to another current member.
                </p>
                <label htmlFor="newOwnerId" className="mt-5 block text-sm font-medium text-slate-700">
                  New owner
                </label>
                <select
                  id="newOwnerId"
                  value={newOwnerId}
                  onChange={(event) => setNewOwnerId(event.target.value)}
                  disabled={changeOwnerMutation.isPending || isMembersLoading}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">
                    {isMembersLoading ? "Loading members..." : "Select a member"}
                  </option>
                  {members?.map((member) => (
                    <option
                      key={member.id}
                      value={member.id}
                      disabled={Boolean(currentOwnerId && member.id === currentOwnerId)}
                    >
                      {getUserLabel(member)}
                    </option>
                  ))}
                </select>
                {isMembersError ? (
                  <p className="mt-2 text-sm text-rose-700">
                    {(membersError as Error)?.message || "Could not load organisation members."}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={changeOwnerMutation.isPending || !newOwnerId}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {changeOwnerMutation.isPending ? "Transferring..." : "Transfer ownership"}
                </button>
              </form>
            </section>

            <form
              onSubmit={handleDelete}
              className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
            >
              <div className="max-w-2xl">
                <h2 className="text-lg font-semibold text-rose-900">Delete organisation</h2>
                <p className="mt-1 text-sm leading-6 text-rose-700">
                  This removes the organisation workspace. Type the organisation name to confirm.
                </p>
                <label htmlFor="deleteConfirmation" className="mt-5 block text-sm font-medium text-slate-700">
                  Type {currentName}
                </label>
                <input
                  id="deleteConfirmation"
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  disabled={deleteMutation.isPending}
                  className="mt-1 block w-full rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={deleteMutation.isPending || deleteConfirmation.trim() !== currentName}
                  className="mt-5 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete organisation"}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
