"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuth } from "@/context/AuthContext";
import {
  createEmailAccount,
  EmailType,
  getEmailAccounts,
  type CreateEmailAccountPayload,
  type EmailAccountDto,
} from "@/services/emailAccounts";
import { ProtectedPage } from "@/components/ProtectedPage";
import { PermissionKeys } from "@/contants/PermissionKey";
import { CanPerformAction } from "@/components/CanPerformAction";

const EMAIL_TYPES = [
  { value: EmailType.Gmail, label: "Gmail" },
  { value: EmailType.Outlook, label: "Outlook" },
  { value: EmailType.Office365, label: "Office 365" },
];

const emptyForm = {
  emailAddress: "",
  emailType: EmailType.Gmail,
  password: "",
  clientId: "",
  clientSecret: "",
  tenantId: "",
};

function getEmailTypeLabel(value: EmailAccountDto["emailType"]) {
  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return EMAIL_TYPES.find((type) => type.value === numericValue)?.label ?? value;
    }

    return value;
  }

  return EMAIL_TYPES.find((type) => type.value === value)?.label ?? "Unknown";
}

function getCreatedLabel(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString();
}

export default function MailboxesPage() {
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(emptyForm);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);


  const {
    data: emailAccounts,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["email-accounts"],
    enabled: isAuthReady && Boolean( token),
    queryFn: () => getEmailAccounts( token),
  });

  const createEmailAccountMutation = useMutation({
    mutationFn: (payload: CreateEmailAccountPayload) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return createEmailAccount(payload, token);
    },
    onSuccess: async () => {
      setForm(emptyForm);
      setIsCreateModalOpen(false);
      enqueueSnackbar("Email account created successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
    },
    onError: (createError: unknown) => {
      const message =
        createError instanceof Error
          ? createError.message
          : "Failed to create email account. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const selectedEmailType = Number(form.emailType);
  const isGmail = selectedEmailType === EmailType.Gmail || selectedEmailType === EmailType.Outlook;
  const usesOAuthSettings =
    selectedEmailType === EmailType.Office365;

  const closeCreateModal = () => {
    if (createEmailAccountMutation.isPending) {
      return;
    }

    setIsCreateModalOpen(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isGmail && !form.password.trim()) {
      enqueueSnackbar("Enter the email account password.", { variant: "warning" });
      return;
    }

    if (
      usesOAuthSettings &&
      (!form.clientId.trim() || !form.clientSecret.trim() || !form.tenantId.trim())
    ) {
      enqueueSnackbar("Enter the Microsoft client ID, client secret, and tenant ID.", {
        variant: "warning",
      });
      return;
    }

    createEmailAccountMutation.mutate({
      emailAddress: form.emailAddress.trim(),
      emailType: selectedEmailType,
      password: form.password.trim() || null,
      clientId: form.clientId.trim() || null,
      clientSecret: form.clientSecret.trim() || null,
      tenantId: form.tenantId.trim() || null
    });
  };

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Loading Email accounts...
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

  return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                  Email Management System
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Email Accounts
                </h1>

              </div>

            </div>
          </section>

          <div>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Connected Email Accounts</h2>
                  <p className="mt-1 text-sm text-slate-600">
                   Email accounts configured for sending and receiving organisation email.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                    {emailAccounts?.length ?? 0} total
                  </span>
                  <CanPerformAction permission={PermissionKeys.MailBoxesCreate}>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      Create Email Account
                    </button>
                  </CanPerformAction>
                </div>
              </div>

              {isLoading ? (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                  Loading connected email accounts...
                </div>
              ) : isError ? (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
                  <p className="text-sm font-semibold text-rose-900">Failed to load email accounts</p>
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
              ) : !emailAccounts?.length ? (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">No email accounts connected</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Add your first email account to start sending and receiving organisation email.
                  </p>
                  <CanPerformAction permission={PermissionKeys.MailBoxesCreate}>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      Create Email Account
                    </button>
                  </CanPerformAction>
                </div>
              ) : (
                <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                  {emailAccounts?.map((emailAccount, index) => (
                    <li key={emailAccount.id ?? `${emailAccount.emailAddress}-${index}`} className="bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-all text-sm font-semibold text-slate-900">
                            {emailAccount.emailAddress || "Email account address unavailable"}
                          </p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Created {getCreatedLabel(emailAccount.createdAt)}
                          </p>
                        </div>
                        <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {getEmailTypeLabel(emailAccount.emailType)}
                        </span>
                        {emailAccount.id ? (
                          <CanPerformAction permission={PermissionKeys.MailBoxesEdit}>
                            <Link
                              href={`/email-accounts/${emailAccount.id}`}
                              className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            >
                              View details
                            </Link>
                          </CanPerformAction>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
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
                aria-labelledby="create-email-account-title"
                className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="create-email-account-title" className="text-xl font-semibold text-slate-900">
                      Create email account
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={createEmailAccountMutation.isPending}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    aria-label="Close create email account modal"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="emailAddress" className="block text-sm font-medium text-slate-700">
                      Email address
                    </label>
                    <input
                      id="emailAddress"
                      type="email"
                      required
                      value={form.emailAddress}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, emailAddress: event.target.value }))
                      }
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                      placeholder="support@example.com"
                      disabled={createEmailAccountMutation.isPending}
                    />
                  </div>

                  <div>
                    <label htmlFor="emailType" className="block text-sm font-medium text-slate-700">
                      Email type
                    </label>
                    <select
                      id="emailType"
                      value={form.emailType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          emailType: Number(event.target.value) as EmailType,
                        }))
                      }
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={createEmailAccountMutation.isPending}
                    >
                      {EMAIL_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!usesOAuthSettings && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                        Password or app password
                      </label>
                      <input
                        id="password"
                        type="password"
                        required={isGmail}
                        value={form.password}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, password: event.target.value }))
                        }
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={createEmailAccountMutation.isPending}
                      />
                    </div>
                  )}

                  {usesOAuthSettings ? (
                    <>
                      <div>
                        <label htmlFor="clientId" className="block text-sm font-medium text-slate-700">
                          Client ID
                        </label>
                        <input
                          id="clientId"
                          type="text"
                          required={usesOAuthSettings}
                          value={form.clientId}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, clientId: event.target.value }))
                          }
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={createEmailAccountMutation.isPending}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="clientSecret"
                          className="block text-sm font-medium text-slate-700"
                        >
                          Client secret
                        </label>
                        <input
                          id="clientSecret"
                          type="password"
                          required={usesOAuthSettings}
                          value={form.clientSecret}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, clientSecret: event.target.value }))
                          }
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={createEmailAccountMutation.isPending}
                        />
                      </div>

                      <div>
                        <label htmlFor="tenantId" className="block text-sm font-medium text-slate-700">
                          Tenant ID
                        </label>
                        <input
                          id="tenantId"
                          type="text"
                          required={usesOAuthSettings}
                          value={form.tenantId}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, tenantId: event.target.value }))
                          }
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={createEmailAccountMutation.isPending}
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      disabled={createEmailAccountMutation.isPending}
                      className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Cancel
                    </button>
                      <button
                        type="submit"
                        disabled={createEmailAccountMutation.isPending || !token}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {createEmailAccountMutation.isPending ? "Creating..." : "Create Email Account"}
                      </button>

                  </div>
                </form>
              </section>
            </div>
          ) : null}
        </div>
      </main>
  );
}
