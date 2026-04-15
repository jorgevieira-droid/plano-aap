import { AppRole } from '@/contexts/AuthContext';
import {
  BookOpen, MapPin, Eye, MessageSquare, ClipboardCheck, Users, BarChart3,
  CalendarClock, Target, Building2, Database, GraduationCap, Award,
  ShieldCheck, TrendingUp, ListChecks, ClipboardList,
} from 'lucide-react';

// ── Standardised action types ────────────────────────────────────────────
export type AcaoTipo =
  | 'acompanhamento_formacoes'
  | 'agenda_gestao'
  | 'autoavaliacao'
  | 'devolutiva_pedagogica'
  | 'formacao'
  | 'obs_engajamento_solidez'
  | 'obs_implantacao_programa'
  | 'observacao_aula'
  | 'observacao_aula_redes'
  | 'encontro_eteg_redes'
  | 'encontro_professor_redes'
  | 'obs_uso_dados'
  | 'participa_formacoes'
  | 'qualidade_acomp_aula'
  | 'qualidade_implementacao'
  | 'qualidade_atpcs'
  | 'sustentabilidade_programa'
  | 'avaliacao_formacao_participante'
  | 'lista_presenca'
  | 'lideranca_gestores_pei'
  | 'monitoramento_gestao'
  | 'acomp_professor_tutor'
  | 'pec_qualidade_aula'
  | 'visita_voar'
  | 'monitoramento_acoes_formativas'
  | 'registro_consultoria_pedagogica';

export const ACAO_TIPOS: AcaoTipo[] = [
  'acompanhamento_formacoes',
  'agenda_gestao',
  'autoavaliacao',
  'devolutiva_pedagogica',
  'formacao',
  'obs_engajamento_solidez',
  'obs_implantacao_programa',
  'observacao_aula',
  'observacao_aula_redes',
  'encontro_eteg_redes',
  'encontro_professor_redes',
  'obs_uso_dados',
  'participa_formacoes',
  'qualidade_acomp_aula',
  'qualidade_implementacao',
  'qualidade_atpcs',
  'sustentabilidade_programa',
  'avaliacao_formacao_participante',
  'lista_presenca',
  'lideranca_gestores_pei',
  'monitoramento_gestao',
  'acomp_professor_tutor',
  'pec_qualidade_aula',
  'visita_voar',
  'monitoramento_acoes_formativas',
  'registro_consultoria_pedagogica',
];

export interface AcaoTypeInfo {
  tipo: AcaoTipo;
  label: string;
  icon: typeof BookOpen;
}

export const ACAO_TYPE_INFO: Record<AcaoTipo, AcaoTypeInfo> = {
  acompanhamento_formacoes:        { tipo: 'acompanhamento_formacoes',        label: 'Acompanhamento Formações',                           icon: BookOpen },
  agenda_gestao:                   { tipo: 'agenda_gestao',                   label: 'Agenda de Gestão',                                   icon: CalendarClock },
  autoavaliacao:                   { tipo: 'autoavaliacao',                   label: 'Autoavaliação',                                      icon: ClipboardCheck },
  devolutiva_pedagogica:           { tipo: 'devolutiva_pedagogica',           label: 'Devolutiva Pedagógica',                              icon: MessageSquare },
  formacao:                        { tipo: 'formacao',                        label: 'Formação',                                           icon: GraduationCap },
  obs_engajamento_solidez:         { tipo: 'obs_engajamento_solidez',         label: 'Observação – Engajamento e Solidez',                 icon: Target },
  obs_implantacao_programa:        { tipo: 'obs_implantacao_programa',        label: 'Observação – Implantação do Programa (Por Entidade)', icon: Building2 },
  observacao_aula:                 { tipo: 'observacao_aula',                 label: 'Observação de Aula',                                 icon: Eye },
  observacao_aula_redes:           { tipo: 'observacao_aula_redes',           label: 'Observação de Aula – REDES',                         icon: ClipboardList },
  encontro_eteg_redes:             { tipo: 'encontro_eteg_redes',             label: 'Encontro Formativo ET/EG – REDES',                   icon: ClipboardList },
  encontro_professor_redes:        { tipo: 'encontro_professor_redes',        label: 'Encontro Formativo Professor – REDES',               icon: ClipboardList },
  obs_uso_dados:                   { tipo: 'obs_uso_dados',                   label: 'Observação Uso Pedagógico de Dados',                 icon: Database },
  participa_formacoes:             { tipo: 'participa_formacoes',             label: 'Participa de Formações',                             icon: GraduationCap },
  qualidade_acomp_aula:            { tipo: 'qualidade_acomp_aula',            label: 'Qualidade Acompanhamento de Aula (Coordenador)',     icon: Award },
  qualidade_implementacao:         { tipo: 'qualidade_implementacao',         label: 'Qualidade da Implementação',                         icon: ShieldCheck },
  qualidade_atpcs:                 { tipo: 'qualidade_atpcs',                 label: 'Qualidade de ATPCs',                                 icon: BarChart3 },
  sustentabilidade_programa:       { tipo: 'sustentabilidade_programa',       label: 'Sustentabilidade e Aprendizado do Programa',         icon: TrendingUp },
  avaliacao_formacao_participante: { tipo: 'avaliacao_formacao_participante', label: 'Formulário de Avaliação (Participante)',             icon: Users },
  lista_presenca:                  { tipo: 'lista_presenca',                  label: 'Lista de Presença (Formação)',                       icon: ListChecks },
  lideranca_gestores_pei:          { tipo: 'lideranca_gestores_pei',          label: 'Liderança Pedagógica – Gestores PEI',               icon: ClipboardList },
  monitoramento_gestao:            { tipo: 'monitoramento_gestao',            label: 'Monitoramento e Gestão',                             icon: ClipboardList },
  acomp_professor_tutor:           { tipo: 'acomp_professor_tutor',           label: 'Acompanhamento Professor Tutor',                     icon: ClipboardList },
  pec_qualidade_aula:              { tipo: 'pec_qualidade_aula',              label: 'PEC Qualidade de Aula',                              icon: ClipboardList },
  visita_voar:                     { tipo: 'visita_voar',                     label: 'Instrumento de Visita – Projeto VOAR',               icon: ClipboardList },
  monitoramento_acoes_formativas:  { tipo: 'monitoramento_acoes_formativas',  label: 'Monitoramento de Ações Formativas – Regionais',      icon: ClipboardList },
  registro_consultoria_pedagogica: { tipo: 'registro_consultoria_pedagogica', label: 'Registro da Consultoria Pedagógica',                   icon: ClipboardList },
};

/** Backward compatibility: legacy tipo names → current */
export function normalizeAcaoTipo(tipo: string): AcaoTipo {
  if (tipo === 'acompanhamento_aula') return 'observacao_aula';
  if (tipo === 'visita') return 'observacao_aula'; // legacy "visita" maps to observacao
  return tipo as AcaoTipo;
}

export function getAcaoLabel(tipo: string): string {
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
    aap_inicial: n5,
    aap_portugues: n5,
    aap_matematica: n5,
  };
}

// ── Permission matrix ────────────────────────────────────────────────────
export const ACAO_PERMISSION_MATRIX: Record<AcaoTipo, Record<AppRole, AcaoPermission>> = {
  acompanhamento_formacoes: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  formacao: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  agenda_gestao: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  autoavaliacao: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CR_ENT, CR_ENT, CR_ENT, CR_ENT, CR_OWN, CR_PRG,
  ),
  devolutiva_pedagogica: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, NONE, NONE, NONE, NONE, NONE,
  ),
  obs_engajamento_solidez: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, NONE, NONE, NONE, NONE,
  ),
  obs_implantacao_programa: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, VIEW_ENT, CRUD_ENT, NONE, NONE, NONE, NONE,
  ),
  observacao_aula: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, CR_ENT, CR_ENT, CR_PRG,
  ),
  observacao_aula_redes: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, CR_ENT, CR_ENT, CR_PRG,
  ),
  encontro_eteg_redes: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  encontro_professor_redes: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  obs_uso_dados: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, NONE, NONE, NONE, NONE,
  ),
  participa_formacoes: buildRolePerms(
    NONE, NONE, NONE, NONE, NONE, NONE, NONE, NONE, NONE,
  ),
  qualidade_acomp_aula: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, NONE, CRUD_ENT, NONE, NONE, NONE,
  ),
  qualidade_implementacao: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, NONE, NONE, NONE, NONE,
  ),
  qualidade_atpcs: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, NONE, NONE, NONE, NONE, NONE,
  ),
  sustentabilidade_programa: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, NONE, CRUD_ENT, NONE, NONE, NONE, NONE,
  ),
  avaliacao_formacao_participante: buildRolePerms(
    CRUD_ALL, NONE, NONE, NONE, NONE, NONE, CR_OWN, CR_OWN, CR_PRG,
  ),
  lista_presenca: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  lideranca_gestores_pei: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  monitoramento_gestao: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  acomp_professor_tutor: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  pec_qualidade_aula: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  visita_voar: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
  ),
  monitoramento_acoes_formativas: buildRolePerms(
    CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE,
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

/** Returns the list of AcaoTipo that the role can CREATE, sorted alphabetically by label */
export function getCreatableAcoes(role: AppRole | undefined): AcaoTipo[] {
  if (!role) return [];
  return ACAO_TIPOS
    .filter(tipo => canUserCreateAcao(role, tipo))
    .sort((a, b) => ACAO_TYPE_INFO[a].label.localeCompare(ACAO_TYPE_INFO[b].label, 'pt-BR'));
}

/** Returns the list of AcaoTipo that the role can VIEW, sorted alphabetically by label */
export function getViewableAcoes(role: AppRole | undefined): AcaoTipo[] {
  if (!role) return [];
  return ACAO_TIPOS
    .filter(tipo => canUserViewAcao(role, tipo))
    .sort((a, b) => ACAO_TYPE_INFO[a].label.localeCompare(ACAO_TYPE_INFO[b].label, 'pt-BR'));
}

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

export const MAIN_ROLES: AppRole[] = [
  'admin', 'gestor', 'n3_coordenador_programa',
  'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'n6_coord_pedagogico', 'n7_professor', 'n8_equipe_tecnica',
];

// ── Form configuration per action type ──────────────────────────────────
export interface AcaoFormConfig {
  eligibleResponsavelRoles: AppRole[];
  useResponsavelSelector: boolean;
  requiresEntidade: boolean;
  showSegmento: boolean;
  showComponente: boolean;
  showAnoSerie: boolean;
  isCreatable: boolean;
  responsavelLabel?: string;
}

const ALL_NON_ADMIN_ROLES: AppRole[] = [
  'gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'n6_coord_pedagogico', 'n7_professor', 'n8_equipe_tecnica',
  'aap_inicial', 'aap_portugues', 'aap_matematica',
];

export const ACAO_FORM_CONFIG: Record<AcaoTipo, AcaoFormConfig> = {
  observacao_aula: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: true,
    showComponente: true,
    showAnoSerie: true,
    isCreatable: true,
  },
  observacao_aula_redes: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Formador',
  },
  formacao: {
    eligibleResponsavelRoles: ['gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: true,
    showComponente: true,
    showAnoSerie: true,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  encontro_eteg_redes: {
    eligibleResponsavelRoles: ['gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  encontro_professor_redes: {
    eligibleResponsavelRoles: ['gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  acompanhamento_formacoes: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: true,
    showComponente: true,
    showAnoSerie: true,
    isCreatable: false,
  },
  autoavaliacao: {
    eligibleResponsavelRoles: ALL_NON_ADMIN_ROLES,
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  agenda_gestao: {
    eligibleResponsavelRoles: ['gestor', 'n3_coordenador_programa', 'n4_2_gpi', 'n5_formador'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  devolutiva_pedagogica: {
    eligibleResponsavelRoles: ['admin', 'gestor', 'n3_coordenador_programa', 'n4_1_cped'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  obs_engajamento_solidez: {
    eligibleResponsavelRoles: ['admin', 'gestor', 'n3_coordenador_programa', 'n4_2_gpi'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  obs_implantacao_programa: {
    eligibleResponsavelRoles: ['admin', 'gestor', 'n3_coordenador_programa', 'n4_2_gpi'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  obs_uso_dados: {
    eligibleResponsavelRoles: ['admin', 'gestor', 'n3_coordenador_programa', 'n4_2_gpi'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  participa_formacoes: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: true,
    showComponente: true,
    showAnoSerie: true,
    isCreatable: false,
  },
  qualidade_acomp_aula: {
    eligibleResponsavelRoles: ['admin', 'gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n5_formador'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  qualidade_implementacao: {
    eligibleResponsavelRoles: ['admin', 'gestor', 'n3_coordenador_programa', 'n4_2_gpi'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  qualidade_atpcs: {
    eligibleResponsavelRoles: ['admin', 'gestor', 'n3_coordenador_programa', 'n4_1_cped'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  sustentabilidade_programa: {
    eligibleResponsavelRoles: ['admin', 'gestor', 'n3_coordenador_programa', 'n4_2_gpi'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Responsável',
  },
  avaliacao_formacao_participante: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: false,
  },
  lista_presenca: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: false,
  },
  lideranca_gestores_pei: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
  },
  monitoramento_gestao: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
  },
  acomp_professor_tutor: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
  },
  pec_qualidade_aula: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
  },
  visita_voar: {
    eligibleResponsavelRoles: [],
    useResponsavelSelector: false,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
  },
  monitoramento_acoes_formativas: {
    eligibleResponsavelRoles: ['gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador'],
    useResponsavelSelector: true,
    requiresEntidade: true,
    showSegmento: false,
    showComponente: false,
    showAnoSerie: false,
    isCreatable: true,
    responsavelLabel: 'Formador',
  },
};
