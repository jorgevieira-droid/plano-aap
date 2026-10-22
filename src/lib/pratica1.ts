export interface Pratica1Input {
  consultor: string;
  escola: string;
  escolaId?: string;
  professor?: string;
  /** resposta Sim/Não da Prática Essencial 1 */
  valor?: string;
}

const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
const pctOf = (p: number, t: number) => (t > 0 ? Math.round((p / t) * 100) : null);

export function computePratica1(rows: Pratica1Input[]) {
  const isSim = (r: Pratica1Input) => r.valor === 'Sim';
  const escKey = (r: Pratica1Input) => r.escolaId || r.escola;
  const profKey = (r: Pratica1Input) => {
    const p = (r.professor || '').trim();
    return p && p !== 'Sem professor' ? `${escKey(r)}|${p.toLowerCase()}` : null;
  };
  const distinct = (list: Pratica1Input[], k: (r: Pratica1Input) => string | null) =>
    new Set(list.map(k).filter(Boolean)).size;
  const sim = rows.filter(isSim);
  const kpi = (s: number, t: number) => ({ sim: s, total: t, pct: pctOf(s, t) });

  const group = (k: (r: Pratica1Input) => string | null, label: (r: Pratica1Input) => [string, string?]) => {
    const m = new Map<string, { nome: string; extra?: string; total: number; sim: number }>();
    rows.forEach((r) => {
      const key = k(r);
      if (!key) return;
      const [nome, extra] = label(r);
      const g = m.get(key) || { nome, extra, total: 0, sim: 0 };
      g.total++;
      if (isSim(r)) g.sim++;
      m.set(key, g);
    });
    return [...m.values()].map((g) => ({ ...g, pct: pctOf(g.sim, g.total) })).sort((a, b) => sortPt(a.nome, b.nome));
  };

  return {
    acoes: kpi(sim.length, rows.length),
    escolas: kpi(distinct(sim, escKey), distinct(rows, escKey)),
    professores: kpi(distinct(sim, profKey), distinct(rows, profKey)),
    nao: rows.filter((r) => r.valor === 'Não').length,
    semInfo: rows.filter((r) => r.valor !== 'Sim' && r.valor !== 'Não').length,
    porConsultor: group((r) => r.consultor, (r) => [r.consultor]),
    porEscola: group(escKey, (r) => [r.escola]),
    porProfessor: group(profKey, (r) => [(r.professor || '').trim(), r.escola]),
  };
}
