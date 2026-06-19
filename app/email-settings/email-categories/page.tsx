"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { CanPerformAction } from "@/components/CanPerformAction";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/context/AuthContext";
import { PermissionKeys } from "@/contants/PermissionKey";
import {
  CreateEmailCategory,
  GetEmailCategoryByOrganisation,
  type EmailCategoryDto,
} from "@/services/emailCategories";

function getCategoryInitials(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "EC";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "E";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : undefined;
  return (first + (second ?? "C")).toUpperCase();
}

function getCategoryIdLabel(value?: string) {
  if (!value) return "Not available";
  return value;
}

export default function EmailCategoriesPage() {
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const organisationId = user?.organisationId ?? "";
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const emailCategoriesQueryKey = useMemo(
    () => ["emailCategories", organisationId, token],
    [organisationId, token]
  );

  const {
    data: categories,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: emailCategoriesQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => GetEmailCategoryByOrganisation(organisationId, token!),
  });

  const sortedCategories = useMemo(
    () =>
      [...(categories ?? [])].sort((left, right) =>
        left.categoryName.localeCompare(right.categoryName, undefined, {
          sensitivity: "base",
        })
      ),
    [categories]
  );

  const createCategoryMutation = useMutation({
    mutationFn: (payload: { organisationId: string; categoryName: string }) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return CreateEmailCategory(payload, token);
    },
    onSuccess: async () => {
      setCategoryName("");
      setIsCreateModalOpen(false);
      enqueueSnackbar("Email category created successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: emailCategoriesQueryKey });
    },
    onError: (createError: unknown) => {
      const message =
        createError instanceof Error
          ? createError.message
          : "Failed to create email category. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const closeCreateModal = () => {
    if (createCategoryMutation.isPending) {
      return;
    }

    setIsCreateModalOpen(false);
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      enqueueSnackbar("Enter a category name.", { variant: "warning" });
      return;
    }

    if (!organisationId) {
      enqueueSnackbar("Create or join an organisation before adding categories.", {
        variant: "warning",
      });
      return;
    }

    createCategoryMutation.mutate({
      organisationId,
      categoryName: trimmedName,
    });
  };

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Loading email categories...
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
                  Email Categories
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Organize incoming mail into reusable buckets, then open a category to rename or remove it.
                </p>
              </div>
              <CanPerformAction permission={PermissionKeys.MailBoxesCreate}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  Create Category
                </button>
              </CanPerformAction>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Organisation categories</h2>
                <p className="mt-1 text-sm text-slate-600">
                  These categories are available to every email account in this organisation.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {sortedCategories.length} total
              </span>
            </div>

            {isLoading ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                Loading email categories...
              </div>
            ) : isError ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-900">Failed to load email categories</p>
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
            ) : sortedCategories.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">No email categories yet</p>
                <p className="mt-1 text-sm text-slate-600">
                  Create your first category to start grouping emails by topic, team, or workflow.
                </p>
                <CanPerformAction permission={PermissionKeys.MailBoxesCreate}>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    Create Category
                  </button>
                </CanPerformAction>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedCategories.map((category: EmailCategoryDto) => (
                  <Link
                    key={category.id}
                    href={`/email-settings/email-categories/${category.id}`}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100">
                        {getCategoryInitials(category.categoryName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-slate-900">
                          {category.categoryName || "Untitled category"}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          Open to view, rename, or delete this category.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">ID:</span>{" "}
                      <span className="break-all">{getCategoryIdLabel(category.id)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {isCreateModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeCreateModal();
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-category-title"
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="create-category-title" className="text-xl font-semibold text-slate-900">
                    Create email category
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Use a short, descriptive name so the category stays easy to scan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={createCategoryMutation.isPending}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Close create category modal"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700">
                    Category name
                  </label>
                  <input
                    id="categoryName"
                    type="text"
                    required
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder="Support"
                    disabled={createCategoryMutation.isPending}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={createCategoryMutation.isPending}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel
                  </button>
                  <CanPerformAction permission={PermissionKeys.MailBoxesCreate}>
                    <button
                      type="submit"
                      disabled={createCategoryMutation.isPending || !token}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                    </button>
                  </CanPerformAction>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </main>
    </ProtectedPage>
  );
}
