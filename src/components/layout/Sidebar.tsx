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
import { useState } from 'react';

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: School, label: 'Escolas', path: '/escolas' },
  { icon: Users, label: 'Professores', path: '/professores' },
  { icon: UserCheck, label: 'AAPs / Formadores', path: '/aaps' },
  { icon: Calendar, label: 'Programação', path: '/programacao' },
  { icon: ClipboardList, label: 'Registros', path: '/registros' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: UserCog, label: 'Usuários', path: '/usuarios' },
];

const gestorMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: School, label: 'Escolas', path: '/escolas' },
  { icon: Users, label: 'Professores', path: '/professores' },
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
];

export function Sidebar() {
  const { profile, logout, isAdmin, isGestor } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
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

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">Programa</h1>
              <p className="text-xs text-sidebar-foreground/60">de Escolas</p>
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
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
        <div className="p-4 border-t border-sidebar-border">
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
