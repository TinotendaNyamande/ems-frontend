import { BASE_URL } from "./helper"

export type EmailCategoryMatrixDto = {
    id: string,
    categoryName: string,
    categoryId: string,
    userFirstName: string,
    userLastName: string,
    userid: string,
    isAvailable: boolean,
    lastAssignedDate?: string | null
}

export type CreateMatrixDto = {
    userId: string,
    emailCategoryId: string
}
export const CreateMatrix = async (matrix: CreateMatrixDto, token: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/EmailCategoryUserMatrix`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body:JSON.stringify(matrix)
    })
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to create email category assignment.");
        }
    }
}

export const DeleteMatrix = async (id:string, token: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/EmailCategoryUserMatrix/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to delete email category assignment.");
        }
    }
}

export const GetById= async (id:string, token: string): Promise<EmailCategoryMatrixDto | EmailCategoryMatrixDto[]> => {
    const response = await fetch(`${BASE_URL}/EmailCategoryUserMatrix/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to fetch email category assignment.");
        }
    }
    const data = await response.json();
    return data;
}
export const GetByUser= async (userId:string, token: string): Promise<EmailCategoryMatrixDto[]> => {
    const response = await fetch(`${BASE_URL}/EmailCategoryUserMatrix/by-user/${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to fetch email category assignments for user.");
        }
    }
    const data = await response.json();
    return data;
}
export const GetByOrganisation= async (organisationId:string, token: string): Promise<EmailCategoryMatrixDto[]> => {
    const response = await fetch(`${BASE_URL}/EmailCategoryUserMatrix/by-organisation/${organisationId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to fetch email category assignments for organisation.");
        }
    }
    const data = await response.json();
    return data;
}
