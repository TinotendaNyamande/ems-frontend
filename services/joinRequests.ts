import { BASE_URL } from "./helper";

export type CreateJoinRequestDto = {
    requestById: string,
    organisationId: string

}
export type ApproveJoinRequestDto = {
    requestId: string,
    organisationId: string,
    approvingUserId: string,
    roleId: string
}
export type RejectJoinRequestDto = {
    requestId: string,
    organisationId: string,
    rejectingUserId: string,
}
export type JoinRequestUserDto = {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    organisationId: string | null,
    role: string
}
export type JoinRequestDto = {
    id: string,
    requestedBy: JoinRequestUserDto,
    requestedAt: string,
    status: string,
    approvedBy?: JoinRequestUserDto | null,
    approvedAt?: string | null,
    rejectedBy?: JoinRequestUserDto | null,
    rejectedAt?: string | null,
}
export const createJoinRequest = async (CreateJoinRequestDto: CreateJoinRequestDto, token: string) => {
    const response = await fetch(`${BASE_URL}/JoinRequests`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(CreateJoinRequestDto),
    });

    if (!response.ok) {
        const errors = await response.json();
        if (errors.errors) {
            console.log("Errors", errors)
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            console.log("Errors", message)
            throw new Error(message)
        }else {
            throw new Error(errors.detail || "Failed to submit join request. Please try again.")
        }

    }
}

export const getOrganisationJoinRequests = async (organisationId: string, token: string): Promise<JoinRequestDto[]> => {
    const response = await fetch(`${BASE_URL}/JoinRequests/all/${organisationId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail)
    }
    return data;
}

export const deleteJoinRequest = async (requestId: string, token: string) => {
    const response = await fetch(`${BASE_URL}/JoinRequests/${requestId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail)
    }
}

export const approveJoinRequest = async (requestId: string, approveJoinRequestDto: ApproveJoinRequestDto, token: string) => {
    const response = await fetch(`${BASE_URL}/JoinRequests/approve/${requestId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(approveJoinRequestDto),
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail)
    }
}
export const rejectJoinRequest = async (requestId: string, rejectJoinRequestDto: RejectJoinRequestDto, token: string) => {
    const response = await fetch(`${BASE_URL}/JoinRequests/reject/${requestId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rejectJoinRequestDto),
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail)
    }
}
export const getUserJoinRequests = async (userId: string, token: string): Promise<JoinRequestDto[]> => {
    const response = await fetch(`${BASE_URL}/JoinRequests/user/${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail)
    }
    return data;
}
export const getOrganisationPendingJoinRequests = async (organisationId: string, token: string): Promise<JoinRequestDto[]> => {
    const response = await fetch(`${BASE_URL}/JoinRequests/pending/${organisationId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail)
    }
    return data;
}