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

export const INICIO_REAL_OPCOES = [
  'Em até 10 min',
  'Entre 10 e 13 min',
  'Entre 13 e 15 min',
  'Mais de 15 min',
];

export const PLANEJADO_OPCOES = ['Sim', 'Em partes', 'Não'];

export const PAPEL_PROFESSOR_OPCOES = ['Observador', 'Participante', 'Outro'];

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
          <SimNaoField
            label="Turma do VOAR?"
            required
            value={r.turma_voar}
            onChange={(v) => onChange('turma_voar', v)}
            readOnly={readOnly}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="break-words">Quantidade de alunos presentes</Label>
              <Input
                type="number"
                min={0}
                value={r.alunos_presentes ?? ''}
                disabled={readOnly}
                onChange={(e) =>
                  onChange('alunos_presentes', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>

            <SelectField
              label="O início real da aula aconteceu em:"
              options={INICIO_REAL_OPCOES}
              value={r.inicio_real}
              onChange={(v) => onChange('inicio_real', v)}
              readOnly={readOnly}
            />
          </div>

          <SelectField
            label="A aula compartilhada aconteceu como planejado?"
            options={PLANEJADO_OPCOES}
            value={r.ocorreu_planejado}
            onChange={(v) => onChange('ocorreu_planejado', v)}
            readOnly={readOnly}
          />

          {naoPlanejado && (
            <div className="space-y-2">
              <Label className="break-words">Motivo</Label>
              <Textarea
                rows={4}
                value={r.motivo_nao_planejado ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('motivo_nao_planejado', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="break-words">O que foi modelizado ao professor nessa aula?</Label>
            <Textarea
              rows={6}
              value={r.o_que_modelizado ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('o_que_modelizado', e.target.value)}
            />
          </div>

          <SelectField
            label="Qual o papel do professor durante a modelização?"
            options={PAPEL_PROFESSOR_OPCOES}
            value={r.papel_professor}
            onChange={(v) => onChange('papel_professor', v)}
            readOnly={readOnly}
          />

          {r.papel_professor === 'Outro' && (
            <div className="space-y-2">
              <Label className="break-words">Especifique o papel do professor</Label>
              <Input
                value={r.papel_professor_outro ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('papel_professor_outro', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="break-words">
              Conquistas e desafios vivenciados na aula compartilhada
            </Label>
            <Textarea
              rows={6}
              value={r.conquistas_desafios ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('conquistas_desafios', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AulaCompartilhadaContent;
