export const ENTIDADE_TIPOS = ['PEI', 'Parcial'] as const;
export const ENTIDADE_ETAPAS = ['EFAI', 'EFAF', 'EM'] as const;

/** Chaves salvas em `escolas.qtd_professores_categoria`. Não renomear: são a chave de gravação. */
export const PROFESSOR_CATEGORIAS = [
  'MAT', 'OE MAT', 'TUTOR MAT', 'LP', 'OE LP', 'TUTOR LP',
  'MAT VOAR', 'LP VOAR', 'TUTOR EFAI', 'REGENTE EFAI', 'COLABORATIVO EFAI',
] as const;
export type ProfessorCategoria = typeof PROFESSOR_CATEGORIAS[number];

/** Rótulo exibido na tela para cada categoria salva. Trocar aqui não altera dados. */
export const PROFESSOR_CATEGORIA_LABELS: Record<ProfessorCategoria, string> = {
  'MAT': 'Matemática',
  'OE MAT': 'OE Matemática',
  'TUTOR MAT': 'Tutor Matemática',
  'LP': 'Língua Portuguesa',
  'OE LP': 'OE Língua Portuguesa',
  'TUTOR LP': 'Tutor Língua Portuguesa',
  'MAT VOAR': 'Matemática VOAR',
  'LP VOAR': 'Língua Portuguesa VOAR',
  'TUTOR EFAI': 'Tutor EFAI',
  'REGENTE EFAI': 'Regente EFAI',
  'COLABORATIVO EFAI': 'Colaborativo EFAI',
};

export function categoriaLabel(cat: string): string {
  return PROFESSOR_CATEGORIA_LABELS[cat as ProfessorCategoria] || cat;
}

/** Grupos usados na tabela de cobertura (Reunião Mensal). */
export const COBERTURA_GRUPOS = [
  'EFAI (Regente)', 'EFAI (Colaborativo/Tutor)', 'Língua Portuguesa / OE', 'Matemática / OE', 'Tutor Matemática', 'Tutor Língua Portuguesa',
] as const;
export type CoberturaGrupo = typeof COBERTURA_GRUPOS[number];

/** Mapeia categoria / componente (texto livre) para grupo de cobertura. */
export function grupoCobertura(raw: string | null | undefined): CoberturaGrupo | null {
  const s = (raw || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!s) return null;
  if (s.includes('REGENTE')) return 'EFAI (Regente)';
  if (s.includes('COLABORATIVO') || s === 'TUTOR EFAI') return 'EFAI (Colaborativo/Tutor)';
  if (s.includes('TUTOR') && (s.includes('MAT'))) return 'Tutor Matemática';
  if (s.includes('TUTOR') && (s.includes('LP') || s.includes('PORTUG'))) return 'Tutor Língua Portuguesa';
  if (s.includes('EFAI') || s.includes('POLIVALENTE')) return 'EFAI (Regente)';
  if (s.includes('MAT')) return 'Matemática / OE';
  if (s === 'LP' || s.includes('LP') || s.includes('PORTUG')) return 'Língua Portuguesa / OE';
  return null;
}
