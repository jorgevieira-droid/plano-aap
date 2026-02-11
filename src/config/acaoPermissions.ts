import { AppRole } from '@/contexts/AuthContext';
import {
  BookOpen, MapPin, Eye, MessageSquare, ClipboardCheck, Users, BarChart3,
  CalendarClock, Target, Building2, Database, GraduationCap, Award,
  ShieldCheck, TrendingUp, ListChecks,
} from 'lucide-react';

// ── Standardised action types ────────────────────────────────────────────
export type AcaoTipo =
  | 'acompanhamento_formacoes'
  | 'agenda_gestao'
  | 'autoavaliacao'
  | 'devolutiva_pedagogica'
  | 'obs_engajamento_solidez'
  | 'obs_implantacao_programa'
  | 'observacao_aula'
  | 'obs_uso_dados'
  | 'participa_formacoes'
  | 'qualidade_acomp_aula'
  | 'qualidade_implementacao'
  | 'qualidade_atpcs'
  | 'sustentabilidade_programa'
  | 'avaliacao_formacao_participante'
  | 'lista_presenca';

export const ACAO_TIPOS: AcaoTipo[] = [
  'acompanhamento_formacoes',
  'agenda_gestao',
  'autoavaliacao',
  'devolutiva_pedagogica',
  'obs_engajamento_solidez',
  'obs_implantacao_programa',
  'observacao_aula',
  'obs_uso_dados',
  'participa_formacoes',
  'qualidade_acomp_aula',
  'qualidade_implementacao',
  'qualidade_atpcs',
  'sustentabilidade_programa',
  'avaliacao_formacao_participante',
  'lista_presenca',
];

export interface AcaoTypeInfo {
  tipo: AcaoTipo;
  label: string;
  icon: typeof BookOpen;
}

export const ACAO_TYPE_INFO: Record<AcaoTipo, AcaoTypeInfo> = {
  acompanhamento_formacoes:        { tipo: 'acompanhamento_formacoes',        label: 'Acompanhamento Formações',                          icon: BookOpen },
  agenda_gestao:                   { tipo: 'agenda_gestao',                   label: 'Agenda de Gestão',                                  icon: CalendarClock },
  autoavaliacao:                   { tipo: 'autoavaliacao',                   label: 'Autoavaliação',                                     icon: ClipboardCheck },
  devolutiva_pedagogica:           { tipo: 'devolutiva_pedagogica',           label: 'Devolutiva Pedagógica',                             icon: MessageSquare },
  obs_engajamento_solidez:         { tipo: 'obs_engajamento_solidez',         label: 'Observação – Engajamento e Solidez',                icon: Target },
  obs_implantacao_programa:        { tipo: 'obs_implantacao_programa',        label: 'Observação – Implantação do Programa (Por Escola)', icon: Building2 },
  observacao_aula:                 { tipo: 'observacao_aula',                 label: 'Observação de Aula',                                icon: Eye },
  obs_uso_dados:                   { tipo: 'obs_uso_dados',                   label: 'Observação Uso Pedagógico de Dados',                icon: Database },
  participa_formacoes:             { tipo: 'participa_formacoes',             label: 'Participa de Formações',                            icon: GraduationCap },
  qualidade_acomp_aula:            { tipo: 'qualidade_acomp_aula',            label: 'Qualidade Acompanhamento de Aula (Coordenador)',     icon: Award },
  qualidade_implementacao:         { tipo: 'qualidade_implementacao',         label: 'Qualidade da Implementação',                        icon: ShieldCheck },
  qualidade_atpcs:                 { tipo: 'qualidade_atpcs',                 label: 'Qualidade de ATPCs',                                icon: BarChart3 },
  sustentabilidade_programa:       { tipo: 'sustentabilidade_programa',       label: 'Sustentabilidade e Aprendizado do Programa',         icon: TrendingUp },
  avaliacao_formacao_participante: { tipo: 'avaliacao_formacao_participante', label: 'Formulário de Avaliação (Participante)',             icon: Users },
  lista_presenca:                  { tipo: 'lista_presenca',                  label: 'Lista de Presença (Formação)',                       icon: ListChecks },
};

/** Backward compatibility: legacy tipo names → current */
export function normalizeAcaoTipo(tipo: string): AcaoTipo {
  if (tipo === 'acompanhamento_aula') return 'observacao_aula';
  if (tipo === 'formacao') return 'acompanhamento_formacoes';
  if (tipo === 'visita') return 'observacao_aula'; // legacy "visita" maps to observacao
  return tipo as AcaoTipo;
}

export function getAcaoLabel(tipo: string): string {
  // First check ACAO_TYPE_INFO directly (handles legacy keys still used in DB)
  const normalized = normalizeAcaoTipo(tipo);
  return ACAO_TYPE_INFO[normalized]?.label || tipo;
}

// ── Permission model ─────────────────────────────────────────────────────
export type ViewScope = 'proprio' | 'entidade' | 'programa' | 'all';

export interface AcaoPermission {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  viewScope: ViewScope;
}

const NONE: AcaoPermission     = { canCreate: false, canEdit: false, canDelete: false, canView: false, viewScope: 'proprio' };
const VIEW_ENT: AcaoPermission = { canCreate: false, canEdit: false, canDelete: false, canView: true,  viewScope: 'entidade' };
const VIEW_PRG: AcaoPermission = { canCreate: false, canEdit: false, canDelete: false, canView: true,  viewScope: 'programa' };
const CR_OWN: AcaoPermission   = { canCreate: true,  canEdit: false, canDelete: false, canView: true,  viewScope: 'proprio' };
const CR_ENT: AcaoPermission   = { canCreate: true,  canEdit: false, canDelete: false, canView: true,  viewScope: 'entidade' };
const CR_PRG: AcaoPermission   = { canCreate: true,  canEdit: false, canDelete: false, canView: true,  viewScope: 'programa' };
const CRUD_ALL: AcaoPermission = { canCreate: true,  canEdit: true,  canDelete: true,  canView: true,  viewScope: 'all' };
const CRUD_PRG: AcaoPermission = { canCreate: true,  canEdit: true,  canDelete: true,  canView: true,  viewScope: 'programa' };
const CRUD_ENT: AcaoPermission = { canCreate: true,  canEdit: true,  canDelete: true,  canView: true,  viewScope: 'entidade' };

/*
  Permission matrix derived from the spreadsheet "Perfis × Filtros × Eventos".
  
  The spreadsheet marks who can ACCESS each action (X).
  CRUD granularity follows the role tier pattern:
    N1 Admin          → CRUD ALL
    N2/N3 Manager     → CRUD within PROGRAMA
    N4.1/N4.2/N5 Ops  → CRUD within ENTIDADE
    N6 Coord Ped      → CR own / View entidade
    N7 Prof/Vice/Dir  → CR own / View entidade
    N8 Equipe Técnica → CR within PROGRAMA / View programa
*/

function buildRolePerms(
  n1: AcaoPermission, n2: AcaoPermission, n3: AcaoPermission,
  n4_1: AcaoPermission, n4_2: AcaoPermission, n5: AcaoPermission,
  n6: AcaoPermission, n7: AcaoPermission, n8: AcaoPermission,
): Record<AppRole, AcaoPermission> {
  return {
    admin: n1,
    gestor: n2,
    n3_coordenador_programa: n3,
    n4_1_cped: n4_1,
    n4_2_gpi: n4_2,
    n5_formador: n5,
    n6_coord_pedagogico: n6,
    n7_professor: n7,
    n8_equipe_tecnica: n8,
    // Legacy roles → same as N5 operational
    aap_inicial: n5,
    aap_portugues: n5,
    aap_matematica: n5,
  };
}

// ── Permission matrix ────────────────────────────────────────────────────
export const ACAO_PERMISSION_MATRIX: Record<AcaoTipo, Record<AppRole, AcaoPermission>> = {
  // Acompanhamento Formações: Admin, Gerente, Coord Prog, CPed, GPI, Formador
  acompanhamento_formacoes: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE
  ),
  // Agenda de Gestão: Admin, Gerente, Coord Prog, GPI
  agenda_gestao: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, NONE, NONE, NONE, NONE
  ),
  // Autoavaliação: Admin, Gerente, Coord Prog, CPed
  autoavaliacao: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CR_ENT, NONE, NONE, NONE, NONE, NONE
  ),
  // Devolutiva Pedagógica: Admin, Gerente, Coord Prog, CPed
  devolutiva_pedagogica: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, NONE, NONE, NONE, NONE, NONE
  ),
  // Observação – Engajamento e Solidez: Admin, Gerente, Coord Prog, GPI
  obs_engajamento_solidez: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, NONE, NONE, NONE, NONE
  ),
  // Observação – Implantação do Programa: Admin, Gerente, Coord Prog, GPI
  obs_implantacao_programa: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, NONE, NONE, NONE, NONE
  ),
  // Observação de Aula: TODOS
  observacao_aula: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, CR_ENT, CR_ENT, CR_PRG
  ),
  // Observação Uso Pedagógico de Dados: Admin, Gerente, Coord Prog, CPed
  obs_uso_dados: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, NONE, NONE, NONE, NONE, NONE
  ),
  // Participa de Formações: Admin, Gerente, Coord Prog
  participa_formacoes: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, NONE, NONE, NONE, NONE, NONE
  ),
  // Qualidade Acomp Aula (Coordenador): Admin, Gerente, Coord Prog, Formador
  qualidade_acomp_aula: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, NONE, CRUD_ENT, NONE, NONE, NONE
  ),
  // Qualidade da Implementação: Admin, Gerente, Coord Prog, GPI
  qualidade_implementacao: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, NONE, NONE, NONE, NONE
  ),
  // Qualidade de ATPCs: Admin, Gerente, Coord Prog, CPed
  qualidade_atpcs: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, NONE, NONE, NONE, NONE, NONE
  ),
  // Sustentabilidade e Aprendizado: Admin, Gerente, Coord Prog, GPI
  sustentabilidade_programa: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, NONE, NONE, NONE, NONE
  ),
  // Formulário de Avaliação (Participante): Coord Ped, Professor, Vice-Dir, Diretor, Eq Técnica
  avaliacao_formacao_participante: buildRolePerms(
    CRUD_ALL, NONE, NONE, NONE, NONE, NONE, CR_OWN, CR_OWN, CR_PRG
  ),
  // Lista de Presença (Formação): Admin, Gerente, Coord Prog, CPed, GPI, Formador
  lista_presenca: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE
  ),
};

// ── Helper functions ─────────────────────────────────────────────────────

export function getPermission(role: AppRole | undefined, acaoTipo: AcaoTipo | string): AcaoPermission {
  if (!role) return NONE;
  const normalized = normalizeAcaoTipo(acaoTipo);
  const perms = ACAO_PERMISSION_MATRIX[normalized];
  if (!perms) return NONE;
  return perms[role] || NONE;
}

export function canUserCreateAcao(role: AppRole | undefined, acaoTipo: AcaoTipo | string): boolean {
  return getPermission(role, acaoTipo).canCreate;
}

export function canUserEditAcao(role: AppRole | undefined, acaoTipo: AcaoTipo | string): boolean {
  return getPermission(role, acaoTipo).canEdit;
}

export function canUserDeleteAcao(role: AppRole | undefined, acaoTipo: AcaoTipo | string): boolean {
  return getPermission(role, acaoTipo).canDelete;
}

export function canUserViewAcao(role: AppRole | undefined, acaoTipo: AcaoTipo | string): boolean {
  return getPermission(role, acaoTipo).canView;
}

/** Returns the list of AcaoTipo that the role can CREATE */
export function getCreatableAcoes(role: AppRole | undefined): AcaoTipo[] {
  if (!role) return [];
  return ACAO_TIPOS.filter(tipo => canUserCreateAcao(role, tipo));
}

/** Returns the list of AcaoTipo that the role can VIEW */
export function getViewableAcoes(role: AppRole | undefined): AcaoTipo[] {
  if (!role) return [];
  return ACAO_TIPOS.filter(tipo => canUserViewAcao(role, tipo));
}

// Role display labels for the matrix page
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'N1 – Administrador',
  gestor: 'N2 – Gerente Programa',
  n3_coordenador_programa: 'N3 – Coord. Programa',
  n4_1_cped: 'N4.1 – Consultor Pedagógico',
  n4_2_gpi: 'N4.2 – Gestor Parceria (GPI)',
  n5_formador: 'N5 – Formador',
  n6_coord_pedagogico: 'N6 – Coord. Pedagógico',
  n7_professor: 'N7 – Professor/Vice/Diretor',
  n8_equipe_tecnica: 'N8 – Equipe Técnica (SME)',
  aap_inicial: 'AAP Inicial (legado)',
  aap_portugues: 'AAP Português (legado)',
  aap_matematica: 'AAP Matemática (legado)',
};

/** Main roles (excluding legacy) for the matrix visualization */
export const MAIN_ROLES: AppRole[] = [
  'admin', 'gestor', 'n3_coordenador_programa',
  'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'n6_coord_pedagogico', 'n7_professor', 'n8_equipe_tecnica',
];
