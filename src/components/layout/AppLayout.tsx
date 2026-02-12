import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth, RoleTier } from '@/contexts/AuthContext';
import { SidebarProvider } from './Sidebar';
import { ForcePasswordChangeDialog } from '@/components/auth/ForcePasswordChangeDialog';

// Allowed routes per tier
const ALLOWED_ROUTES: Record<RoleTier, string[]> = {
  admin: [], // empty = allow all (includes /matriz-acoes)
  manager: [
    '/dashboard', '/perfil', '/escolas', '/professores', '/aaps',
    '/programacao', '/registros', '/evolucao-professor', '/relatorios',
    '/lista-presenca', '/historico-presenca', '/pendencias', '/matriz-acoes', '/manual',
  ],
  operational: [
    '/perfil', '/aap/dashboard', '/aap/calendario', '/aap/registrar',
    '/aap/historico', '/aap/evolucao', '/professores',
    '/lista-presenca', '/historico-presenca', '/matriz-acoes', '/manual',
  ],
  local: [
    '/dashboard', '/perfil', '/programacao', '/registros',
    '/evolucao-professor', '/lista-presenca', '/historico-presenca', '/manual',
  ],
  observer: [
    '/dashboard', '/perfil', '/escolas', '/professores', '/programacao',
    '/registros', '/evolucao-professor', '/relatorios', '/historico-presenca', '/manual',
  ],
};

function getDefaultRoute(tier: RoleTier): string {
  if (tier === 'operational') return '/aap/dashboard';
  return '/dashboard';
}

export function AppLayout() {
  const { isAuthenticated, isLoading, mustChangePassword, profile, refreshProfile, roleTier } = useAuth();
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

  return (
    <SidebarProvider>
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
