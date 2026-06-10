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
import { AssignUserRole, CreateUser, getAllUsers, type CreateUserRequest, type User } from "@/services/users";
import { ProtectedPage } from "@/components/ProtectedPage";
import { PermissionKeys } from "@/contants/PermissionKey";
import { CanPerformAction } from "@/components/CanPerformAction";

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
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserRoleId, setNewUserRoleId] = useState("");
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

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


  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      AssignUserRole(token!, userId, roleId),
    onSuccess: async (_data, variables) => {
      enqueueSnackbar("User role updated successfully.", { variant: "success" });
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[variables.userId];
        return next;
      });
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

  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserRequest) => CreateUser(token!, userData),
    onSuccess: async () => {
      enqueueSnackbar("User created and added to organisation successfully.", { variant: "success" });
      setIsAddUserModalOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserRoleId("");
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create user.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      enqueueSnackbar("Email and password are required.", { variant: "error" });
      return;
    }

    const selectedRole = roles?.find((role) => role.id === newUserRoleId);

    const payload: CreateUserRequest = {
      email: newUserEmail,
      password: newUserPassword,
      firstName: newUserFirstName || undefined,
      lastName: newUserLastName || undefined,
      organisationId: organisationId,
      role: selectedRole ? selectedRole.roleName : undefined,
    };

    createUserMutation.mutate(payload);
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
        <ProtectedPage permission={PermissionKeys.UsersView}>
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
              <div className="flex items-center gap-3">
                <CanPerformAction permission={PermissionKeys.UsersCreate}>
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
                  >
                    Add User
                  </button>
                </CanPerformAction>
                <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                  {users?.length ?? 0} users
                </span>
              </div>
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
                              <div className="mt-6">
                <div className="hidden md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.4fr)] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 border border-slate-200 rounded-t-2xl">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Current Role</span>
                  <span>Change Role</span>
                  <span></span>
                </div>
                                <ul className="divide-y divide-slate-200 border border-slate-200 rounded-b-2xl md:rounded-none md:border-t-0 bg-white">
                  {users?.map((organisationUser) => {
                    const userRoleId = getUserRoleId(organisationUser);
                    const pendingRoleId = pendingRoles[organisationUser.id];
                    const selectedRoleId = pendingRoleId ?? userRoleId;
                    const hasChanged = pendingRoleId !== undefined && pendingRoleId !== userRoleId;
                    const isSaving =
                      assignRoleMutation.isPending &&
                      assignRoleMutation.variables?.userId === organisationUser.id;

                    return (
                      <li
                        key={organisationUser.id}
                                                className="px-4 py-4"
                      >
                                                <div className="space-y-3 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.4fr)] md:gap-4 md:space-y-0 md:items-center">
                          <div>
                            <p className="text-xs font-medium text-slate-500 md:hidden">Name</p>
                            <p className="font-semibold text-slate-900">
                              {organisationUser.firstName} {organisationUser.lastName}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-500 md:hidden">Email</p>
                            <p className="break-all text-slate-700">
                              {organisationUser.email}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-500 md:hidden">Current Role</p>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {getUserRoleName(organisationUser, roles ?? [])}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-500 md:hidden">Change Role</p>
                            <select
                              aria-label={`Change role for ${getUserDisplayName(organisationUser)}`}
                              value={selectedRoleId}
                              disabled={isSaving || !roles?.length}
                              onChange={(event) => {
                                const roleId = event.target.value;
                                setPendingRoles((prev) => ({ ...prev, [organisationUser.id]: roleId }));
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
                          </div>

                          <div>
                            {hasChanged && (
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                  assignRoleMutation.mutate({
                                    userId: organisationUser.id,
                                    roleId: pendingRoleId,
                                  });
                                }}
                                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 cursor-pointer"
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                            )}
                          </div>
                        </div>
                                              </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
                  </main>

        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Add User to Organisation</h3>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateUserSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">First Name</label>
                    <input
                      type="text"
                      value={newUserFirstName}
                      onChange={(e) => setNewUserFirstName(e.target.value)}
                      placeholder="John"
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Last Name</label>
                    <input
                      type="text"
                      value={newUserLastName}
                      onChange={(e) => setNewUserLastName(e.target.value)}
                      placeholder="Doe"
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 font-medium">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 font-medium">Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Role</label>
                  <select
                    value={newUserRoleId}
                    onChange={(e) => setNewUserRoleId(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">Select a role (optional)</option>
                    {roles?.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <CanPerformAction permission={PermissionKeys.UsersCreate}>
                    <button
                      type="submit"
                      disabled={createUserMutation.isPending}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                    >
                      {createUserMutation.isPending ? "Creating..." : "Add User"}
                    </button>
                  </CanPerformAction>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}

                      