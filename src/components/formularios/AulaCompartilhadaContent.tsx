import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { InstrumentContentProps, SimNaoField } from './RegistroApoioPresencialContent';

export const PLANEJADO_OPCOES = ['Sim', 'Em partes', 'Não'];

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

export function validateAulaCompartilhada(responses: any): string | null {
  const r = responses || {};
  if (!String(r.tema_aula ?? '').trim()) return 'Responda: 1. Tema da aula';
  if (!r.planejada_previamente) return 'Responda: 3. Aula planejada previamente com prof.?';
  if (!String(r.link_planejamento ?? '').trim()) return 'Responda: 4. Link do planejamento';
  if (!r.ocorreu_planejado) return 'Responda: 5. A aula aconteceu como planejado?';
  if (
    (r.ocorreu_planejado === 'Não' || r.ocorreu_planejado === 'Em partes') &&
    !String(r.desafios_vivenciados ?? '').trim()
  ) {
    return 'Responda: 5.1 Quais os desafios vivenciados?';
  }
  if (!r.tematizacao_posterior) return 'Responda: 6. Houve tematização da aula posteriormente?';
  return null;
}

export function AulaCompartilhadaContent({
  responses,
  onChange,
  readOnly,
}: InstrumentContentProps) {
  const r = responses || {};
  const naoPlanejado = r.ocorreu_planejado === 'Não' || r.ocorreu_planejado === 'Em partes';

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registro da Aula Compartilhada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="break-words">
              1. Tema da aula <span className="text-destructive">*</span>
            </Label>
            <Input
              value={r.tema_aula ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('tema_aula', e.target.value)}
              placeholder="Tema da aula compartilhada"
            />
          </div>

          <div className="space-y-2">
            <Label className="break-words">2. Número MD</Label>
            <Input
              type="number"
              min={0}
              className="w-40"
              value={r.numero_md ?? ''}
              disabled={readOnly}
              onChange={(e) =>
                onChange('numero_md', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </div>

          <SimNaoField
            label="3. Aula planejada previamente com prof.?"
            required
            value={r.planejada_previamente}
            onChange={(v) => onChange('planejada_previamente', v)}
            readOnly={readOnly}
          />

          <div className="space-y-2">
            <Label className="break-words">
              4. Link do planejamento <span className="text-destructive">*</span>
            </Label>
            <Input
              type="url"
              value={r.link_planejamento ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('link_planejamento', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <SelectField
            label="5. A aula aconteceu como planejado?"
            required
            options={PLANEJADO_OPCOES}
            value={r.ocorreu_planejado}
            onChange={(v) => {
              onChange('ocorreu_planejado', v);
              if (v === 'Sim') onChange('desafios_vivenciados', null);
            }}
            readOnly={readOnly}
          />

          {naoPlanejado && (
            <div className="space-y-2">
              <Label className="break-words">
                5.1 Quais os desafios vivenciados? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={5}
                value={r.desafios_vivenciados ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('desafios_vivenciados', e.target.value)}
              />
            </div>
          )}

          <SimNaoField
            label="6. Houve tematização da aula posteriormente?"
            required
            value={r.tematizacao_posterior}
            onChange={(v) => onChange('tematizacao_posterior', v)}
            readOnly={readOnly}
          />

          <div className="space-y-2">
            <Label className="break-words">7. Anotações</Label>
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

export default AulaCompartilhadaContent;
