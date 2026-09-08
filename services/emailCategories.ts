import { BASE_URL } from "./helper"

export type CreateEmailCategoryDto = {
    emailAccountId: string,
    categoryName: string
}
export type EmailCategoryDto = {
    id: string,
    emailAccountId: string,
    categoryName: string,
    slaHours: number
}

export const CreateEmailCategory = async (emailCategory: CreateEmailCategoryDto, token: string) => {
    const response = await fetch(`${BASE_URL}/emailcategories`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(emailCategory)
    })
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to create email category");
        }

    }
}
export const GetEmailCategoryById = async (id: string, token: string): Promise<EmailCategoryDto> => {
    const response = await fetch(`${BASE_URL}/emailcategories/${id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to fetch email category");
        }

    }
    const data = await response.json();
    return data;
}


export const GetEmailCategoriesByEmailAccount = async (emailAccountId: string, token: string): Promise<EmailCategoryDto[]> => {
    const response = await fetch(`${BASE_URL}/emailcategories/by-email-account/${emailAccountId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to fetch email categories for organisation");
        }

    }
    const data = await response.json();
    return data;
}
export const DeleteEmailCategory = async (id: string, token: string, newCategoryId?: string | null) => {
    const searchParams = new URLSearchParams();
    if (newCategoryId) {
        searchParams.set("newCategoryId", newCategoryId);
    }

    const response = await fetch(
        `${BASE_URL}/emailcategories/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
        {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        }
    )
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to delete email category");
        }

    }
}

export const EditEmailCategory = async ( id: string,newName: string,slaHours: number, token: string) => {
    const response = await fetch(`${BASE_URL}/emailcategories/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ newName, slaHours })
    })
    if (!response.ok) {
        const errors = await response.json();

        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to rename email category");
        }

    }
}
