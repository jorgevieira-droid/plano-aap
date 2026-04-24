import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, School, Users, UserCheck, Calendar, ClipboardList,
  BarChart3, LogOut, Menu, X, GraduationCap, FileText, UserCog,
  TrendingUp, Printer, Link2, History, Grid3X3, SlidersHorizontal, AlertTriangle, BookOpen, Eye, Building2,
} from 'lucide-react';
import { useAuth, RoleTier, AppRole } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState, createContext, useContext, ReactNode } from 'react';
import { usePendencias } from '@/hooks/usePendencias';
import { ALL_ROLES } from '@/config/roleConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({ isOpen: true, setIsOpen: () => {} });
export const useSidebarState = () => useContext(SidebarContext);

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Registrar Ação', path: '/aap/registrar' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Building2, label: 'Entidades Filho', path: '/entidades-filho' },
  { icon: Users, label: 'Atores dos Programas', path: '/atores' },
  { icon: Users, label: 'Atores Educacionais', path: '/professores' },
  { icon: UserCheck, label: 'Consultor / Gestor / Formador', path: '/aaps' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: AlertTriangle, label: 'Pendências', path: '/pendencias' },
  { icon: TrendingUp, label: 'Evolução Professor', path: '/evolucao-professor' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
  { icon: Eye, label: 'Pontos Observados', path: '/pontos-observados' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: ClipboardList, label: 'Rel. Consultoria Pedagógica', path: '/relatorio-consultoria' },
  { icon: Printer, label: 'Lista de Presença', path: '/lista-presenca' },
  { icon: Grid3X3, label: 'Matriz de Ações', path: '/matriz-acoes' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: UserCog, label: 'Usuários', path: '/usuarios' },
  { icon: BarChart3, label: 'Relatório de Acessos', path: '/relatorio-acessos' },
  { icon: SlidersHorizontal, label: 'Configurar Formulário', path: '/admin/configurar-formulario' },
  { icon: Link2, label: 'Integração Notion', path: '/notion-sync' },
  { icon: BookOpen, label: 'Manual do Usuário', path: '/manual' },
];

const managerMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Building2, label: 'Entidades Filho', path: '/entidades-filho' },
  { icon: Users, label: 'Atores Educacionais', path: '/professores' },
  { icon: UserCheck, label: 'Consultor / Gestor / Formador', path: '/aaps' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: TrendingUp, label: 'Evolução Professor', path: '/evolucao-professor' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: ClipboardList, label: 'Rel. Consultoria Pedagógica', path: '/relatorio-consultoria' },
  { icon: Printer, label: 'Lista de Presença', path: '/lista-presenca' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
  { icon: AlertTriangle, label: 'Pendências', path: '/pendencias' },
  { icon: Grid3X3, label: 'Matriz de Ações', path: '/matriz-acoes' },
  { icon: Users, label: 'Atores dos Programas', path: '/atores' },
  { icon: Eye, label: 'Pontos Observados', path: '/pontos-observados' },
  { icon: BarChart3, label: 'Relatório de Acessos', path: '/relatorio-acessos' },
  { icon: BookOpen, label: 'Manual do Usuário', path: '/manual' },
];

const operationalMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Meu Painel', path: '/aap/dashboard' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Calendar, label: 'Meu Calendário', path: '/aap/calendario' },
  { icon: ClipboardList, label: 'Histórico', path: '/aap/historico' },
  { icon: TrendingUp, label: 'Evolução Professor', path: '/aap/evolucao' },
  { icon: Users, label: 'Atores Educacionais', path: '/professores' },
  { icon: Printer, label: 'Lista de Presença', path: '/lista-presenca' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
  { icon: Grid3X3, label: 'Matriz de Ações', path: '/matriz-acoes' },
  { icon: Eye, label: 'Pontos Observados', path: '/pontos-observados' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: ClipboardList, label: 'Rel. Consultoria Pedagógica', path: '/relatorio-consultoria' },
  { icon: Users, label: 'Atores dos Programas', path: '/atores' },
  { icon: BarChart3, label: 'Relatório de Acessos', path: '/relatorio-acessos' },
  { icon: BookOpen, label: 'Manual do Usuário', path: '/manual' },
];

const localMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: TrendingUp, label: 'Evolução', path: '/evolucao-professor' },
  { icon: Printer, label: 'Lista de Presença', path: '/lista-presenca' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
  { icon: Users, label: 'Atores dos Programas', path: '/atores' },
  { icon: BookOpen, label: 'Manual do Usuário', path: '/manual' },
];

const observerMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Users, label: 'Atores Educacionais', path: '/professores' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: TrendingUp, label: 'Evolução Professor', path: '/evolucao-professor' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
  { icon: Users, label: 'Atores dos Programas', path: '/atores' },
  { icon: BookOpen, label: 'Manual do Usuário', path: '/manual' },
];


function getMenuItems(roleTier: RoleTier, isAdmin: boolean): MenuItem[] {
  if (isAdmin) return adminMenuItems;
  switch (roleTier) {
    case 'admin': return adminMenuItems;
    case 'manager': return managerMenuItems;
    case 'operational': return operationalMenuItems;
    case 'local': return localMenuItems;
    case 'observer': return observerMenuItems;
    default: return localMenuItems;
  }
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor do Programa',
  n3_coordenador_programa: 'Coordenador do Programa',
  n4_1_cped: 'Consultor Pedagógico (CPed)',
  n4_2_gpi: 'Gestor de Parceria (GPI)',
  n5_formador: 'Formador',
  n6_coord_pedagogico: 'Coordenador Pedagógico',
  n7_professor: 'Professor',
  n8_equipe_tecnica: 'Equipe Técnica (SME)',
  aap_inicial: 'Consultor / Gestor / Formador Anos Iniciais',
  aap_portugues: 'Consultor / Gestor / Formador Língua Portuguesa',
  aap_matematica: 'Consultor / Gestor / Formador Matemática',
};

function SidebarContent() {
  const { profile, logout, isAdmin, roleTier, isRealAdmin, isSimulating, simulatedRole, setSimulatedRole } = useAuth();
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebarState();
  const { count: pendenciasCount } = usePendencias();

  const allMenuItems = getMenuItems(roleTier, isAdmin);
  const menuItems = roleTier === 'operational' && profile?.role === 'n5_formador'
    ? allMenuItems.filter(item => item.path !== '/pontos-observados')
    : allMenuItems;


  const simulationRoles = ALL_ROLES.filter(r => r.value !== 'admin' && !r.value.startsWith('aap_'));
  const getRoleLabel = () => roleLabels[profile?.role || ''] || '';

  const getProgramLabel = () => {
    if (isAdmin) return 'Gestão';
    const programa = profile?.programas?.[0];
    switch (programa) {
      case 'escolas': return 'Escolas';
      case 'regionais': return 'Regionais de Ensino';
      case 'redes_municipais': return 'Redes Municipais';
      default: return 'Programa';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-sidebar p-2 text-sidebar-foreground shadow-lg transition-colors hover:bg-sidebar-accent"
        title={isOpen ? 'Recolher menu' : 'Expandir menu'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside
        data-tour="sidebar-menu"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-sidebar-border p-6 pl-14">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-sidebar-foreground">{getProgramLabel()}</h1>
            <img src="/logo-bussola-vertical-branco.png" alt="Olhar Parceiro" className="h-10 w-auto" />
          </div>
        </div>

        <Link
          to="/perfil"
          onClick={() => setIsOpen(false)}
          className="block border-b border-sidebar-border p-4 transition-colors hover:bg-sidebar-accent/50"
          data-tour="user-profile"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent font-semibold text-sidebar-primary">
              {profile?.nome?.charAt(0) || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{profile?.nome || 'Carregando...'}</p>
              <p className="text-xs text-sidebar-foreground/60">{getRoleLabel()}</p>
            </div>
          </div>
        </Link>

        {isRealAdmin && (
          <div className="border-b border-sidebar-border px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60">
              <Eye size={14} />
              <span>Simular perfil</span>
            </div>
            <Select
              value={simulatedRole || 'none'}
              onValueChange={(val) => setSimulatedRole(val === 'none' ? null : val as AppRole)}
            >
              <SelectTrigger className="h-8 border-sidebar-border bg-sidebar-accent/30 text-xs text-sidebar-foreground">
                <SelectValue placeholder="Normal (Admin)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Normal (Admin)</SelectItem>
                {simulationRoles.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn('sidebar-item', isActive && 'sidebar-item-active')}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {item.path === '/pendencias' && pendenciasCount > 0 && (
                    <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                      {pendenciasCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

        </nav>

        <div className="mt-auto shrink-0 border-t border-sidebar-border p-4">
          <button onClick={logout} className="sidebar-item w-full text-error hover:bg-error/10">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="flex min-h-screen w-full bg-background">
        <SidebarContent />
        <main className={cn(
          'flex-1 min-w-0 min-h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'ml-72' : 'ml-0',
        )}>
          <div className="p-4 pt-16 lg:p-8">{children}</div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar() {
  return <SidebarContent />;
}
