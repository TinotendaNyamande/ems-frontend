"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useConfirm } from "@/context/useConfirm";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";
import { ProtectedPage } from "@/components/ProtectedPage";
import { CanPerformAction } from "@/components/CanPerformAction";
import { useAuth } from "@/context/AuthContext";
import { PermissionKeys } from "@/contants/PermissionKey";
import {
  DeleteMatrix,
  GetByOrganisation,
  type EmailCategoryMatrixDto,
} from "@/services/emailcategorymatrix";

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

export default function EmailCategoryMatrixDetailsPage() {
  const params = useParams<{ id: string }>();
  const matrixId = params.id;
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const organisationId = user?.organisationId ?? "";

  const matrixQueryKey = useMemo(
    () => ["emailCategoryMatrix", organisationId, token],
    [organisationId, token]
  );

  const {
    data: matrices,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: matrixQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token && matrixId),
    queryFn: () => GetByOrganisation(organisationId, token!),
  });

  const matrixList = (matrices ?? []) as EmailCategoryMatrixDto[];
  const matrix = matrixList.find((item: EmailCategoryMatrixDto) => item.id === matrixId) ?? null;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return DeleteMatrix(id, token);
    },
    onSuccess: async () => {
      enqueueSnackbar("Email category assignment deleted successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: matrixQueryKey });
    },
    onError: (deleteError: unknown) => {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete email category assignment. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete assignment",
      message: "This will remove the matrix entry from the organisation.",
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
          Loading email category assignment...
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
                <Link
                  href="/email-settings/email-category-matrix"
                  className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-900"
                >
                  Back to matrix
                </Link>
                <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-slate-950">
                  Assignment details
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Review the category-to-user mapping and delete it when the assignment is no longer
                  needed.
                </p>
              </div>
              {matrix ? (
                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  Assignment
                </span>
              ) : null}
            </div>
          </section>

          {isLoading ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm text-slate-700">Loading assignment details...</p>
            </section>
          ) : isError ? (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold text-rose-900">Failed to load assignment</p>
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
          ) : matrix ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </p>
                  <p className="mt-2 break-words text-lg font-semibold text-slate-900">
                    {matrix.userFirstName || matrix.userLastName
                      ? [matrix.userFirstName, matrix.userLastName].filter(Boolean).join(" ").trim()
                      : matrix.userid}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </p>
                  <p className="mt-2 break-words text-lg font-semibold text-slate-900">
                    {matrix.categoryName}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {matrix.isAvailable ? "Available" : "Unavailable"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last assigned
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatDate(matrix.lastAssignedDate)}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/email-settings/email-category-matrix/user/${matrix.userid}`}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    User view
                  </Link>
                  <Link
                    href={`/email-settings/email-categories/${matrix.categoryId}`}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    Category details
                  </Link>
                  <CanPerformAction permission={PermissionKeys.MailBoxesDelete}>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-rose-600 transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete assignment"}
                    </button>
                  </CanPerformAction>
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold text-slate-900">Assignment not found</p>
              <p className="mt-1 text-sm text-slate-600">
                This matrix entry could not be found in the current organisation.
              </p>
              <Link
                href="/email-settings/email-category-matrix"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Back to matrix
              </Link>
            </section>
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}
