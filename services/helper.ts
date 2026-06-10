import { PermissionKey } from "@/contants/PermissionKey";
import { UserPermission } from "./roles";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;


export const GetErrorMessageFromStatusCode = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized.Please sign in to continue.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource could not be found.";
    case 500:
      return "Internal Server Error";
    default:
      return "Something went wrong. Please try again.";
  }
};

export const canAccessResource = (permissions: UserPermission[]|undefined, requiredPermissionKey: PermissionKey): boolean => {
    if(!permissions) {
        return false;
    }
    if(requiredPermissionKey === "allow") {
        return true;
    }
    const permission = permissions.find(p => p.permissionKey === requiredPermissionKey);
    return permission ? permission.isAllowed : false;
}