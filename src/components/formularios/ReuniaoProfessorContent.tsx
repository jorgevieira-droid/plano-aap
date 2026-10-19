import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { InstrumentContentProps } from './RegistroApoioPresencialContent';

export const REUNIAO_PROFESSOR_FOCO_OPTIONS = [
  'Planejamento bimestral e priorização de habilidades',
  'Planejamento de sequências didáticas e estratégias pedagógicas',
  'Análise dos resultados das avaliações e identificação de defasagens',
  'Acompanhamento pedagógico dos estudantes com desempenho abaixo do básico',
  'Planejamento de intervenções para recomposição das aprendizagens',
  'Formação Prática Essencial 1',
  'Formação Prática Essencial 2',
  'Estudo e discussão de documentos orientadores',
  'Acompanhamento e reflexão sobre as práticas de ensino',
  'Planejamento de instrumentos e estratégias de avaliação',
  'Monitoramento dos avanços das aprendizagens',
  'Outros',
];

export const REUNIAO_PROFESSOR_PARTICIPACAO_OPTIONS = [
  'Descompromissada',
  'Parcialmente descompromissada',
  'Parcialmente compromissada',
  'Compromissada',
];

export function validateReuniaoProfessor(responses: any): string | null {
  const r = responses || {};
  const focos: string[] = Array.isArray(r.foco) ? r.foco : [];
  if (focos.length === 0) return 'Responda: 1. Foco';
  if (focos.includes('Outros') && !String(r.foco_outros ?? '').trim())
    return 'Responda: 1.1. Qual outro foco?';
  if (!String(r.tema_reuniao ?? '').trim()) return 'Responda: 2. Tema da reunião';
  if (!r.participacao_professor) return 'Responda: 3. Como foi a participação do professor?';
  if (!r.encaminhamentos) return 'Responda: 4. A reunião gerou encaminhamentos?';
  return null;
}

function OptionsField({ id, label, options, value, onChange, readOnly }: {
  id: string; label: string; options: string[]; value: any; onChange: (v: string) => void; readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup value={value || ''} onValueChange={onChange} disabled={readOnly} className="space-y-1">
        {options.map((opt) => (
          <div key={opt} className="flex items-start gap-2">
            <RadioGroupItem value={opt} id={`${id}_${opt}`} className="mt-0.5" />
            <Label htmlFor={`${id}_${opt}`} className="min-w-0 cursor-pointer break-words text-sm font-normal">{opt}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

export function ReuniaoProfessorContent({ responses, onChange, readOnly }: InstrumentContentProps) {
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
          <CardTitle className="text-base">Registro da Reunião com o Professor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">1. Foco * (seleção múltipla)</Label>
            <div className="space-y-1">
              {REUNIAO_PROFESSOR_FOCO_OPTIONS.map((opt) => (
                <div key={opt} className="flex items-start gap-2">
                  <Checkbox id={`rp_foco_${opt}`} checked={focos.includes(opt)} disabled={readOnly} onCheckedChange={() => toggleFoco(opt)} className="mt-0.5" />
                  <Label htmlFor={`rp_foco_${opt}`} className="min-w-0 cursor-pointer break-words text-sm font-normal">{opt}</Label>
                </div>
              ))}
            </div>
          </div>

          {focos.includes('Outros') && (
            <div className="space-y-2">
              <Label>1.1. Qual outro foco? *</Label>
              <Input value={r.foco_outros ?? ''} disabled={readOnly} onChange={(e) => onChange('foco_outros', e.target.value)} placeholder="Descreva o foco" />
            </div>
          )}

          <div className="space-y-2">
            <Label>2. Tema da reunião *</Label>
            <Input value={r.tema_reuniao ?? ''} disabled={readOnly} onChange={(e) => onChange('tema_reuniao', e.target.value)} placeholder="Tema trabalhado na reunião" />
          </div>

          <OptionsField id="rp_part" label="3. Como foi a participação do professor? *" options={REUNIAO_PROFESSOR_PARTICIPACAO_OPTIONS}
            value={r.participacao_professor} onChange={(v) => onChange('participacao_professor', v)} readOnly={readOnly} />

          <OptionsField id="rp_enc" label="4. A reunião gerou encaminhamentos? *" options={['Sim', 'Não']}
            value={r.encaminhamentos} onChange={(v) => onChange('encaminhamentos', v)} readOnly={readOnly} />

          <div className="space-y-2">
            <Label>5. Anotações</Label>
            <Textarea rows={5} value={r.anotacoes ?? ''} disabled={readOnly} onChange={(e) => onChange('anotacoes', e.target.value)} placeholder="Registre observações adicionais" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReuniaoProfessorContent;
