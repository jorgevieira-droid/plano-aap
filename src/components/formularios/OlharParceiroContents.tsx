import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  REGISTROS_COORDENADOR_OPTIONS,
  PARTICIPACAO_DEVOLUTIVA_OPTIONS,
  AVALIACAO_APOIO_OPTIONS,
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
        <SimNaoField
          label="Turma do VOAR"
          required
          value={r.turma_voar}
          onChange={(v) => onChange('turma_voar', v)}
          readOnly={readOnly}
        />


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

        <SimNaoField
          label="Houve Tematização da devolutiva com o Coordenador posteriormente?"
          value={r.tematizacao_posterior}
          onChange={(v) => onChange('tematizacao_posterior', v)}
          readOnly={readOnly}
        />

        <div className="space-y-2">
          <Label>
            Quais habilidades e práticas o Coordenador pode desenvolver para potencializar o Apoio
            Presencial? Como você apoiará o Coordenador no desenvolvimento dessas habilidades?
          </Label>
          <Textarea
            rows={6}
            value={r.desenvolvimento_coordenador ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('desenvolvimento_coordenador', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Como você avalia a sua formação em serviço sobre Apoio Presencial realizada com o(a)
            Coordenador(a)?
          </Label>
          <div className="flex flex-wrap gap-2">
            {AVALIACAO_APOIO_OPTIONS.map((opt) => {
              const active = Number(r.avaliacao_formacao_coordenador) === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onChange('avaliacao_formacao_coordenador', opt.value)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? 'border-transparent bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {opt.value} — {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Justifique a nota</Label>
          <Textarea
            rows={4}
            value={r.avaliacao_formacao_coordenador_justificativa ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('avaliacao_formacao_coordenador_justificativa', e.target.value)}
          />
        </div>
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

export const FORMACAO_COLETIVA_FORMATO_OPTIONS = ['Liderança', 'Co-liderança'];

export const FORMACAO_COLETIVA_PARTICIPACAO_OPTIONS = [
  'Não participou',
  'Participou apenas na validação',
  'Trouxe sugestões',
  'Participou da idealização e construção ativamente',
];

/** Pontuação 0-3 da participação do coordenador/PAAC na construção da pauta */
export const FORMACAO_COLETIVA_PARTICIPACAO_SCORE: Record<string, number> = {
  'Não participou': 0,
  'Participou apenas na validação': 1,
  'Trouxe sugestões': 2,
  'Participou da idealização e construção ativamente': 3,
};

export function FormacaoColetivaContent({ responses, onChange, readOnly }: InstrumentContentProps) {
  const r = responses || {};
  return (
    <div className="space-y-5">
      <Block title="Registro da Formação Coletiva">
        <div className="space-y-2">
          <Label>Tema *</Label>
          <Input
            value={r.tema ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('tema', e.target.value)}
            placeholder="Tema da formação"
          />
        </div>

        <div className="space-y-2">
          <Label>Quantidade de professores participantes *</Label>
          <Input
            type="number"
            min={0}
            value={r.qtd_professores ?? ''}
            disabled={readOnly}
            onChange={(e) =>
              onChange('qtd_professores', e.target.value === '' ? '' : Number(e.target.value))
            }
          />
        </div>

        <OptionsField
          label="Formato *"
          options={FORMACAO_COLETIVA_FORMATO_OPTIONS}
          value={r.formato}
          onChange={(v) => onChange('formato', v)}
          readOnly={readOnly}
        />

        <OptionsField
          label="Como o coordenador/PAAC participou da construção da pauta? *"
          options={FORMACAO_COLETIVA_PARTICIPACAO_OPTIONS}
          value={r.participacao_pauta}
          onChange={(v) => onChange('participacao_pauta', v)}
          readOnly={readOnly}
        />

        <div className="space-y-2">
          <Label>Link da pauta</Label>
          <Input
            type="url"
            value={r.link_pauta ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('link_pauta', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label>NPS da formação *</Label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <button
                key={n}
                type="button"
                disabled={readOnly}
                onClick={() => onChange('nps', n)}
                className={`h-9 w-9 rounded-md border text-sm font-medium transition-colors ${
                  Number(r.nps) === n
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Destaques e desafios da formação</Label>
          <Textarea
            rows={6}
            value={r.destaques_desafios ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('destaques_desafios', e.target.value)}
          />
        </div>
      </Block>
    </div>
  );
}

export default FormacaoCoordenadorContent;
