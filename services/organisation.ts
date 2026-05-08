
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
