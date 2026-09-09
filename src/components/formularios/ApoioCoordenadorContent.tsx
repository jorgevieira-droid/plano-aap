import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { InstrumentContentProps } from './RegistroApoioPresencialContent';

export const APOIO_COORDENADOR_FOCO_OPTIONS = [
  'Análise de resultados das avaliações',
  'Discussão de Documentos Orientadores e Lives',
  'Construção conjunta de pautas formativas',
  'Acompanhamento formativo de professores',
  'Acompanhamento da aplicação de avaliações',
  'Acompanhamento de projetos/ações de recomposição',
  'Outros',
];

export const APOIO_COORDENADOR_PARTICIPACAO_OPTIONS = [
  'Descompromissada',
  'Parcialmente descompromissada',
  'Parcialmente compromissada',
  'Compromissada',
];

export function validateApoioCoordenador(responses: any): string | null {
  const r = responses || {};
  const focos: string[] = Array.isArray(r.foco) ? r.foco : [];
  if (focos.length === 0) return 'Responda: 1. Foco da reunião';
  if (focos.includes('Outros') && !String(r.foco_outros ?? '').trim())
    return 'Responda: 1.1. Qual outro foco?';
  if (!String(r.tema_apoio ?? '').trim()) return 'Responda: 2. Tema da reunião';
  if (!r.participacao_coordenador) return 'Responda: 3. Como foi a participação do coordenador?';
  if (!r.encaminhamentos) return 'Responda: 4. A reunião gerou encaminhamentos?';
  if (r.encaminhamentos === 'Sim' && !String(r.encaminhamentos_quais ?? '').trim())
    return 'Responda: 4.1. Quais encaminhamentos?';
  return null;
}

function OptionsField({
  label,
  options,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  options: string[];
  value: any;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup
        value={value || ''}
        onValueChange={onChange}
        disabled={readOnly}
        className="space-y-1"
      >
        {options.map((opt) => (
          <div key={opt} className="flex items-start gap-2">
            <RadioGroupItem value={opt} id={`${label}_${opt}`} className="mt-0.5" />
            <Label htmlFor={`${label}_${opt}`} className="min-w-0 cursor-pointer break-words text-sm font-normal">
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

export function ApoioCoordenadorContent({ responses, onChange, readOnly }: InstrumentContentProps) {
  const r = responses || {};
  const focos: string[] = Array.isArray(r.foco) ? r.foco : [];

  const toggleFoco = (opt: string) => {
    if (readOnly) return;
    const next = focos.includes(opt) ? focos.filter((f) => f !== opt) : [...focos, opt];
    onChange('foco', next);
    if (!next.includes('Outros')) onChange('foco_outros', undefined);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registro da Reunião com a coordenação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">1. Foco * (seleção múltipla)</Label>
            <div className="space-y-1">
              {APOIO_COORDENADOR_FOCO_OPTIONS.map((opt) => (
                <div key={opt} className="flex items-start gap-2">
                  <Checkbox
                    id={`foco_${opt}`}
                    checked={focos.includes(opt)}
                    disabled={readOnly}
                    onCheckedChange={() => toggleFoco(opt)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`foco_${opt}`}
                    className="min-w-0 cursor-pointer break-words text-sm font-normal"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {focos.includes('Outros') && (
            <div className="space-y-2">
              <Label>1.1. Qual outro foco? *</Label>
              <Input
                value={r.foco_outros ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('foco_outros', e.target.value)}
                placeholder="Descreva o foco"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>2. Tema da reunião *</Label>
            <Textarea
              rows={4}
              value={r.tema_apoio ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('tema_apoio', e.target.value)}
              placeholder="Descreva o tema trabalhado na reunião"
            />
          </div>

          <OptionsField
            label="3. Como foi a participação do coordenador? *"
            options={APOIO_COORDENADOR_PARTICIPACAO_OPTIONS}
            value={r.participacao_coordenador}
            onChange={(v) => onChange('participacao_coordenador', v)}
            readOnly={readOnly}
          />

          <OptionsField
            label="4. A reunião gerou encaminhamentos? *"
            options={['Sim', 'Não']}
            value={r.encaminhamentos}
            onChange={(v) => {
              onChange('encaminhamentos', v);
              if (v !== 'Sim') onChange('encaminhamentos_quais', undefined);
            }}
            readOnly={readOnly}
          />

          {r.encaminhamentos === 'Sim' && (
            <div className="space-y-2">
              <Label>4.1. Quais? *</Label>
              <Textarea
                rows={4}
                value={r.encaminhamentos_quais ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('encaminhamentos_quais', e.target.value)}
                placeholder="Descreva os encaminhamentos definidos"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>5. Anotações</Label>
            <Textarea
              rows={5}
              value={r.anotacoes ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('anotacoes', e.target.value)}
              placeholder="Registre observações adicionais"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ApoioCoordenadorContent;
