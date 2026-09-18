"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuth } from "@/context/AuthContext";
import {
  changeEmailAccountClientSecret,
  changeEmailAccountPassword,
  ChangePasswordDto,
  ChangeSecretDto,
  CreateEmailAccountPayload,
  deleteEmailAccount,
  EmailType,
  getEmailAccountById,
  testEmailAccount,
  validateEmailAccount,
  type EmailAccountDto,
} from "@/services/emailAccounts";
import { ProtectedPage } from "@/components/ProtectedPage";
import { PermissionKeys } from "@/contants/PermissionKey";
import { CanPerformAction } from "@/components/CanPerformAction";
import { useConfirm } from "@/context/useConfirm";

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

function getDateLabel(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

function getEmailTypeValue(value: EmailAccountDto["emailType"]) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return EmailType.Gmail;
  }

  return numericValue as EmailType;
}

function getEditFormFromEmailAccount(emailAccount: EmailAccountDto) {
  return {
    emailAddress: emailAccount.emailAddress ?? "",
    emailType: getEmailTypeValue(emailAccount.emailType),
    password: "",
    clientId: emailAccount.clientId ?? "",
    clientSecret: "",
    tenantId: emailAccount.tenantId ?? "",
  };
}

export default function EmailAccountDetailsPage() {
  const params = useParams<{ id: string }>();

  const router = useRouter();
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const emailAccountId = params.id;
  const emailAccountQueryKey = useMemo(
    () => ["emailAccount", emailAccountId, token],
    [emailAccountId, token]
  );
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newSecret, setNewSecret] = useState("");

  const {
    data: emailAccount,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: emailAccountQueryKey,
    enabled: isAuthReady && Boolean(emailAccountId && token),
    queryFn: () => getEmailAccountById(emailAccountId, token as string),
  });

  const refreshemailAccount = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: emailAccountQueryKey }),
      queryClient.invalidateQueries({ queryKey: ["emailAccounts"] }),
    ]);
  };

  const changePasswordMutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }
      var changePasswordPayload: ChangePasswordDto = {
        newPassword: newPassword,
        oldPassword: emailAccount?.password || "",
        emailId: emailAccountId
      }

      return changeEmailAccountPassword(emailAccountId, changePasswordPayload, token);
    },
    onSuccess: async () => {
      setIsEditModalOpen(false);
      enqueueSnackbar("Email Account updated successfully.", { variant: "success" });
      await refreshemailAccount();
    },
    onError: (updateError: unknown) => {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update Email Account. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const changeSecretMutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }
      var changeSecretPayload: ChangeSecretDto = {
        newSecret: newSecret,
        oldSecret: emailAccount?.clientSecret || "",
        emailId: emailAccountId
      }

      return changeEmailAccountClientSecret(emailAccountId, changeSecretPayload, token);
    },
    onSuccess: async () => {
      setIsEditModalOpen(false);
      enqueueSnackbar("Email Account updated successfully.", { variant: "success" });
      await refreshemailAccount();
    },
    onError: (updateError: unknown) => {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update Email Account. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }
      await refreshemailAccount();
      return validateEmailAccount(emailAccountId, token);
    },
    onSuccess: () => {
      enqueueSnackbar("Email Account validated successfully.", { variant: "success" });
    },
    onError: (validateError: unknown) => {
      const message =
        validateError instanceof Error
          ? validateError.message
          : "Failed to validate Email Account. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return deleteEmailAccount(emailAccountId, token);
    },
    onSuccess: async () => {
      enqueueSnackbar("Email Account deleted successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: ["emailAccounts"] });
      router.push("/email-accounts");
    },
    onError: (deleteError: unknown) => {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete Email Account. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: (payload: { toEmail: string }) => {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      return testEmailAccount(emailAccountId, payload, token);
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
    changePasswordMutation.isPending ||
    changeSecretMutation.isPending ||
    validateMutation.isPending ||
    deleteMutation.isPending ||
    testEmailMutation.isPending;

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const confirmed = await confirm({
      title: "Save",
      message: "Are you sure you want to save these changes",
      confirmText: "Save",
      cancelText: "Cancel"
    })
    if (!confirmed) {
      return;
    }

    const payload: Partial<CreateEmailAccountPayload> = {
      emailAddress: editForm.emailAddress.trim(),
      emailType: selectedEmailType
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
    if (editForm.emailType == EmailType.Office365) {
      changeSecretMutation.mutate();
    } else {
      changePasswordMutation.mutate();
    }

  };

  const handleTestEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    testEmailMutation.mutate({ toEmail: toEmail.trim() });
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete email account",
      message: "This action cannot be undone",
      confirmText: "Delete",
      cancelText: "Cancel"
    })
    if (!confirmed) {
      return;
    }

    deleteMutation.mutate();
  };

  const openEditModal = () => {
    if (emailAccount) {
      setEditForm(getEditFormFromEmailAccount(emailAccount));
    }

    setIsEditModalOpen(true);
  };

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Loading Email Account...
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
              <Link
                href="/email-accounts"
                className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-900"
              >
                Back to Email Accounts
              </Link>
              <h1 className="mt-3 break-all text-3xl font-semibold tracking-tight text-slate-950">
                {emailAccount?.emailAddress || "Email Account details details"}
              </h1>
            </div>

            {emailAccount ? (
              <>
   
                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  <Link href={`/email-accounts/${emailAccount.id}/email-categories`}>
                    Email Categories
                  </Link>
                </span>
                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  <Link href={`/email-accounts/${emailAccount.id}/user-assignment-management`}>
                    User Assignment Management
                  </Link>
                </span>
              </>
            ) : null}
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm sm:p-8">
            Loading Email Account details...
          </section>
        ) : isError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-rose-900">Failed to load Email Account</p>
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
        ) : emailAccount ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email address
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-950">
                    {emailAccount.emailAddress || "Not available"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email type
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {getEmailTypeLabel(emailAccount.emailType)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Has been validated
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {emailAccount.isValidated ? "True" : "False"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {getDateLabel(emailAccount.createdAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Updated
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {getDateLabel(emailAccount.lastUpdatedAt)}
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
                  {emailAccount.emailType == 1 || emailAccount.emailType == 2 ? "Change Password" : "Change App Secret"}
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
            <p className="text-sm font-semibold text-slate-900">Email Account found</p>
            <Link
              href="/email-accounts"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Back to Email Accounts
            </Link>
          </section>
        )}

        {isEditModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !changePasswordMutation.isPending && !changeSecretMutation.isPending) {
                setIsEditModalOpen(false);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-emailAccount-title"
              className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="edit-emailAccount-title" className="text-xl font-semibold text-slate-900">
                    Edit Email Account
                  </h2>

                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={changePasswordMutation.isPending || changeSecretMutation.isPending}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Close edit Email Account modal"
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
                    readOnly
                    value={emailAccount?.emailAddress}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-gray-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>

                <div>
                  <label htmlFor="editEmailType" className="block text-sm font-medium text-slate-700">
                    Email type
                  </label>
                  <input
                    id="editEmailType"
                    readOnly
                    value={EMAIL_TYPES.find((t) => t.value === emailAccount?.emailType)?.label}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-gray-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>

                {!usesOAuthSettings ? (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                      Old Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      readOnly
                      value={emailAccount?.password || ""}
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-gray-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={changePasswordMutation.isPending || changeSecretMutation.isPending}
                    />
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>
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
                        value={emailAccount?.clientId || ""}
                        readOnly
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, clientId: event.target.value }))
                        }
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-gray-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={changePasswordMutation.isPending || changeSecretMutation.isPending}
                      />
                    </div>
                    <div>
                      <label htmlFor="editTenantId" className="block text-sm font-medium text-slate-700">
                        Tenant ID
                      </label>
                      <input
                        id="editTenantId"
                        type="text"
                        value={emailAccount?.tenantId || ""}
                        readOnly
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, tenantId: event.target.value }))
                        }
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-gray-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={changePasswordMutation.isPending || changeSecretMutation.isPending}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="editClientSecret"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Old Client secret
                      </label>
                      <input
                        id="editClientSecret"
                        type="password"
                        readOnly
                        value={emailAccount?.clientSecret || ""}
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-gray-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={changePasswordMutation.isPending || changeSecretMutation.isPending}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="newClientSecret"
                        className="block text-sm font-medium text-slate-700"
                      >
                        New Client secret
                      </label>
                      <input
                        id="newClientSecret"
                        type="password"
                        value={newSecret}
                        onChange={(event) =>
                          setNewSecret(event.target.value)

                        }
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={changePasswordMutation.isPending || changeSecretMutation.isPending}
                      />
                    </div>


                  </>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={changePasswordMutation.isPending || changeSecretMutation.isPending}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel
                  </button>
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending || changeSecretMutation.isPending}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {changePasswordMutation.isPending || changeSecretMutation.isPending ? "Saving..." : "Save changes"}
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
