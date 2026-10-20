import { describe, it, expect } from 'vitest';
import { contaPraticaRetomada } from './praticaEssencial';

describe('contaPraticaRetomada', () => {
  it('Sim com evidência conta', () => expect(contaPraticaRetomada({ observou_praticas: 'Sim', pratica_1_evidencia: 'x' })).toBe(true));
  it('Sim sem evidência não conta', () => expect(contaPraticaRetomada({ observou_praticas: 'Sim', pratica_1_evidencia: '  ' })).toBe(false));
  it('Não não conta', () => expect(contaPraticaRetomada({ observou_praticas: 'Não', pratica_1_evidencia: 'x' })).toBe(false));
});
