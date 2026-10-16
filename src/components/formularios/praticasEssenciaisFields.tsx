import { SimNaoField } from './RegistroApoioPresencialContent';

/** Perguntas "Desenvolveu a Prática Essencial 1/2" (Programa Escolas). */
export function PraticasEssenciaisDesenvolvidasFields({
  responses,
  onChange,
  readOnly,
  startNumber,
}: {
  responses: Record<string, any>;
  onChange: (key: string, value: any) => void;
  readOnly?: boolean;
  startNumber: number;
}) {
  const r = responses || {};
  return (
    <>
      <SimNaoField
        label={`${startNumber}. Desenvolveu a Prática Essencial 1?`}
        required
        value={r.desenvolveu_pratica_1}
        onChange={(v) => onChange('desenvolveu_pratica_1', v)}
        readOnly={readOnly}
      />
      <SimNaoField
        label={`${startNumber + 1}. Desenvolveu a Prática Essencial 2?`}
        required
        value={r.desenvolveu_pratica_2}
        onChange={(v) => onChange('desenvolveu_pratica_2', v)}
        readOnly={readOnly}
      />
    </>
  );
}

export function validatePraticasDesenvolvidas(responses: any, startNumber: number): string | null {
  const r = responses || {};
  if (!r.desenvolveu_pratica_1) return `Responda: ${startNumber}. Desenvolveu a Prática Essencial 1?`;
  if (!r.desenvolveu_pratica_2) return `Responda: ${startNumber + 1}. Desenvolveu a Prática Essencial 2?`;
  return null;
}
