import { BASE_URL } from "./helper";

export const createOrganisation = async (name: string,ownerId:string|undefined|null,token:string) => {
  const response = await fetch(`${BASE_URL}/organisation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name, ownerId}),
  });
  if(!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to create organisation.");
  }
}
export const getOrganisation = async (organisationId: string,token:string|null) => {
  if (!token) {
    throw new Error("Authentication token is missing");
  }

  const response = await fetch(`${BASE_URL}/organisation/${organisationId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if(!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to fetch organisation.");
  }
  return response.json();
}

export const deleteOrganisation = async (organisationId: string,token:string|null) => {
  if (!token) {
    throw new Error("Authentication token is missing");
  }
  const response = await fetch(`${BASE_URL}/organisation/${organisationId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if(!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to delete organisation.");
  }
}

export const renameOrganisation = async (organisationId: string, newName: string,token:string|null) => {
  if (!token) {
    throw new Error("Authentication token is missing");
  }
  const response = await fetch(`${BASE_URL}/organisation/rename/${organisationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ organisationId: organisationId, newOrganisationName: newName })
  });
  if(!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to rename organisation.");
  }
}
export const ChangeOwner = async (organisationId: string, newOwnerId: string,token:string|null) => {
  if (!token) {
    throw new Error("Authentication token is missing");
  }
  const response = await fetch(`${BASE_URL}/organisation/change-owner/${organisationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({organisationId, newOwnerId })
  });
  if(!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to change organisation owner.");
  }
}
