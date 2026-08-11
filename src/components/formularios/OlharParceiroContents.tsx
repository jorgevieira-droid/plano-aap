import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  REGISTROS_COORDENADOR_OPTIONS,
  PARTICIPACAO_DEVOLUTIVA_OPTIONS,
} from './apoioPresencialShared';
import { InstrumentContentProps, SimNaoField } from './RegistroApoioPresencialContent';

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
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
            <Label htmlFor={`${label}_${opt}`} className="min-w-0 cursor-pointer break-words text-sm">
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

export function FormacaoCoordenadorContent({ responses, onChange, readOnly }: InstrumentContentProps) {
  const r = responses || {};
  return (
    <div className="space-y-5">
      <Block title="2. Dados da Realização">
        <div className="space-y-2">
          <Label>Data da observação <span className="text-destructive">*</span></Label>
          <Input
            type="date"
            className="w-52"
            value={r.data_observacao ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('data_observacao', e.target.value || null)}
          />
        </div>

        <SimNaoField
          label="O coordenador observou a aula do início ao fim?"
          required
          value={r.observou_inicio_fim}
          onChange={(v) => onChange('observou_inicio_fim', v)}
          readOnly={readOnly}
        />

        <SimNaoField
          label="O coordenador fez registros de observação?"
          required
          value={r.fez_registros}
          onChange={(v) => onChange('fez_registros', v)}
          readOnly={readOnly}
        />

        {r.fez_registros === 'Sim' && (
          <OptionsField
            label="Como foram os registros do coordenador?"
            options={REGISTROS_COORDENADOR_OPTIONS}
            value={r.tipo_registros}
            onChange={(v) => onChange('tipo_registros', v)}
            readOnly={readOnly}
          />
        )}

        <SimNaoField
          label="A devolutiva foi planejada junto com o coordenador, antes de ser realizada?"
          required
          value={r.devolutiva_planejada}
          onChange={(v) => onChange('devolutiva_planejada', v)}
          readOnly={readOnly}
        />

        <SimNaoField
          label="A devolutiva foi realizada?"
          required
          value={r.devolutiva_realizada}
          onChange={(v) => onChange('devolutiva_realizada', v)}
          readOnly={readOnly}
        />

        {r.devolutiva_realizada === 'Sim' && (
          <>
            <div className="space-y-2">
              <Label>Data da devolutiva</Label>
              <Input
                type="date"
                className="w-52"
                value={r.data_devolutiva ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('data_devolutiva', e.target.value || null)}
              />
            </div>
            <OptionsField
              label="Como o coordenador participou da devolutiva?"
              options={PARTICIPACAO_DEVOLUTIVA_OPTIONS}
              value={r.participacao_devolutiva}
              onChange={(v) => onChange('participacao_devolutiva', v)}
              readOnly={readOnly}
            />
          </>
        )}

        {r.devolutiva_realizada === 'Não' && (
          <div className="space-y-2">
            <Label>Motivo da não realização da devolutiva</Label>
            <Textarea
              rows={3}
              value={r.motivo_nao_devolutiva ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('motivo_nao_devolutiva', e.target.value)}
            />
          </div>
        )}
      </Block>
    </div>
  );
}

export function EncaminhamentosInternosContent({
  responses,
  onChange,
  readOnly,
}: InstrumentContentProps) {
  const r = responses || {};
  return (
    <div className="space-y-5">
      <Block title="2. Dados do Encaminhamento">
        <div className="space-y-2">
          <Label>
            Existe alguma informação que precisa ser circulada internamente? Descreva abaixo{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            rows={8}
            value={r.informacao_interna ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('informacao_interna', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Existe algum encaminhamento ou resultado de uma informação circulada em REI anterior?
          </Label>
          <p className="text-xs text-muted-foreground">
            Descreva abaixo o encaminhamento e para quem ele se destina
          </p>
          <Textarea
            rows={8}
            value={r.encaminhamento_rei_anterior ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('encaminhamento_rei_anterior', e.target.value)}
          />
        </div>
      </Block>
    </div>
  );
}

export default FormacaoCoordenadorContent;
