"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";
import { useAuth } from "@/context/AuthContext";
import {
  deleteEmailConfig,
  EmailType,
  getEmailConfigById,
  testEmailConfig,
  updateEmailConfig,
  validateEmailConfig,
  type CreateEmailConfigPayload,
  type EmailConfigDto,
} from "@/services/emailConfigs";

const EMAIL_TYPES = [
  { value: EmailType.Gmail, label: "Gmail" },
  { value: EmailType.Outlook, label: "Outlook" },
  { value: EmailType.Office365, label: "Office 365" },
];

const emptyEditForm = {
  emailAddress: "",
  emailType: EmailType.Gmail,
  password: "",
  clientId: "",
  clientSecret: "",
  tenantId: "",
};

function getEmailTypeLabel(value: EmailConfigDto["emailType"]) {
  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return EMAIL_TYPES.find((type) => type.value === numericValue)?.label ?? value;
    }

    return value;
  }

  return EMAIL_TYPES.find((type) => type.value === value)?.label ?? "Unknown";
}

function getDateLabel(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

function getEmailTypeValue(value: EmailConfigDto["emailType"]) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return EmailType.Gmail;
  }

  return numericValue as EmailType;
}

function getEditFormFromMailbox(mailbox: EmailConfigDto) {
  return {
    emailAddress: mailbox.emailAddress ?? "",
    emailType: getEmailTypeValue(mailbox.emailType),
    password: "",
    clientId: mailbox.clientId ?? "",
    clientSecret: "",
    tenantId: mailbox.tenantId ?? "",
  };
}

export default function MailboxDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const mailboxId = params.id;
  const organisationId = user?.organisationId ?? "";
  const mailboxQueryKey = useMemo(
    () => ["emailConfig", mailboxId, token],
    [mailboxId, token]
  );
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [toEmail, setToEmail] = useState("");

  const {
    data: mailbox,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: mailboxQueryKey,
    enabled: isAuthReady && Boolean(mailboxId && token),
    queryFn: () => getEmailConfigById(mailboxId, token as string),
  });

  const refreshMailbox = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: mailboxQueryKey }),
      queryClient.invalidateQueries({ queryKey: ["emailConfigs"] }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreateEmailConfigPayload>) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return updateEmailConfig(mailboxId, payload, token);
    },
    onSuccess: async () => {
      setIsEditModalOpen(false);
      enqueueSnackbar("Mailbox updated successfully.", { variant: "success" });
      await refreshMailbox();
    },
    onError: (updateError: unknown) => {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update mailbox. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const validateMutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return validateEmailConfig(mailboxId, token);
    },
    onSuccess: () => {
      enqueueSnackbar("Mailbox validated successfully.", { variant: "success" });
    },
    onError: (validateError: unknown) => {
      const message =
        validateError instanceof Error
          ? validateError.message
          : "Failed to validate mailbox. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return deleteEmailConfig(mailboxId, token);
    },
    onSuccess: async () => {
      enqueueSnackbar("Mailbox deleted successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: ["emailConfigs"] });
      router.push("/mailboxes");
    },
    onError: (deleteError: unknown) => {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete mailbox. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: (payload: { toEmail: string }) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return testEmailConfig(mailboxId, payload, token);
    },
    onSuccess: () => {
      setToEmail("");
      setIsTestModalOpen(false);
      enqueueSnackbar("Test email sent successfully.", { variant: "success" });
    },
    onError: (testError: unknown) => {
      const message =
        testError instanceof Error
          ? testError.message
          : "Failed to send test email. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const selectedEmailType = Number(editForm.emailType);
  const usesOAuthSettings = selectedEmailType === EmailType.Office365;
  const isBusy =
    updateMutation.isPending ||
    validateMutation.isPending ||
    deleteMutation.isPending ||
    testEmailMutation.isPending;

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: Partial<CreateEmailConfigPayload> = {
      emailAddress: editForm.emailAddress.trim(),
      emailType: selectedEmailType,
      organisationId: organisationId || mailbox?.organisationId || "",
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }

    if (editForm.clientId.trim()) {
      payload.clientId = editForm.clientId.trim();
    }

    if (editForm.clientSecret.trim()) {
      payload.clientSecret = editForm.clientSecret.trim();
    }

    if (editForm.tenantId.trim()) {
      payload.tenantId = editForm.tenantId.trim();
    }

    updateMutation.mutate(payload);
  };

  const handleTestEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    testEmailMutation.mutate({ toEmail: toEmail.trim() });
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this mailbox? This action cannot be undone.")) {
      return;
    }

    deleteMutation.mutate();
  };

  const openEditModal = () => {
    if (mailbox) {
      setEditForm(getEditFormFromMailbox(mailbox));
    }

    setIsEditModalOpen(true);
  };

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Loading mailbox...
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/mailboxes"
                className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-900"
              >
                Back to mailboxes
              </Link>
              <h1 className="mt-3 break-all text-3xl font-semibold tracking-tight text-slate-950">
                {mailbox?.emailAddress || "Mailbox details"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Review the mailbox configuration, validate it, send a test email, or update its
                settings.
              </p>
            </div>

            {mailbox ? (
              <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {getEmailTypeLabel(mailbox.emailType)}
              </span>
            ) : null}
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm sm:p-8">
            Loading mailbox details...
          </section>
        ) : isError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-rose-900">Failed to load mailbox</p>
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
        ) : mailbox ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email address
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-950">
                    {mailbox.emailAddress || "Not available"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email type
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {getEmailTypeLabel(mailbox.emailType)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {getDateLabel(mailbox.createdAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Updated
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {getDateLabel(mailbox.lastUpdatedAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={openEditModal}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => validateMutation.mutate()}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-600 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {validateMutation.isPending ? "Validating..." : "Validate"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(true)}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-900 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Send test email
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-rose-600 transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-slate-900">Mailbox not found</p>
            <Link
              href="/mailboxes"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Back to mailboxes
            </Link>
          </section>
        )}

        {isEditModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !updateMutation.isPending) {
                setIsEditModalOpen(false);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-mailbox-title"
              className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="edit-mailbox-title" className="text-xl font-semibold text-slate-900">
                    Edit mailbox
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Leave credential fields blank to keep the current saved values.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={updateMutation.isPending}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Close edit mailbox modal"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="editEmailAddress" className="block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="editEmailAddress"
                    type="email"
                    required
                    value={editForm.emailAddress}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, emailAddress: event.target.value }))
                    }
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={updateMutation.isPending}
                  />
                </div>

                <div>
                  <label htmlFor="editEmailType" className="block text-sm font-medium text-slate-700">
                    Email type
                  </label>
                  <select
                    id="editEmailType"
                    value={editForm.emailType}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        emailType: Number(event.target.value) as EmailType,
                      }))
                    }
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={updateMutation.isPending}
                  >
                    {EMAIL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!usesOAuthSettings ? (
                  <div>
                    <label htmlFor="editPassword" className="block text-sm font-medium text-slate-700">
                      Password or app password
                    </label>
                    <input
                      id="editPassword"
                      type="password"
                      value={editForm.password}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, password: event.target.value }))
                      }
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={updateMutation.isPending}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="editClientId" className="block text-sm font-medium text-slate-700">
                        Client ID
                      </label>
                      <input
                        id="editClientId"
                        type="text"
                        value={editForm.clientId}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, clientId: event.target.value }))
                        }
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={updateMutation.isPending}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="editClientSecret"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Client secret
                      </label>
                      <input
                        id="editClientSecret"
                        type="password"
                        value={editForm.clientSecret}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            clientSecret: event.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={updateMutation.isPending}
                      />
                    </div>

                    <div>
                      <label htmlFor="editTenantId" className="block text-sm font-medium text-slate-700">
                        Tenant ID
                      </label>
                      <input
                        id="editTenantId"
                        type="text"
                        value={editForm.tenantId}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, tenantId: event.target.value }))
                        }
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={updateMutation.isPending}
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending || !token}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {isTestModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !testEmailMutation.isPending) {
                setIsTestModalOpen(false);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="test-email-title"
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="test-email-title" className="text-xl font-semibold text-slate-900">
                    Send test email
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Enter the recipient address for the test message.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  disabled={testEmailMutation.isPending}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Close send test email modal"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleTestEmailSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="toEmail" className="block text-sm font-medium text-slate-700">
                    To email address
                  </label>
                  <input
                    id="toEmail"
                    type="email"
                    required
                    value={toEmail}
                    onChange={(event) => setToEmail(event.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder="recipient@example.com"
                    disabled={testEmailMutation.isPending}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsTestModalOpen(false)}
                    disabled={testEmailMutation.isPending}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={testEmailMutation.isPending || !token}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-900 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {testEmailMutation.isPending ? "Sending..." : "Send test email"}
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
