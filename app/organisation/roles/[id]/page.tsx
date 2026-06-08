"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";
import { useAuth } from "@/context/AuthContext";
import {
  editPermissionForRole,
  getRolesForOrganisation,
  type PermissionDto,
  type RoleDto,
} from "@/services/roles";

function formatPermissionLabel(permissionKey: string) {
  return permissionKey
    .replace(/[_:.-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function countAllowedPermissions(role: RoleDto) {
  return role.permissions.filter((permission) => permission.isAllowed).length;
}

export default function OrganisationRoleDetailsPage() {
  const params = useParams<{ id: string }>();
  const roleId = params.id;
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const organisationId = user?.organisationId ?? "";
  const rolesQueryKey = ["organisationRoles", organisationId, token];

  const {
    data: roles,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: rolesQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token && roleId),
    queryFn: () => getRolesForOrganisation(organisationId, token!),
  });

  const role = roles?.find((item) => item.id === roleId) ?? null;

  const editPermissionsMutation = useMutation({
    mutationFn: ({
      permissionId,
      permission,
    }: {
      permissionId: string;
      permission: PermissionDto;
    }) => editPermissionForRole(token!, permissionId, permission),
    onSuccess: async () => {
      enqueueSnackbar("Permission updated successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update permission.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const handlePermissionToggle = (permission: PermissionDto) => {
    if (!role) return;

    const nextPermission = { ...permission, isAllowed: !permission.isAllowed };

    editPermissionsMutation.mutate({
      permissionId: permission.id,
      permission: nextPermission,
    });
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

  const allowedCount = role ? countAllowedPermissions(role) : 0;
  const totalCount = role?.permissions.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                Role details
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {role?.roleName ?? "Organisation role"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review every permission on this role and change whether it is allowed.
              </p>
            </div>
            <Link
              href="/organisation/roles"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Back to roles
            </Link>
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-700">Loading role permissions...</p>
          </section>
        ) : isError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-900">Could not load role</p>
            <p className="mt-1 text-sm text-rose-800">
              {(error as Error)?.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              Retry
            </button>
          </section>
        ) : !role ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Role not found</p>
            <p className="mt-1 text-sm text-slate-600">
              This role is not available for the current organisation.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
                <p className="mt-2 break-words text-lg font-semibold text-slate-900">
                  {role.roleName}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Allowed
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {allowedCount} permissions
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {totalCount} permissions
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Permissions</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Change whether each permission is allowed for this role.
                </p>
              </div>

              {role.permissions.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-semibold text-slate-900">No permissions on this role</p>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {role.permissions.map((permission) => {
                    const isSaving =
                      editPermissionsMutation.isPending &&
                      editPermissionsMutation.variables?.permissionId === permission.id;

                    return (
                      <label
                        key={permission.id}
                        className="flex min-h-24 cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm transition hover:bg-white"
                      >
                        <input
                          type="checkbox"
                          checked={permission.isAllowed}
                          disabled={isSaving}
                          onChange={() => handlePermissionToggle(permission)}
                          className="mt-1 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900">
                            {formatPermissionLabel(permission.permissionKey)}
                          </span>
                          <span className="mt-1 block break-all text-xs text-slate-500">
                            {permission.permissionKey}
                          </span>
                          <span
                            className={[
                              "mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                              permission.isAllowed
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                : "bg-slate-100 text-slate-600 ring-slate-200",
                            ].join(" ")}
                          >
                            {permission.isAllowed ? "Allowed" : "Not allowed"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
