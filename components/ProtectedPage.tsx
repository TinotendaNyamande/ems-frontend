import { useAuth } from "@/context/AuthContext";
import { canAccessResource } from "@/services/roles";
import { AccessDenied } from "./AccessDenied";
import { PermissionKey } from "@/contants/PermissionKey";

export function ProtectedPage({
  permission,
  children,
}: {
  permission: PermissionKey;
  children: React.ReactNode;
}) {
    const{user} = useAuth();
  const  hasPermission  = canAccessResource(user?.permissions, permission);

  if (!hasPermission) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
