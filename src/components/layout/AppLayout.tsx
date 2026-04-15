import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth, RoleTier } from '@/contexts/AuthContext';
import { SidebarProvider } from './Sidebar';
import { ForcePasswordChangeDialog } from '@/components/auth/ForcePasswordChangeDialog';
import { roleLabelsMap } from '@/config/roleConfig';
import { AlertTriangle, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ALLOWED_ROUTES: Record<RoleTier, string[]> = {
  admin: [],
  manager: [
    '/dashboard', '/perfil', '/escolas', '/professores', '/aaps',
    '/programacao', '/registros', '/evolucao-professor', '/relatorios',
    '/lista-presenca', '/historico-presenca', '/pendencias', '/matriz-acoes', '/manual', '/atores',
    '/pontos-observados', '/relatorio-consultoria', '/unauthorized',
  ],
  operational: [
    '/perfil', '/aap/dashboard', '/aap/calendario', '/aap/registrar',
    '/aap/historico', '/aap/evolucao', '/professores',
    '/lista-presenca', '/historico-presenca', '/matriz-acoes', '/manual', '/atores',
    '/pontos-observados', '/registros', '/relatorio-consultoria', '/unauthorized',
  ],
  local: [
    '/dashboard', '/perfil', '/programacao', '/registros',
    '/evolucao-professor', '/lista-presenca', '/historico-presenca', '/manual', '/atores',
    '/unauthorized',
  ],
  observer: [
    '/dashboard', '/perfil', '/escolas', '/professores', '/programacao',
    '/registros', '/evolucao-professor', '/relatorios', '/historico-presenca', '/manual', '/atores',
    '/unauthorized',
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoutes = ALLOWED_ROUTES[roleTier];
  if (allowedRoutes.length > 0 && !allowedRoutes.includes(location.pathname)) {
    return <Navigate to={getDefaultRoute(roleTier)} replace />;
  }

  const simulatedLabel = simulatedRole ? (roleLabelsMap[simulatedRole] || simulatedRole) : '';

  return (
    <SidebarProvider>
      {isSimulating && (
        <div className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-center gap-3 border-b border-warning/30 bg-warning/15 px-4 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <span className="text-sm font-medium text-warning">
            Simulando perfil: {simulatedLabel}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 shrink-0 cursor-help text-warning/70" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Simulação aplica validação de permissões no cliente. Dados exibidos podem diferir do usuário real, pois os vínculos (programas/escolas) são os do administrador.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-warning/30 text-xs text-warning hover:bg-warning/10"
            onClick={() => setSimulatedRole(null)}
          >
            <X className="mr-1 h-3 w-3" />
            Encerrar
          </Button>
        </div>
      )}
      <Outlet />

      <ForcePasswordChangeDialog
        open={mustChangePassword}
        onSuccess={refreshProfile}
        userName={profile?.nome?.split(' ')[0]}
      />
    </SidebarProvider>
  );
}
