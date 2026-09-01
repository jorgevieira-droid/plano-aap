/**
 * Tabelas dedicadas de instrumentos que NÃO possuem a coluna registro_acao_id
 * (foram criadas como bases agregadas, sem vínculo com registros_acao).
 * Consultas que filtram por registro_acao_id devem ser evitadas nessas tabelas.
 */
export const UNLINKED_DEDICATED_TABLES = new Set<string>([
  'relatorios_eteg_redes',
  'relatorios_professor_redes',
]);

export const hasRegistroAcaoLink = (table?: string | null) =>
  !!table && !UNLINKED_DEDICATED_TABLES.has(table);
