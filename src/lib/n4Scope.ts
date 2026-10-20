// N4 (CPed/GPI) só vê ações em que é responsável ou que criou para outra pessoa.
export function inN4Scope(reg: any, isN4: boolean, userId?: string | null): boolean {
  if (!isN4) return true;
  if (!reg || !userId) return false;
  return reg.aap_id === userId || reg.prog_owner?.created_by === userId;
}
