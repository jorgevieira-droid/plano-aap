import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { InstrumentContentProps } from './RegistroApoioPresencialContent';

export const APOIO_COORDENADOR_FOCO_OPTIONS = [
  'Análise de resultados das avaliações',
  'Discussão de Documentos Orientadores e Lives',
  'Construção conjunta de pautas formativas',
  'Outros',
];

export function ApoioCoordenadorContent({ responses, onChange, readOnly }: InstrumentContentProps) {
  const r = responses || {};
  const focos: string[] = Array.isArray(r.foco) ? r.foco : [];

  const toggleFoco = (opt: string) => {
    if (readOnly) return;
    onChange('foco', focos.includes(opt) ? focos.filter((f) => f !== opt) : [...focos, opt]);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registro do Apoio ao Coordenador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Foco * (seleção múltipla)</Label>
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
              <Label>Qual outro foco?</Label>
              <Input
                value={r.foco_outros ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('foco_outros', e.target.value)}
                placeholder="Descreva o foco"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Tema do Apoio *</Label>
            <Textarea
              rows={4}
              value={r.tema_apoio ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('tema_apoio', e.target.value)}
              placeholder="Descreva o tema trabalhado no apoio"
            />
          </div>

          <div className="space-y-2">
            <Label>NPS Apoio *</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onChange('nps', n)}
                  className={`h-10 w-10 rounded-md border text-sm font-medium transition-colors ${
                    Number(r.nps) === n
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent'
                  } ${readOnly ? 'opacity-60' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Anotações sobre conquistas e desafios do Apoio</Label>
            <Textarea
              rows={5}
              value={r.anotacoes ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('anotacoes', e.target.value)}
              placeholder="Registre conquistas e desafios observados"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ApoioCoordenadorContent;
