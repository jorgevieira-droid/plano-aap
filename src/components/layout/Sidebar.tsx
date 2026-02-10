import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, School, Users, UserCheck, Calendar, ClipboardList, 
  BarChart3, LogOut, Menu, X, GraduationCap, FileText, UserCog, 
  TrendingUp, Printer, Link2, History
} from 'lucide-react';
import { useAuth, RoleTier } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState, createContext, useContext, ReactNode } from 'react';

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

// N1 Admin - full access
const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Users, label: 'Professores / Coordenadores', path: '/professores' },
  { icon: UserCheck, label: 'AAPs / Formadores', path: '/aaps' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: TrendingUp, label: 'Evolução Professor', path: '/evolucao-professor' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: Printer, label: 'Lista de Presença', path: '/lista-presenca' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
  { icon: UserCog, label: 'Usuários', path: '/usuarios' },
  { icon: Link2, label: 'Integração Notion', path: '/notion-sync' },
];

// N2 Gestor / N3 Coordenador do Programa - manage within programs
const managerMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Users, label: 'Professores / Coordenadores', path: '/professores' },
  { icon: UserCheck, label: 'AAPs / Formadores', path: '/aaps' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: TrendingUp, label: 'Evolução Professor', path: '/evolucao-professor' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: Printer, label: 'Lista de Presença', path: '/lista-presenca' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
];

// N4.1 CPed / N4.2 GPI / N5 Formador - operational within entities
const operationalMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Meu Painel', path: '/aap/dashboard' },
  { icon: Calendar, label: 'Meu Calendário', path: '/aap/calendario' },
  { icon: FileText, label: 'Registrar Ação', path: '/aap/registrar' },
  { icon: ClipboardList, label: 'Histórico', path: '/aap/historico' },
  { icon: TrendingUp, label: 'Evolução Professor', path: '/aap/evolucao' },
  { icon: Users, label: 'Professores / Coordenadores', path: '/professores' },
  { icon: Printer, label: 'Lista de Presença', path: '/lista-presenca' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
];

// N6 Coord Pedagógico / N7 Professor - local, view only their entity
const localMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: TrendingUp, label: 'Evolução', path: '/evolucao-professor' },
  { icon: Printer, label: 'Lista de Presença', path: '/lista-presenca' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
];

// N8 Equipe Técnica - observer, read-only by program
const observerMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Users, label: 'Professores / Coordenadores', path: '/professores' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: TrendingUp, label: 'Evolução Professor', path: '/evolucao-professor' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: History, label: 'Histórico Presença', path: '/historico-presenca' },
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
  // Legacy
  aap_inicial: 'AAP / Formador Anos Iniciais',
  aap_portugues: 'AAP / Formador Língua Portuguesa',
  aap_matematica: 'AAP / Formador Matemática',
};

function SidebarContent() {
  const { profile, logout, isAdmin, roleTier } = useAuth();
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebarState();
  
  const menuItems = getMenuItems(roleTier, isAdmin);

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
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg hover:bg-sidebar-accent transition-colors"
        title={isOpen ? 'Recolher menu' : 'Expandir menu'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        data-tour="sidebar-menu"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 h-screen bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">{getProgramLabel()}</h1>
            </div>
          </div>
        </div>

        <Link 
          to="/perfil" 
          onClick={() => setIsOpen(false)}
          className="block p-4 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors"
          data-tour="user-profile"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-semibold">
              {profile?.nome?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-sidebar-foreground truncate">{profile?.nome || 'Carregando...'}</p>
              <p className="text-xs text-sidebar-foreground/60">{getRoleLabel()}</p>
            </div>
          </div>
        </Link>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin min-h-0">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "sidebar-item",
                  isActive && "sidebar-item-active"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border mt-auto shrink-0">
          <button
            onClick={logout}
            className="sidebar-item w-full text-error hover:bg-error/10"
          >
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
      <div className="min-h-screen flex w-full bg-background">
        <SidebarContent />
        <main className={cn(
          "flex-1 min-h-screen overflow-y-auto transition-all duration-300 ease-in-out",
          isOpen ? "ml-72" : "ml-0"
        )}>
          <div className="p-4 lg:p-8 pt-16">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar() {
  return <SidebarContent />;
}