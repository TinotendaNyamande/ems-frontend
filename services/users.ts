import { BASE_URL } from "./helper";

export type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  organisationId?: string | null;
  Role?: string | null;
  role?: string | null;
  roleId?: string | null;
  organisationRoleId?: string | null;
};
export type CreateUserRequest = {
  email: string;
  firstName?: string;
  lastName?: string;
  organisationId?: string;
  password?: string;
  role?: string;
};
export const getUserProfile = async (token: string,userId: string): Promise<User> => {
  const response = await fetch(`${BASE_URL}/users/profile/${userId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return response.json() as Promise<User>;
};

export const getAllUsers = async (token: string, organisationId?: string): Promise<User[]> => {
  const response = await fetch(`${BASE_URL}/users/organisation/${organisationId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json() as Promise<User[]>;
};
export const CreateUser = async (token: string, userData: CreateUserRequest): Promise<void> => {
  const response = await fetch(`${BASE_URL}/users/create`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    throw new Error("Failed to create user");
  }
};

export const AssignUserRole = async (token: string, userId: string, roleId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/users/assign-role`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userId,roleId })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Failed to assign user role");
  }
};
