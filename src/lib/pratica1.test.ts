import { describe, it, expect } from 'vitest';
import { computePratica1 } from './pratica1';

describe('computePratica1', () => {
  const rows = [
    { consultor: 'Ana', escola: 'E1', escolaId: '1', professor: 'Carol', valor: 'Sim' },
    { consultor: 'Ana', escola: 'E1', escolaId: '1', professor: 'carol', valor: 'Não' },
    { consultor: 'Bia', escola: 'E2', escolaId: '2', professor: 'Davi', valor: undefined },
    { consultor: 'Bia', escola: 'E2', escolaId: '2', professor: 'Eva', valor: 'Sim' },
  ];
  const r = computePratica1(rows);
  it('ações: quantidade e % sobre o total', () => expect(r.acoes).toEqual({ sim: 2, total: 4, pct: 50 }));
  it('escolas distintas com prática', () => expect(r.escolas).toEqual({ sim: 2, total: 2, pct: 100 }));
  it('professores distintos com prática', () => expect(r.professores).toEqual({ sim: 2, total: 3, pct: 67 }));
  it('por consultor', () => expect(r.porConsultor.map((c) => [c.nome, c.sim, c.total])).toEqual([['Ana', 1, 2], ['Bia', 1, 2]]));
});
