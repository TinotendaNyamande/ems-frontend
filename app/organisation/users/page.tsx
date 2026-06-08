"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { AssignUserRole, getAllUsers, type User } from "@/services/users";

function getUserDisplayName(user: User) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email || "Unnamed user";
}

function getUserRoleId(user: User) {
  return user.roleId || user.organisationRoleId || "";
}

function getUserRoleName(user: User, roles: RoleDto[]) {
  const roleId = getUserRoleId(user);
  const roleFromId = roles.find((role) => role.id === roleId)?.roleName;
  return roleFromId || user.role || user.Role || "No role assigned";
}

function formatPermissionLabel(permissionKey: string) {
  return permissionKey
    .replace(/[_:.-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ErrorPanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
      <p className="text-sm font-semibold text-rose-900">{title}</p>
      <p className="mt-1 text-sm text-rose-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
      >
        Retry
      </button>
    </div>
  );
}

export default function OrganisationUsersPage() {
  const { user, isAuthReady, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const organisationId = user?.organisationId ?? "";
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const usersQueryKey = useMemo(
    () => ["organisationUsers", organisationId, token],
    [organisationId, token]
  );
  const rolesQueryKey = useMemo(
    () => ["organisationRoles", organisationId, token],
    [organisationId, token]
  );

  const {
    data: users,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: usersQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => getAllUsers(token!, organisationId),
  });

  const {
    data: roles,
    isLoading: isRolesLoading,
    isError: isRolesError,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: rolesQueryKey,
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => getRolesForOrganisation(organisationId, token!),
  });

  const selectedRole = roles?.find((role) => role.id === selectedRoleId) ?? roles?.[0] ?? null;

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      AssignUserRole(token!, userId, roleId),
    onSuccess: async () => {
      enqueueSnackbar("User role updated successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update user role.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const editPermissionsMutation = useMutation({
    mutationFn: ({
      permissionId,
      permission,
    }: {
      permissionId: string;
      permission: PermissionDto;
    }) => editPermissionForRole(token!, permissionId, permission),
    onSuccess: async () => {
      enqueueSnackbar("Role permissions updated successfully.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update role permissions.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const handlePermissionToggle = (permission: PermissionDto) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                Organisation access
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Users and permissions
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                View users in this organisation, assign roles, and update the permissions that each role grants.
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Organisation users</h2>
              <p className="mt-1 text-sm text-slate-600">
                Change a user role to adjust their effective permissions.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
              {users?.length ?? 0} users
            </span>
          </div>

          {isUsersLoading || isRolesLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-700">Loading users and roles...</p>
            </div>
          ) : isUsersError ? (
            <div className="mt-6">
              <ErrorPanel
                title="Could not load users"
                message={(usersError as Error)?.message || "An unexpected error occurred."}
                onRetry={() => refetchUsers()}
              />
            </div>
          ) : isRolesError ? (
            <div className="mt-6">
              <ErrorPanel
                title="Could not load roles"
                message={(rolesError as Error)?.message || "An unexpected error occurred."}
                onRetry={() => refetchRoles()}
              />
            </div>
          ) : users?.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">No users found</p>
              <p className="mt-1 text-sm text-slate-600">
                Users linked to this organisation will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(12rem,0.8fr)] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>User</span>
                <span>Current role</span>
                <span>Change role</span>
              </div>
              <ul className="divide-y divide-slate-200">
                {users?.map((organisationUser) => {
                  const userRoleId = getUserRoleId(organisationUser);
                  const isSaving =
                    assignRoleMutation.isPending &&
                    assignRoleMutation.variables?.userId === organisationUser.id;

                  return (
                    <li
                      key={organisationUser.id}
                      className="grid gap-4 px-4 py-4 text-sm text-slate-700 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(12rem,0.8fr)] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {getUserDisplayName(organisationUser)}
                        </p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {organisationUser.email}
                        </p>
                      </div>
                      <div>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {getUserRoleName(organisationUser, roles ?? [])}
                        </span>
                      </div>
                      <select
                        aria-label={`Change role for ${getUserDisplayName(organisationUser)}`}
                        value={userRoleId}
                        disabled={isSaving || !roles?.length}
                        onChange={(event) => {
                          const roleId = event.target.value;
                          if (!roleId || roleId === userRoleId) return;
                          assignRoleMutation.mutate({
                            userId: organisationUser.id,
                            roleId,
                          });
                        }}
                        className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <option value="">Select role</option>
                        {roles?.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.roleName}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Role permissions</h2>
              <p className="mt-1 text-sm text-slate-600">
                Select a role and toggle the permissions granted to users with that role.
              </p>
            </div>
            <select
              aria-label="Select role to edit permissions"
              value={selectedRole?.id ?? ""}
              disabled={isRolesLoading || !roles?.length}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70 lg:max-w-xs"
            >
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName}
                </option>
              ))}
            </select>
          </div>

          {isRolesLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-700">Loading role permissions...</p>
            </div>
          ) : isRolesError ? (
            <div className="mt-6">
              <ErrorPanel
                title="Could not load role permissions"
                message={(rolesError as Error)?.message || "An unexpected error occurred."}
                onRetry={() => refetchRoles()}
              />
            </div>
          ) : !selectedRole ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">No roles found</p>
              <p className="mt-1 text-sm text-slate-600">
                Organisation roles will appear here once they are configured.
              </p>
            </div>
          ) : selectedRole.permissions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">No permissions on this role</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedRole.permissions.map((permission) => {
                const isSaving =
                  editPermissionsMutation.isPending &&
                  editPermissionsMutation.variables?.permissionId === permission.id;

                return (
                  <label
                    key={permission.id}
                    className="flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm transition hover:bg-white"
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
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
