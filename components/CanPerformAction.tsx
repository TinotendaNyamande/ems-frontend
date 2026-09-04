import { useAuth } from "@/context/AuthContext";
import { canAccessResource } from "@/services/roles";

export function CanPerformAction({
    permission,
    children,
    fallback = null,
}: {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const { user } = useAuth();
    const hasPermission = canAccessResource(user?.role, permission);
    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
