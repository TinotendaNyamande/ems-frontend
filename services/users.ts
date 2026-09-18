import { BASE_URL } from "./helper";

export type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
};
export type CreateUserRequest = {
  email: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: string;
};
export const getUserById = async (token: string,userId: string): Promise<User> => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
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

export const getAllUsers = async (token: string): Promise<User[]> => {
  const response = await fetch(`${BASE_URL}/users`, {
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
  const response = await fetch(`${BASE_URL}/users/create-user`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        }else {
            throw new Error(errors.detail || "Failed to submit join request. Please try again.")
        }
  }
};

export const AssignUserRole = async (token: string, userId: string, newRole: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/users/change-role`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userId,newRole })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Failed to assign user role");
  }
};
