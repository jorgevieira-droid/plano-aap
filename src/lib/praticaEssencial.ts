/** Prática Essencial 1 (Retomada) conta só quando observada E com evidência preenchida. */
export function contaPraticaRetomada(resp: any): boolean {
  return resp?.observou_praticas === 'Sim' && String(resp?.pratica_1_evidencia ?? '').trim() !== '';
}
