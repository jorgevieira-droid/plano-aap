import { describe, it, expect } from 'vitest';
import { mesDaSemana, periodoDoMes } from './semanasMes';

describe('semanas do mês', () => {
  it('semana 31/08–04/09 conta em setembro', () => {
    expect(mesDaSemana('2026-08-31')).toBe('2026-09');
    expect(mesDaSemana('2026-09-04')).toBe('2026-09');
  });
  it('setembro/2026 vai de 31/08 a 02/10', () => {
    expect(periodoDoMes('2026-09')).toEqual({ ini: '2026-08-31', fim: '2026-10-02' });
  });
  it('agosto/2026 termina em 28/08 (sem repetir a semana de setembro)', () => {
    expect(periodoDoMes('2026-08').fim).toBe('2026-08-28');
  });
});
