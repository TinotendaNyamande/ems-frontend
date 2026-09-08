"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useConfirm } from "@/context/useConfirm";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";
import { ProtectedPage } from "@/components/ProtectedPage";
import { CanPerformAction } from "@/components/CanPerformAction";
import { useAuth } from "@/context/AuthContext";
import { PermissionKeys } from "@/contants/PermissionKey";
import { getUserProfile, type User } from "@/services/users";
import {
  CreateMatrix,
  DeleteMatrix,
  GetByUser,
  type EmailCategoryMatrixDto,
} from "@/services/emailcategorymatrix";
import { GetEmailCategoryByOrganisation, type EmailCategoryDto } from "@/services/emailCategories";

function getUserDisplayName(user?: User) {
  if (!user) return "Unknown user";

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email || "Unnamed user";
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

export default function UserMatrixPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const organisationId = user?.organisationId ?? "";
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const userQueryKey = useMemo(() => ["userProfile", userId, token], [userId, token]);
  const matrixQueryKey = useMemo(() => ["emailCategoryMatrixByUser", userId, token], [userId, token]);
  const organisationMatrixQueryKey = useMemo(
    () => ["emailCategoryMatrix", organisationId, token],
    [organisationId, token]
  );
  const categoriesQueryKey = useMemo(
    () => ["emailCategories", organisationId, token],
    [organisationId, token]
  );

  const {
    data: profile,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: userQueryKey,
    enabled: isAuthReady && Boolean(userId && token),
    queryFn: () => getUserProfile(token!, userId),
  });

  const {
    data: matrices,
    isLoading: isMatricesLoading,
    isError: isMatricesError,
    error: matricesError,
    refetch: refetchMatrices,
  } = useQuery({
    queryKey: matrixQueryKey,
    enabled: isAuthReady && Boolean(userId && token),
    queryFn: () => GetByUser(userId, token!),
  });

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: categoriesQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => GetEmailCategoryByOrganisation(organisationId, token!),
  });

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
      enqueueSnackbar("Email category assigned to user successfully.", { variant: "success" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: matrixQueryKey }),
        queryClient.invalidateQueries({ queryKey: organisationMatrixQueryKey }),
      ]);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create assignment. Please try again.";
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: matrixQueryKey }),
        queryClient.invalidateQueries({ queryKey: organisationMatrixQueryKey }),
      ]);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete assignment. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCategoryId) {
      enqueueSnackbar("Choose an email category before creating the assignment.", {
        variant: "warning",
      });
      return;
    }

    createMutation.mutate({
      userId,
      emailCategoryId: selectedCategoryId,
    });
  };

  const handleDelete = async (matrixId: string) => {
    const confirmed = await confirm({
      title: "Delete assignment",
      message: "This will remove the email category from the user.",
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
          Loading user assignments...
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

  if (!organisationId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <NoOrganisation />
        </div>
      </main>
    );
  }

  const visibleMatrices = (matrices ?? []) as EmailCategoryMatrixDto[];

  return (
    <ProtectedPage permission={PermissionKeys.MailBoxesView}>
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link
                  href={`/email-accounts/${params.id}/email-category-matrix`}
                  className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-900"
                >
                  Back to matrix
                </Link>
                <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-slate-950">
                  {getUserDisplayName(profile)}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Review the categories assigned to this user, add a new assignment, or remove an
                  existing one.
                </p>
              </div>
              {profile ? (
                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  User
                </span>
              ) : null}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignments</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{visibleMatrices.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {categories?.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-900">{userId}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Add assignment</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose a category to link to this user.
                </p>
              </div>
            </div>

            {isCategoriesLoading ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                Loading email categories...
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
            ) : !categories?.length ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">No categories available</p>
                <p className="mt-1 text-sm text-slate-600">
                  Create an email category before assigning one to this user.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="min-w-0 flex-1">
                  <label htmlFor="userCategory" className="block text-sm font-medium text-slate-700">
                    Email category
                  </label>
                  <select
                    id="userCategory"
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
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {createMutation.isPending ? "Creating..." : "Add assignment"}
                    </button>
                  </CanPerformAction>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">User assignments</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Each card shows the category currently linked to this user.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {visibleMatrices.length} total
              </span>
            </div>

            {isUserLoading || isMatricesLoading ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                Loading user assignments...
              </div>
            ) : isUserError ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-900">Failed to load user</p>
                <p className="mt-1 text-sm text-rose-800">
                  {(userError as Error)?.message || "An unexpected error occurred."}
                </p>
                <button
                  type="button"
                  onClick={() => refetchUser()}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  Retry
                </button>
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
                <p className="text-sm font-semibold text-slate-900">No assignments for this user</p>
                <p className="mt-1 text-sm text-slate-600">
                  Assign a category above to start routing email for this user.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(10rem,0.7fr)]">
                  <span>Category</span>
                  <span>Status</span>
                  <span>Last assigned</span>
                  <span>Actions</span>
                </div>
                <ul className="divide-y divide-slate-200 bg-white">
                  {visibleMatrices.map((matrix) => (
                    <li key={matrix.id} className="px-4 py-4">
                      <div className="space-y-3 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(10rem,0.7fr)] md:gap-4 md:space-y-0 md:items-center">
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
                            href={`/email-accounts/${params.id}/email-category-matrix/${matrix.id}`}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                          >
                            View
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
