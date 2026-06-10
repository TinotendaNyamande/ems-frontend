import { PermissionKey } from "@/contants/PermissionKey";
import { useAuth } from "@/context/AuthContext";
import { canAccessResource } from "@/services/roles";

export function CanPerformAction({
    permission,
    children,
    fallback = null,
}: {
    permission: PermissionKey;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const { user } = useAuth();
    const hasPermission = canAccessResource(user?.permissions, permission);
    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
