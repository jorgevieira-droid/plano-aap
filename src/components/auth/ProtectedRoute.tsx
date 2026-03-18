import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { canUserCreateAcao, canUserViewAcao, AcaoTipo } from '@/config/acaoPermissions';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionRouteProps {
  children: ReactNode;
  acaoTipo: AcaoTipo;
  permission?: 'create' | 'view';
}

export function PermissionRoute({ children, acaoTipo, permission = 'view' }: PermissionRouteProps) {
  const { isAuthenticated, isLoading, profile, isSimulating, simulatedRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const effectiveRole = isSimulating ? simulatedRole ?? profile?.role : profile?.role;
  const hasAccess = permission === 'create'
    ? canUserCreateAcao(effectiveRole, acaoTipo)
    : canUserViewAcao(effectiveRole, acaoTipo);

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
