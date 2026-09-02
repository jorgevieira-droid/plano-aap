import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { InstrumentContentProps, SimNaoField } from './RegistroApoioPresencialContent';

export const PLANEJ_EFICACIA_OPTIONS = [
  { value: 1, label: '1 - Nada Eficaz' },
  { value: 2, label: '2 - Pouco Eficaz' },
  { value: 3, label: '3 - Eficaz' },
  { value: 4, label: '4 - Muito Eficaz' },
];

function NumberField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="break-words">{label}</Label>
      <Input
        type="number"
        min={0}
        className="w-40"
        value={value ?? ''}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    </div>
  );
}

export function PlanejamentoConjuntoContent({
  responses,
  onChange,
  readOnly,
}: InstrumentContentProps) {
  const r = responses || {};
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registro do Planejamento Conjunto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimNaoField
            label="Turma do VOAR?"
            required
            value={r.turma_voar}
            onChange={(v) => onChange('turma_voar', v)}
            readOnly={readOnly}
          />

          <NumberField
            label="Quantos estudantes abaixo do básico a turma possui?"
            value={r.estudantes_abaixo_basico}
            onChange={(v) => onChange('estudantes_abaixo_basico', v)}
            readOnly={readOnly}
          />

          <NumberField
            label="Quantos estudantes no Básico a turma possui?"
            value={r.estudantes_basico}
            onChange={(v) => onChange('estudantes_basico', v)}
            readOnly={readOnly}
          />

          <NumberField
            label="Quantos estudantes proficientes a turma possui?"
            value={r.estudantes_proficientes}
            onChange={(v) => onChange('estudantes_proficientes', v)}
            readOnly={readOnly}
          />

          <NumberField
            label="Quantos estudantes elegíveis a turma possui?"
            value={r.estudantes_elegiveis}
            onChange={(v) => onChange('estudantes_elegiveis', v)}
            readOnly={readOnly}
          />

          <div className="space-y-2">
            <Label>Tema da aula *</Label>
            <Input
              value={r.tema_aula ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('tema_aula', e.target.value)}
              placeholder="Tema da aula planejada"
            />
          </div>

          <NumberField
            label="Nº da aula (MD/SP em ação)"
            value={r.numero_aula}
            onChange={(v) => onChange('numero_aula', v)}
            readOnly={readOnly}
          />

          <div className="space-y-2">
            <Label className="break-words">
              Registre as contribuições realizadas ao planejamento do professor *
            </Label>
            <Textarea
              rows={6}
              value={r.contribuicoes_planejamento ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('contribuicoes_planejamento', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="break-words">Como essa aula será monitorada pela consultoria? *</Label>
            <Textarea
              rows={6}
              value={r.monitoramento_aula ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('monitoramento_aula', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="break-words">Como foi a participação do Professor?</Label>
            <Textarea
              rows={5}
              value={r.participacao_professor ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('participacao_professor', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="break-words">
              Como você avalia a eficácia do Planejamento Conjunto Realizado?
            </Label>
            <div className="flex flex-wrap gap-2">
              {PLANEJ_EFICACIA_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onChange('eficacia_planejamento', o.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    Number(r.eficacia_planejamento) === o.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="break-words">Justifique a resposta</Label>
            <Textarea
              rows={5}
              value={r.eficacia_justificativa ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('eficacia_justificativa', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlanejamentoConjuntoContent;

export function validatePlanejamentoConjunto(responses: any): string | null {
  const r = responses || {};
  if (!String(r.tema_aula ?? '').trim()) return 'Informe o tema da aula';
  if (!String(r.contribuicoes_planejamento ?? '').trim())
    return 'Registre as contribuições realizadas ao planejamento do professor';
  if (!String(r.monitoramento_aula ?? '').trim())
    return 'Informe como essa aula será monitorada pela consultoria';
  return null;
}
