import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, School, Users, UserCheck, Calendar, ClipboardList,
  BarChart3, LogOut, Menu, X, UserCog,
  TrendingUp, Printer, Link2, History, Grid3X3, SlidersHorizontal, AlertTriangle, BookOpen, Eye, Building2, FileSpreadsheet, Download,
} from 'lucide-react';
import { useAuth, RoleTier, AppRole, ProgramaType } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState, createContext, useContext, ReactNode } from 'react';
import { usePendencias } from '@/hooks/usePendencias';
import { ALL_ROLES } from '@/config/roleConfig';
import { useAcoesByPrograma } from '@/hooks/useAcoesByPrograma';
import { AcaoTipo } from '@/config/acaoPermissions';
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
  disabled?: boolean;
  /** Tiers that may see this item. If omitted, all tiers may see it (still subject to program filters). */
  allowedTiers?: RoleTier[];
  /** Item is shown only if at least one of these action types is enabled for the user's program(s). */
  requiresAcao?: AcaoTipo[];
  /** Item is shown only if at least one instrument is enabled for the user's program(s). */
  requiresAnyInstrument?: boolean;
  /** Item is shown only if at least one Formação-type action is enabled. */
  requiresFormacao?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
  /** When true, only real admin (N1) sees this group. */
  adminOnly?: boolean;
}

const ALL_TIERS: RoleTier[] = ['admin', 'manager', 'operational', 'local', 'observer'];

const MASTER_GROUPS: MenuGroup[] = [
  {
    label: 'Ferramentas de Gestão',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', allowedTiers: ['admin', 'manager', 'observer'] },
      { icon: LayoutDashboard, label: 'Painel', path: '/dashboard', allowedTiers: ['local'] },
      { icon: LayoutDashboard, label: 'Meu Painel', path: '/aap/dashboard', allowedTiers: ['operational'] },
      { icon: Calendar, label: 'Programação', path: '/programacao', allowedTiers: ['admin', 'manager', 'local', 'observer'] },
      { icon: Calendar, label: 'Meu Calendário', path: '/aap/calendario', allowedTiers: ['operational'] },
      { icon: ClipboardList, label: 'Registros', path: '/registros', allowedTiers: ALL_TIERS },
      { icon: FileSpreadsheet, label: 'Relatório de Instrumentos', path: '/relatorio-instrumentos', allowedTiers: ['admin', 'manager'], requiresAnyInstrument: true },
      { icon: BarChart3, label: 'Relatórios Narrativos', path: '/relatorios-narrativos', allowedTiers: ['admin', 'manager'], requiresAnyInstrument: true },
      { icon: BarChart3, label: 'Relatórios Gerais', path: '/relatorios', allowedTiers: ['admin', 'manager', 'observer'] },
      { icon: History, label: 'Histórico Presença', path: '/historico-presenca', allowedTiers: ALL_TIERS, requiresFormacao: true },
      { icon: AlertTriangle, label: 'Pendências', path: '/pendencias', allowedTiers: ['admin', 'manager'] },
      { icon: ClipboardList, label: 'Rel. Regionais', path: '/relatorio-regionais', allowedTiers: ['admin', 'manager'], requiresAcao: ['monitoramento_acoes_formativas', 'monitoramento_gestao'] },
      { icon: ClipboardList, label: 'Rel. Consultoria Pedagógica', path: '/relatorio-consultoria', allowedTiers: ['admin', 'manager', 'operational'], requiresAcao: ['registro_consultoria_pedagogica'] },
      { icon: ClipboardList, label: 'Visualização Apoio Presencial', path: '/visualizacao-apoio-presencial', allowedTiers: ['admin', 'manager'], requiresAcao: ['registro_apoio_presencial'] },
      { icon: ClipboardList, label: 'Visualização Consultoria', path: '/visualizacao-consultoria', allowedTiers: ['admin', 'manager'], requiresAcao: ['registro_consultoria_pedagogica'] },
      { icon: Printer, label: 'Lista de Presença', path: '/lista-presenca', allowedTiers: ['admin', 'manager', 'operational', 'local'], requiresFormacao: true },
    ],
  },
  {
    label: 'Admin',
    items: [
      { icon: UserCog, label: 'Usuários', path: '/usuarios', allowedTiers: ['admin'] },
      { icon: Users, label: 'Atores dos Programas', path: '/atores', allowedTiers: ['admin', 'manager'] },
      { icon: UserCheck, label: 'Consultor / Gestor / Formador', path: '/aaps', allowedTiers: ['admin', 'manager'] },
      { icon: Users, label: 'Atores Educacionais', path: '/professores', allowedTiers: ['admin', 'manager', 'operational', 'observer'] },
      { icon: School, label: 'Escola / Regional / Rede', path: '/escolas', allowedTiers: ALL_TIERS },
      { icon: Building2, label: 'Entidades Filho', path: '/entidades-filho', allowedTiers: ['admin', 'manager'] },
      { icon: History, label: 'Histórico de Alterações', path: '/historico-alteracoes', allowedTiers: ['admin', 'manager'] },
      { icon: Download, label: 'Extração de Bases - Instrumentos', path: '/extracao-bases-instrumentos', allowedTiers: ['admin', 'manager'] },
      { icon: BarChart3, label: 'Relatório de Acessos', path: '/relatorio-acessos', allowedTiers: ['admin', 'manager', 'operational'] },
    ],
  },
  {
    label: 'Configuração',
    items: [
      { icon: SlidersHorizontal, label: 'Configurar Formulário', path: '/admin/configurar-formulario', allowedTiers: ['admin'] },
      { icon: Grid3X3, label: 'Matriz de Ações', path: '/matriz-acoes', allowedTiers: ['admin', 'manager', 'operational'] },
      { icon: Link2, label: 'Integração Notion', path: '/notion-sync', allowedTiers: ['admin'] },
      { icon: BookOpen, label: 'Manual do Usuário', path: '/manual', allowedTiers: ALL_TIERS },
    ],
  },
  {
    label: 'Desabilitados',
    adminOnly: true,
    items: [
      { icon: TrendingUp, label: 'Evolução Professor', path: '/evolucao-professor', disabled: true },
      { icon: Eye, label: 'Pontos Observados', path: '/pontos-observados', disabled: true },
    ],
  },
];

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
  const { profile, logout, isAdmin, roleTier, isRealAdmin, isSimulating, simulatedRole, setSimulatedRole, simulatedPrograma, setSimulatedPrograma, effectiveProgramas } = useAuth();
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebarState();
  const { count: pendenciasCount } = usePendencias();
  const { isAcaoEnabledForPrograma, getInstrumentFormTypesByPrograma, getAcoesByPrograma } = useAcoesByPrograma();

  const userProgramas = (effectiveProgramas && effectiveProgramas.length > 0)
    ? effectiveProgramas
    : (profile?.programas && profile.programas.length > 0 ? profile.programas : []);

  const FORMACAO_TIPOS_SET = new Set<AcaoTipo>([
    'formacao',
    'acompanhamento_formacoes',
    'participa_formacoes',
    'encontro_eteg_redes',
    'encontro_professor_redes',
    'encontro_microciclos_recomposicao',
  ]);

  const itemVisibleForPrograms = (item: MenuItem): boolean => {
    if (isAdmin) return true;
    if (!item.requiresAcao && !item.requiresAnyInstrument && !item.requiresFormacao) return true;
    if (userProgramas.length === 0) return false;

    return userProgramas.some(programa => {
      if (item.requiresAcao && item.requiresAcao.length > 0) {
        if (item.requiresAcao.some(tipo => isAcaoEnabledForPrograma(tipo, programa))) return true;
      }
      if (item.requiresAnyInstrument) {
        if (getInstrumentFormTypesByPrograma(programa).length > 0) return true;
      }
      if (item.requiresFormacao) {
        const enabled = getAcoesByPrograma(programa);
        if (enabled.some(t => FORMACAO_TIPOS_SET.has(t))) return true;
      }
      return false;
    });
  };

  const tierOk = (item: MenuItem): boolean => {
    if (isAdmin) return true;
    if (!item.allowedTiers) return true;
    return item.allowedTiers.includes(roleTier);
  };

  const visibleGroups = MASTER_GROUPS
    .filter(g => !g.adminOnly || isAdmin)
    .map(g => ({ ...g, items: g.items.filter(i => tierOk(i) && itemVisibleForPrograms(i)) }))
    .filter(g => g.items.length > 0);

  const simulationRoles = ALL_ROLES.filter(r => r.value !== 'admin' && !r.value.startsWith('aap_'));
  const getRoleLabel = () => roleLabels[profile?.role || ''] || '';

  const getProgramLabel = () => {
    const programa = isSimulating && simulatedPrograma
      ? simulatedPrograma
      : (isAdmin ? null : profile?.programas?.[0]);
    if (!programa) return isAdmin ? 'Gestão' : 'Programa';
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

            <div className="mb-2 mt-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60">
              <Eye size={14} />
              <span>Simular programa</span>
            </div>
            <Select
              value={simulatedPrograma || 'all'}
              onValueChange={(val) => setSimulatedPrograma(val === 'all' ? null : val as ProgramaType)}
              disabled={!simulatedRole}
            >
              <SelectTrigger className="h-8 border-sidebar-border bg-sidebar-accent/30 text-xs text-sidebar-foreground disabled:opacity-50" title={!simulatedRole ? 'Selecione um perfil para simular' : undefined}>
                <SelectValue placeholder="Todos os programas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os programas</SelectItem>
                <SelectItem value="escolas">Escolas</SelectItem>
                <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
          {visibleGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={`${group.label}-${item.path}-${item.label}`}
                    to={item.path}
                    className={cn('sidebar-item', isActive && 'sidebar-item-active')}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                    {item.disabled && (
                      <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Desabilitada
                      </span>
                    )}
                    {item.path === '/pendencias' && pendenciasCount > 0 && (
                      <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                        {pendenciasCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
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
