import { BASE_URL } from "./helper";

export type PermissionDto= {
    id: string;
    permissionKey: string;
    isAllowed: boolean;
    organisationRoleId: string;
}

export type  RoleDto = {
    id: string;
    roleName: string;
    permissions: PermissionDto[];
}
export const getRolesForOrganisation = async (organisationId: string,token:string): Promise<RoleDto[]> => {
    const response = await fetch(`${BASE_URL}/roles/organisation/${organisationId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Failed to fetch roles");
    }
    return response.json() as Promise<RoleDto[]>;
}

export const getCompanyRoles = getRolesForOrganisation;

export const editPermissionForRole = async (token: string, permissionId:string, permission: PermissionDto): Promise<void> => {
    const response = await fetch(`${BASE_URL}/roles/permissions/update/${permissionId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(permission)
    });
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Failed to edit role permissions");
    }
};

