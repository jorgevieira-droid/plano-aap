import type { AppRole, ProgramaType } from '@/contexts/AuthContext';

export const ALL_ROLES: { value: AppRole; label: string; tier: string; level: number }[] = [
  { value: 'admin', label: 'N1 — Administrador', tier: 'admin', level: 1 },
  { value: 'gestor', label: 'N2 — Gestor do Programa', tier: 'manager', level: 2 },
  { value: 'n3_coordenador_programa', label: 'N3 — Coordenador do Programa', tier: 'manager', level: 3 },
  { value: 'n4_1_cped', label: 'N4.1 — Consultor Pedagógico (CPed)', tier: 'operational', level: 4 },
  { value: 'n4_2_gpi', label: 'N4.2 — Gestor de Parceria (GPI)', tier: 'operational', level: 4 },
  { value: 'n5_formador', label: 'N5 — Formador', tier: 'operational', level: 5 },
  { value: 'n6_coord_pedagogico', label: 'N6 — Coordenador Pedagógico', tier: 'local', level: 6 },
  { value: 'n7_professor', label: 'N7 — Professor / Direção', tier: 'local', level: 7 },
  { value: 'n8_equipe_tecnica', label: 'N8 — Equipe Técnica (SME)', tier: 'observer', level: 8 },
  // Legacy
  { value: 'aap_inicial', label: 'AAP Anos Iniciais (legado)', tier: 'operational', level: 4 },
  { value: 'aap_portugues', label: 'AAP Língua Portuguesa (legado)', tier: 'operational', level: 4 },
  { value: 'aap_matematica', label: 'AAP Matemática (legado)', tier: 'operational', level: 4 },
];

export const roleLabelsMap: Record<string, string> = {};
ALL_ROLES.forEach(r => { roleLabelsMap[r.value] = r.label; });

export const ROLES_WITH_PROGRAMAS: AppRole[] = [
  'gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'n8_equipe_tecnica', 'aap_inicial', 'aap_portugues', 'aap_matematica',
];

export const ROLES_WITH_ENTIDADES: AppRole[] = [
  'n4_1_cped', 'n4_2_gpi', 'n5_formador', 'n6_coord_pedagogico', 'n7_professor',
  'aap_inicial', 'aap_portugues', 'aap_matematica',
];

export function needsProgramas(role: AppRole | 'none'): boolean {
  return role !== 'none' && ROLES_WITH_PROGRAMAS.includes(role as AppRole);
}

export function needsEntidades(role: AppRole | 'none'): boolean {
  return role !== 'none' && ROLES_WITH_ENTIDADES.includes(role as AppRole);
}

export const tierColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  manager: 'bg-warning/10 text-warning border-warning/20',
  operational: 'bg-primary/10 text-primary border-primary/20',
  local: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  observer: 'bg-accent/10 text-accent-foreground border-accent/20',
};

export function getRoleTierColor(role: AppRole | null): string {
  if (!role) return 'bg-muted text-muted-foreground';
  const found = ALL_ROLES.find(r => r.value === role);
  return tierColors[found?.tier || 'local'] || tierColors.local;
}

export function getRoleLevel(role: AppRole | null): number {
  if (!role) return 99;
  const found = ALL_ROLES.find(r => r.value === role);
  return found?.level ?? 99;
}

export const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Regionais de Ensino',
  redes_municipais: 'Redes Municipais',
};

// Minimum level the current user can SEE
export function getMinVisibleLevel(myLevel: number): number {
  switch (myLevel) {
    case 1: return 1; // N1 sees all
    case 2: return 3; // N2 sees N3-N8
    case 3: return 4; // N3 sees N4-N8
    case 4: return 5; // N4 sees N5-N8
    case 5: return 6; // N5 sees N6-N8
    case 6: return 7; // N6 sees N7-N8
    case 7: return 7; // N7 sees N7-N8
    case 8: return 7; // N8 sees N7-N8
    default: return 99;
  }
}

// Can this user manage others?
export function canManageOthers(myLevel: number): boolean {
  return myLevel <= 5; // N1 through N5 can manage
}
