import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  UserCheck, 
  Calendar, 
  ClipboardList, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  GraduationCap,
  FileText,
  UserCog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState, createContext, useContext, ReactNode } from 'react';

// Context to share sidebar state
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({ isOpen: true, setIsOpen: () => {} });

export const useSidebarState = () => useContext(SidebarContext);

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Users, label: 'Professores / Coordenadores', path: '/professores' },
  { icon: UserCheck, label: 'AAPs / Formadores', path: '/aaps' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: UserCog, label: 'Usuários', path: '/usuarios' },
];

const gestorMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
  { icon: Users, label: 'Professores / Coordenadores', path: '/professores' },
  { icon: UserCheck, label: 'AAPs / Formadores', path: '/aaps' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
];

const aapMenuItems = [
  { icon: LayoutDashboard, label: 'Meu Painel', path: '/aap/dashboard' },
  { icon: Calendar, label: 'Meu Calendário', path: '/aap/calendario' },
  { icon: FileText, label: 'Registrar Ação', path: '/aap/registrar' },
  { icon: ClipboardList, label: 'Histórico', path: '/aap/historico' },
  { icon: Users, label: 'Professores / Coordenadores', path: '/professores' },
];

function SidebarContent() {
  const { profile, logout, isAdmin, isGestor } = useAuth();
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebarState();
  
  const menuItems = isAdmin ? adminMenuItems : isGestor ? gestorMenuItems : aapMenuItems;

  const getRoleLabel = () => {
    switch (profile?.role) {
      case 'admin': return 'Administrador';
      case 'gestor': return 'Gestor';
      case 'aap_inicial': return 'AAP / Formador Anos Iniciais';
      case 'aap_portugues': return 'AAP / Formador Língua Portuguesa';
      case 'aap_matematica': return 'AAP / Formador Matemática';
      default: return '';
    }
  };

  const getProgramLabel = () => {
    if (isAdmin) {
      return 'Gestão';
    }
    
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
      {/* Menu toggle button - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg hover:bg-sidebar-accent transition-colors"
        title={isOpen ? 'Recolher menu' : 'Expandir menu'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay - only on mobile when open */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 h-screen bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
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

        {/* User info */}
        <Link 
          to="/perfil" 
          onClick={() => setIsOpen(false)}
          className="block p-4 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors"
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

        {/* Navigation */}
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

        {/* Logout */}
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

// Provider component that wraps the entire layout
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

// Legacy export for backwards compatibility
export function Sidebar() {
  return <SidebarContent />;
}
