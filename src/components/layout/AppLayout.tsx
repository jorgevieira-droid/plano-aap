import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth, RoleTier } from '@/contexts/AuthContext';
import { SidebarProvider } from './Sidebar';
import { ForcePasswordChangeDialog } from '@/components/auth/ForcePasswordChangeDialog';
import { roleLabelsMap } from '@/config/roleConfig';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Allowed routes per tier
const ALLOWED_ROUTES: Record<RoleTier, string[]> = {
  admin: [], // empty = allow all (includes /matriz-acoes)
  manager: [
    '/dashboard', '/perfil', '/escolas', '/professores', '/aaps',
    '/programacao', '/registros', '/evolucao-professor', '/relatorios',
    '/lista-presenca', '/historico-presenca', '/pendencias', '/matriz-acoes', '/manual', '/atores',
  ],
  operational: [
    '/perfil', '/aap/dashboard', '/aap/calendario', '/aap/registrar',
    '/aap/historico', '/aap/evolucao', '/professores',
    '/lista-presenca', '/historico-presenca', '/matriz-acoes', '/manual', '/atores',
  ],
  local: [
    '/dashboard', '/perfil', '/programacao', '/registros',
    '/evolucao-professor', '/lista-presenca', '/historico-presenca', '/manual', '/atores',
  ],
  observer: [
    '/dashboard', '/perfil', '/escolas', '/professores', '/programacao',
    '/registros', '/evolucao-professor', '/relatorios', '/historico-presenca', '/manual', '/atores',
  ],
};

function getDefaultRoute(tier: RoleTier): string {
  if (tier === 'operational') return '/aap/dashboard';
  return '/dashboard';
}

export function AppLayout() {
  const { isAuthenticated, isLoading, mustChangePassword, profile, refreshProfile, roleTier, isSimulating, simulatedRole, setSimulatedRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Route protection: check if current route is allowed for this tier
  const allowedRoutes = ALLOWED_ROUTES[roleTier];
  if (allowedRoutes.length > 0 && !allowedRoutes.includes(location.pathname)) {
    return <Navigate to={getDefaultRoute(roleTier)} replace />;
  }

  const simulatedLabel = simulatedRole ? (roleLabelsMap[simulatedRole] || simulatedRole) : '';

  return (
    <SidebarProvider>
      {/* Simulation banner */}
      {isSimulating && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-warning/15 border-b border-warning/30 px-4 py-2 flex items-center justify-center gap-3">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span className="text-sm font-medium text-warning">
            Simulando perfil: {simulatedLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-warning/30 text-warning hover:bg-warning/10"
            onClick={() => setSimulatedRole(null)}
          >
            <X className="h-3 w-3 mr-1" />
            Encerrar
          </Button>
        </div>
      )}
      <Outlet />
      
      {/* Force password change dialog */}
      <ForcePasswordChangeDialog 
        open={mustChangePassword} 
        onSuccess={refreshProfile}
        userName={profile?.nome?.split(' ')[0]}
      />
    </SidebarProvider>
  );
}
