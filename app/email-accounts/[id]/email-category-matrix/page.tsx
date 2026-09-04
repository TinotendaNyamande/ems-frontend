"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useConfirm } from "@/context/useConfirm";
import { ProtectedPage } from "@/components/ProtectedPage";
import { CanPerformAction } from "@/components/CanPerformAction";
import { useAuth } from "@/context/AuthContext";
import { PermissionKeys } from "@/contants/PermissionKey";
import { getAllUsers, type User } from "@/services/users";
import {
  CreateMatrix,
  DeleteMatrix,
  GetByOrganisation,
  type EmailCategoryMatrixDto,
} from "@/services/emailcategorymatrix";
import { GetEmailCategoriesByEmailAccount, type EmailCategoryDto } from "@/services/emailCategories";
import { useParams } from "next/dist/client/components/navigation";

function getUserDisplayName(user?: User) {
  if (!user) return "Unknown user";

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email || "Unnamed user";
}

function getUserDisplayNameFromMatrix(matrix: EmailCategoryMatrixDto) {
  const fullName = [matrix.userFirstName, matrix.userLastName].filter(Boolean).join(" ").trim();
  return fullName || matrix.userid || "Unknown user";
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

export default function EmailCategoryMatrixPage() {
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const params = useParams<{ id: string }>();

  const matrixQueryKey = useMemo(
    () => ["emailCategoryMatrix", params.id, token],
    [params.id, token]
  );
  const usersQueryKey = useMemo(
    () => ["users", params.id, token],
    [params.id, token]
  );
  const categoriesQueryKey = useMemo(
    () => ["emailCategories", params.id, token],
    [params.id, token]
  );

  const {
    data: matrices,
    isLoading: isMatricesLoading,
    isError: isMatricesError,
    error: matricesError,
    refetch: refetchMatrices,
  } = useQuery({
    queryKey: matrixQueryKey,
    enabled: isAuthReady && Boolean(params.id && token),
    queryFn: () => GetByOrganisation(params.id, token!),
  });

  const {
    data: users,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: usersQueryKey,
    enabled: isAuthReady && Boolean(params.id && token),
    queryFn: () => getAllUsers(token!, params.id),
  });

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: categoriesQueryKey,
    enabled: isAuthReady && Boolean(params.id && token),
    queryFn: () => GetEmailCategoriesByEmailAccount(params.id, token!),
  });

  useEffect(() => {
    if (!selectedUserId && users?.length) {
      setSelectedUserId(users[0].id);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (!selectedCategoryId && categories?.length) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [selectedCategoryId, categories]);

  const createMutation = useMutation({
    mutationFn: (payload: { userId: string; emailCategoryId: string }) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return CreateMatrix(payload, token);
    },
    onSuccess: async () => {
      enqueueSnackbar("Email category assignment created successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: matrixQueryKey });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create email category assignment. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (matrixId: string) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return DeleteMatrix(matrixId, token);
    },
    onSuccess: async () => {
      enqueueSnackbar("Email category assignment deleted successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: matrixQueryKey });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete email category assignment. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUserId) {
      enqueueSnackbar("Choose a user before creating the assignment.", { variant: "warning" });
      return;
    }

    if (!selectedCategoryId) {
      enqueueSnackbar("Choose an email category before creating the assignment.", {
        variant: "warning",
      });
      return;
    }

    createMutation.mutate({
      userId: selectedUserId,
      emailCategoryId: selectedCategoryId,
    });
  };

  const handleDelete = async (matrixId: string) => {
    const confirmed = await confirm({
      title: "Delete assignment",
      message: "This will remove the category-to-user link.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(matrixId);
  };

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Loading email category matrix...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Not logged in
        </div>
      </div>
    );
  }

  const visibleMatrices = matrices ?? [];

  return (
    <ProtectedPage permission={PermissionKeys.MailBoxesView}>
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                  Email settings
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Email category matrix
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Assign email categories to users, review existing links, and remove assignments
                  when a workflow changes.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/email-settings/email-categories"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  Email categories
                </Link>
                <Link
                  href="/users"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  Users
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assignments
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{visibleMatrices.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Users</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{users?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categories
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {categories?.length ?? 0}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Create assignment</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pick a user and a category to create a new matrix entry.
                </p>
              </div>
            </div>

            {isUsersLoading || isCategoriesLoading ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                Loading users and categories...
              </div>
            ) : isUsersError ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-900">Failed to load users</p>
                <p className="mt-1 text-sm text-rose-800">
                  {(usersError as Error)?.message || "An unexpected error occurred."}
                </p>
                <button
                  type="button"
                  onClick={() => refetchUsers()}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : isCategoriesError ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-900">Failed to load categories</p>
                <p className="mt-1 text-sm text-rose-800">
                  {(categoriesError as Error)?.message || "An unexpected error occurred."}
                </p>
                <button
                  type="button"
                  onClick={() => refetchCategories()}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : !users?.length || !categories?.length ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">Nothing to assign yet</p>
                <p className="mt-1 text-sm text-slate-600">
                  You need at least one user and one email category before you can create a matrix
                  entry.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label htmlFor="matrixUser" className="block text-sm font-medium text-slate-700">
                    User
                  </label>
                  <select
                    id="matrixUser"
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={createMutation.isPending}
                  >
                    <option value="">Select a user</option>
                    {users.map((organisationUser) => (
                      <option key={organisationUser.id} value={organisationUser.id}>
                        {getUserDisplayName(organisationUser)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="matrixCategory" className="block text-sm font-medium text-slate-700">
                    Email category
                  </label>
                  <select
                    id="matrixCategory"
                    value={selectedCategoryId}
                    onChange={(event) => setSelectedCategoryId(event.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={createMutation.isPending}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category: EmailCategoryDto) => (
                      <option key={category.id} value={category.id}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <CanPerformAction permission={PermissionKeys.MailBoxesCreate}>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || !token}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {createMutation.isPending ? "Creating..." : "Create assignment"}
                    </button>
                  </CanPerformAction>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Organisation assignments</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Open an assignment to review it or jump to the user-specific view.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {visibleMatrices.length} total
              </span>
            </div>

            {isMatricesLoading ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                Loading email category assignments...
              </div>
            ) : isMatricesError ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-900">Failed to load assignments</p>
                <p className="mt-1 text-sm text-rose-800">
                  {(matricesError as Error)?.message || "An unexpected error occurred."}
                </p>
                <button
                  type="button"
                  onClick={() => refetchMatrices()}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : visibleMatrices.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">No assignments yet</p>
                <p className="mt-1 text-sm text-slate-600">
                  Create your first matrix entry to map an email category to a user.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(10rem,0.8fr)]">
                  <span>User</span>
                  <span>Category</span>
                  <span>Status</span>
                  <span>Last assigned</span>
                  <span>Actions</span>
                </div>
                <ul className="divide-y divide-slate-200 bg-white">
                  {visibleMatrices.map((matrix: EmailCategoryMatrixDto) => (
                    <li key={matrix.id} className="px-4 py-4">
                      <div className="space-y-3 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(10rem,0.8fr)] md:gap-4 md:space-y-0 md:items-center">
                        <div>
                          <p className="text-xs font-medium text-slate-500 md:hidden">User</p>
                          <p className="font-semibold text-slate-900">
                            {getUserDisplayNameFromMatrix(matrix)}
                          </p>
                          <p className="mt-1 break-all text-sm text-slate-600">{matrix.userid}</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500 md:hidden">Category</p>
                          <p className="font-semibold text-slate-900">{matrix.categoryName}</p>
                          <p className="mt-1 break-all text-sm text-slate-600">{matrix.categoryId}</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500 md:hidden">Status</p>
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1",
                              matrix.isAvailable
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                : "bg-slate-100 text-slate-600 ring-slate-200",
                            ].join(" ")}
                          >
                            {matrix.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500 md:hidden">Last assigned</p>
                          <p className="text-sm text-slate-700">{formatDate(matrix.lastAssignedDate)}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/email-settings/email-category-matrix/${matrix.id}`}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                          >
                            View
                          </Link>
                          <Link
                            href={`/email-settings/email-category-matrix/user/${matrix.userid}`}
                            className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                          >
                            User view
                          </Link>
                          <CanPerformAction permission={PermissionKeys.MailBoxesDelete}>
                            <button
                              type="button"
                              onClick={() => handleDelete(matrix.id)}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Delete
                            </button>
                          </CanPerformAction>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}
