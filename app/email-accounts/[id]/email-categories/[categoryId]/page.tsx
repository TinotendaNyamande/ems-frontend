"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { CanPerformAction } from "@/components/CanPerformAction";
import { useAuth } from "@/context/AuthContext";
import { PermissionKeys } from "@/contants/PermissionKey";
import {
  DeleteEmailCategory,
  EditEmailCategory,
  GetEmailCategoriesByEmailAccount,
  GetEmailCategoryById,
} from "@/services/emailCategories";


export default function EmailCategoryDetailsPage() {
  const params = useParams<{ id: string; categoryId: string }>();
  const router = useRouter();
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const accountId = params.id;
  const categoryId = params.categoryId;
  const categoryQueryKey = useMemo(() => ["emailCategory", categoryId, token], [categoryId, token]);
  const otherCategoriesQueryKey = useMemo(() => ["emailCategories", params.id, token], [params.id, token]);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [slaHours, setSlaHours] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState("");

  const {
    data: category,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: categoryQueryKey,
    enabled: isAuthReady && Boolean(categoryId && token),
    queryFn: () => GetEmailCategoryById(categoryId, token!),
  });

    const {
    data: otherCategoriesData,
    isLoading:otherCategoriesIsLoading,
    isError:otherCategoriesIsError,
    error:otherCategoriesError,
    refetch:otherCategoriesRefetch,
  } = useQuery({
    queryKey: otherCategoriesQueryKey,
    enabled: isAuthReady && Boolean(accountId && token),
    queryFn: () => GetEmailCategoriesByEmailAccount(accountId, token!),
  });

  const editMutation = useMutation({
    mutationFn: (payload: { newName: string; slaHours: number }) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return EditEmailCategory(categoryId, payload.newName, payload.slaHours, token);
    },
    onSuccess: async () => {
      setIsRenameModalOpen(false);
      enqueueSnackbar("Email category edited successfully.", { variant: "success" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: categoryQueryKey }),
      ]);
    },
    onError: (editError: unknown) => {
      const message =
        editError instanceof Error
          ? editError.message
          : "Failed to edit email category. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (payload?: { newCategoryId?: string | null }) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return DeleteEmailCategory(categoryId, token, payload?.newCategoryId ?? null);
    },
    onSuccess: async () => {
      setIsDeleteModalOpen(false);
      enqueueSnackbar("Email category deleted successfully.", { variant: "success" });
      // await queryClient.invalidateQueries({ queryKey: categoryQueryKey });
      router.push(`/email-accounts/${accountId}/email-categories`);
    },
    onError: (deleteError: unknown) => {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete email category. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const openRenameModal = () => {
    if (!category) return;

    setNewName(category.categoryName ?? "");
    setSlaHours(category.slaHours?.toString() ?? "");
    setIsRenameModalOpen(true);
  };

  const openDeleteModal = () => {
    setNewCategoryId("");
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newName.trim();
    if (!trimmedName) {
      enqueueSnackbar("Enter a category name.", { variant: "warning" });
      return;
    }

    editMutation.mutate({ newName: trimmedName, slaHours: parseInt(slaHours) });
  };

  const handleDeleteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    deleteMutation.mutate({ newCategoryId: newCategoryId || null });
  };

  if (!isLoading && !category && !isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Loading email category...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href={`/email-accounts/${accountId}/email-categories`}
                className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-900"
              >
                Back to email categories
              </Link>
              <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-slate-950">
                {category?.categoryName || "Email category details"}
              </h1>
            </div>

            {/* {category ? (
                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  Category
                </span>
              ) : null} */}
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm sm:p-8">
            Loading email category details...
          </section>
        ) : isError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-rose-900">Failed to load email category</p>
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
          </section>
        ) : category ? (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category name
                </p>
                <p className="mt-2 break-words text-lg font-semibold text-slate-900">
                  {category.categoryName}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  SLA Hours
                </p>
                <p className="mt-2 break-all text-lg font-semibold text-slate-900">
                  {category.slaHours}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={openRenameModal}
                  disabled={editMutation.isPending || deleteMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Edit category
                </button>
                <button
                  type="button"
                  onClick={openDeleteModal}
                  disabled={editMutation.isPending || deleteMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-rose-600 transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Delete category
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-slate-900">Email category not found</p>
            <Link
              href={`/email-accounts/${accountId}/email-categories`}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Back to email categories
            </Link>
          </section>
        )}
      </div>

      {isRenameModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !editMutation.isPending) {
              setIsRenameModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-category-title"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="rename-category-title" className="text-xl font-semibold text-slate-900">
                  Edit email category
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                disabled={editMutation.isPending}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Close edit category modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="newName" className="block text-sm font-medium text-slate-700">
                  New category name
                </label>
                <input
                  id="newName"
                  type="text"
                  required
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={editMutation.isPending}
                />
              </div>
              <div>
                <label htmlFor="slaHours" className="block text-sm font-medium text-slate-700">
                  SLA Hours
                </label>
                <input
                  id="slaHours"
                  type="number"
                  required
                  value={slaHours}
                  onChange={(event) => setSlaHours(event.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={editMutation.isPending}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  disabled={editMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancel
                </button>
                <CanPerformAction permission={PermissionKeys.MailBoxesEdit}>
                  <button
                    type="submit"
                    disabled={editMutation.isPending || !token}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {editMutation.isPending ? "Saving..." : "Save changes"}
                  </button>
                </CanPerformAction>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isDeleteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteMutation.isPending) {
              setIsDeleteModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-category-title" className="text-xl font-semibold text-slate-900">
                  Delete email category
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Emails assigned to this category will be cleared unless you move them to another category first.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteMutation.isPending}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Close delete category modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDeleteSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="newCategoryId" className="block text-sm font-medium text-slate-700">
                  Move emails to another category
                </label>
                <select
                  id="newCategoryId"
                  value={newCategoryId}
                  onChange={(event) => setNewCategoryId(event.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={deleteMutation.isPending || otherCategoriesData?.length === 0}
                >
                  <option value="">Do not move emails</option>
                  {otherCategoriesData?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteMutation.isPending || !token}
                  className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-rose-600 transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
