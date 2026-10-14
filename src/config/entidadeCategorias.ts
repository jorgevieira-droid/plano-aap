export const ENTIDADE_TIPOS = ['PEI', 'Parcial'] as const;
export const ENTIDADE_ETAPAS = ['EFAI', 'EFAF', 'EM'] as const;

export const PROFESSOR_CATEGORIAS = [
  'MAT', 'OE MAT', 'TUTOR MAT', 'LP', 'OE LP', 'TUTOR LP',
  'MAT VOAR', 'LP VOAR', 'TUTOR EFAI', 'REGENTE EFAI', 'COLABORATIVO EFAI',
] as const;

/** Grupos usados na tabela de cobertura (Reunião Mensal). */
export const COBERTURA_GRUPOS = [
  'EFAI (Regente)', 'EFAI (Colaborativo/Tutor)', 'Língua Portuguesa / OE', 'Matemática / OE', 'Tutor MAT', 'Tutor LP',
] as const;
export type CoberturaGrupo = typeof COBERTURA_GRUPOS[number];

/** Mapeia categoria / componente (texto livre) para grupo de cobertura. */
export function grupoCobertura(raw: string | null | undefined): CoberturaGrupo | null {
  const s = (raw || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!s) return null;
  if (s.includes('REGENTE')) return 'EFAI (Regente)';
  if (s.includes('COLABORATIVO') || s === 'TUTOR EFAI') return 'EFAI (Colaborativo/Tutor)';
  if (s.includes('TUTOR') && (s.includes('MAT'))) return 'Tutor MAT';
  if (s.includes('TUTOR') && (s.includes('LP') || s.includes('PORTUG'))) return 'Tutor LP';
  if (s.includes('EFAI') || s.includes('POLIVALENTE')) return 'EFAI (Regente)';
  if (s.includes('MAT')) return 'Matemática / OE';
  if (s === 'LP' || s.includes('LP') || s.includes('PORTUG')) return 'Língua Portuguesa / OE';
  return null;
}
