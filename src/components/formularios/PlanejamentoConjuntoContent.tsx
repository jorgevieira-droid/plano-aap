import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { InstrumentContentProps, SimNaoField } from './RegistroApoioPresencialContent';

export const PLANEJ_PAPEL_PROFESSOR_OPTIONS = [
  'Apenas validou',
  'Trouxe sugestões ao planejamento elaborado pelo consultor',
  'Participou ativamente na ideação, construção e validação do planejamento',
];

export const PLANEJ_CONTRIBUICOES_OPTIONS = [
  'Estudo do MD',
  'Consulta do Guia Priorizado',
  'Definição de expectativas e evidências de aprendizagem',
  'Domínio do objeto de conhecimento',
  'Recursos pedagógicos',
  'Estratégias didáticas',
  'Gestão de sala de aula',
];

export const PLANEJ_ACOMPANHAMENTO_OPTIONS = [
  'Relato do professor',
  'Gravação de vídeo',
  'Observação de aula',
  'Aula compartilhada',
  'Outro',
];

function NumberField({
  label,
  value,
  onChange,
  readOnly,
  required,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="break-words">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
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

function SelectField({
  label,
  options,
  value,
  onChange,
  readOnly,
  required,
}: {
  label: string;
  options: string[];
  value: any;
  onChange: (v: string) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="break-words text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value || ''} onValueChange={onChange} disabled={readOnly}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function validatePlanejamentoConjunto(responses: any): string | null {
  const r = responses || {};
  const isNum = (v: any) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));
  if (!isNum(r.estudantes_abaixo_basico))
    return 'Responda: 1. Quantos estudantes Abaixo do Básico a turma possui?';
  if (!isNum(r.estudantes_elegiveis))
    return 'Responda: 2. Quantos estudantes elegíveis a turma possui?';
  if (!String(r.tema_aula ?? '').trim()) return 'Responda: 3. Tema da aula';
  if (!isNum(r.numero_aula)) return 'Responda: 4. Nº da aula (MD/SP em ação)';
  if (!r.papel_professor_planejamento)
    return 'Responda: 5. Qual o papel do professor no planejamento da aula?';
  if (!String(r.link_planejamento ?? '').trim()) return 'Responda: 6. Link do planejamento';
  if (!r.houve_desafios) return 'Responda: 7. Houve desafios na elaboração do planejamento?';
  if (r.houve_desafios === 'Sim' && !String(r.relato_desafios ?? '').trim())
    return 'Responda: 7.1 Relate os desafios';
  if (!Array.isArray(r.contribuicoes) || r.contribuicoes.length === 0)
    return 'Responda: 8. Quais as suas principais contribuições ao planejamento conjunto?';
  if (!r.acompanhamento_aula) return 'Responda: 9. Como essa aula será acompanhada?';
  if (r.acompanhamento_aula === 'Outro' && !String(r.acompanhamento_aula_outro ?? '').trim())
    return 'Responda: 9.1 Qual?';
  return null;
}

export function PlanejamentoConjuntoContent({
  responses,
  onChange,
  readOnly,
}: InstrumentContentProps) {
  const r = responses || {};
  const contribuicoes: string[] = Array.isArray(r.contribuicoes) ? r.contribuicoes : [];

  const toggleContribuicao = (opt: string, checked: boolean) => {
    const next = checked
      ? [...contribuicoes, opt]
      : contribuicoes.filter((c) => c !== opt);
    onChange('contribuicoes', next);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registro do Planejamento Conjunto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NumberField
            label="1. Quantos estudantes Abaixo do Básico a turma possui?"
            required
            value={r.estudantes_abaixo_basico}
            onChange={(v) => onChange('estudantes_abaixo_basico', v)}
            readOnly={readOnly}
          />

          <NumberField
            label="2. Quantos estudantes elegíveis a turma possui?"
            required
            value={r.estudantes_elegiveis}
            onChange={(v) => onChange('estudantes_elegiveis', v)}
            readOnly={readOnly}
          />

          <div className="space-y-2">
            <Label className="break-words">
              3. Tema da aula <span className="text-destructive">*</span>
            </Label>
            <Input
              value={r.tema_aula ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('tema_aula', e.target.value)}
              placeholder="Tema da aula planejada"
            />
          </div>

          <NumberField
            label="4. Nº da aula (MD/SP em ação)"
            required
            value={r.numero_aula}
            onChange={(v) => onChange('numero_aula', v)}
            readOnly={readOnly}
          />

          <SelectField
            label="5. Qual o papel do professor no planejamento da aula?"
            required
            options={PLANEJ_PAPEL_PROFESSOR_OPTIONS}
            value={r.papel_professor_planejamento}
            onChange={(v) => onChange('papel_professor_planejamento', v)}
            readOnly={readOnly}
          />

          <div className="space-y-2">
            <Label className="break-words">
              6. Link do planejamento <span className="text-destructive">*</span>
            </Label>
            <Input
              type="url"
              value={r.link_planejamento ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('link_planejamento', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <SimNaoField
            label="7. Houve desafios na elaboração do planejamento?"
            required
            value={r.houve_desafios}
            onChange={(v) => {
              onChange('houve_desafios', v);
              if (v !== 'Sim') onChange('relato_desafios', null);
            }}
            readOnly={readOnly}
          />

          {r.houve_desafios === 'Sim' && (
            <div className="space-y-2">
              <Label className="break-words">
                7.1 Relate os desafios <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={5}
                value={r.relato_desafios ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('relato_desafios', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="break-words">
              8. Quais as suas principais contribuições ao planejamento conjunto?{' '}
              <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              {PLANEJ_CONTRIBUICOES_OPTIONS.map((opt) => (
                <div key={opt} className="flex items-start gap-2">
                  <Checkbox
                    id={`contrib_${opt}`}
                    checked={contribuicoes.includes(opt)}
                    disabled={readOnly}
                    onCheckedChange={(c) => toggleContribuicao(opt, c === true)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`contrib_${opt}`}
                    className="min-w-0 cursor-pointer break-words text-sm font-normal"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <SelectField
            label="9. Como essa aula será acompanhada?"
            required
            options={PLANEJ_ACOMPANHAMENTO_OPTIONS}
            value={r.acompanhamento_aula}
            onChange={(v) => {
              onChange('acompanhamento_aula', v);
              if (v !== 'Outro') onChange('acompanhamento_aula_outro', null);
            }}
            readOnly={readOnly}
          />

          {r.acompanhamento_aula === 'Outro' && (
            <div className="space-y-2">
              <Label className="break-words">
                9.1 Qual? <span className="text-destructive">*</span>
              </Label>
              <Input
                value={r.acompanhamento_aula_outro ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('acompanhamento_aula_outro', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="break-words">10. Anotações</Label>
            <Textarea
              rows={6}
              value={r.anotacoes ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('anotacoes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlanejamentoConjuntoContent;
