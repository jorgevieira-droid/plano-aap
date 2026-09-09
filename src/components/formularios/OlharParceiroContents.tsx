import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  REGISTROS_COORDENADOR_OPTIONS,
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

export function validateFormacaoCoordenador(responses: any): string | null {
  const r = responses || {};
  if (!r.tipo_registros) return 'Responda: 1. O que predominou nos registros da coordenação?';
  if (!r.devolutiva_com_coordenador)
    return 'Responda: 2. A devolutiva foi realizada com o coordenador?';
  if (r.devolutiva_com_coordenador === 'Sim') {
    if (!r.devolutiva_combinados)
      return 'Responda: 3. A devolutiva foi finalizada com combinados/encaminhamentos?';
    if (r.devolutiva_combinados === 'Sim' && !r.tematizacao_posterior)
      return 'Responda: 4. Houve Tematização da devolutiva posteriormente?';
  }
  return null;
}

export function FormacaoCoordenadorContent({ responses, onChange, readOnly }: InstrumentContentProps) {
  const r = responses || {};
  const devolutivaSim = r.devolutiva_com_coordenador === 'Sim';
  const combinadosSim = devolutivaSim && r.devolutiva_combinados === 'Sim';
  return (
    <div className="space-y-5">
      <Block title="Registro da Ação">
        <OptionsField
          label="1. O que predominou nos registros da coordenação? *"
          options={REGISTROS_COORDENADOR_OPTIONS}
          value={r.tipo_registros}
          onChange={(v) => onChange('tipo_registros', v)}
          readOnly={readOnly}
        />

        <SimNaoField
          label="2. A devolutiva foi realizada com o coordenador?"
          required
          value={r.devolutiva_com_coordenador}
          onChange={(v) => {
            onChange('devolutiva_com_coordenador', v);
            if (v !== 'Sim') {
              onChange('devolutiva_combinados', null);
              onChange('tematizacao_posterior', null);
            }
          }}
          readOnly={readOnly}
        />

        {devolutivaSim && (
          <SimNaoField
            label="3. A devolutiva foi finalizada com combinados/encaminhamentos?"
            required
            value={r.devolutiva_combinados}
            onChange={(v) => {
              onChange('devolutiva_combinados', v);
              if (v !== 'Sim') onChange('tematizacao_posterior', null);
            }}
            readOnly={readOnly}
          />
        )}

        {combinadosSim && (
          <SimNaoField
            label="4. Houve Tematização da devolutiva posteriormente?"
            required
            value={r.tematizacao_posterior}
            onChange={(v) => onChange('tematizacao_posterior', v)}
            readOnly={readOnly}
          />
        )}

        <div className="space-y-2">
          <Label>5. Anotações</Label>
          <Textarea
            rows={6}
            value={r.anotacoes ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('anotacoes', e.target.value)}
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

export const FORMACAO_COLETIVA_FORMATO_OPTIONS = ['Liderança', 'Co-liderança', 'Co-construção de Pauta'];

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
          onChange={(v) => {
            onChange('formato', v);
            if (v === 'Co-construção de Pauta') onChange('nps', undefined);
          }}
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

        {r.formato !== 'Co-construção de Pauta' && (
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
        )}

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
