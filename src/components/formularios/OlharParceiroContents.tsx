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

/** Papel de atuação da consultoria (antigo campo "Formato") */
export const FORMACAO_COLETIVA_PAPEL_OPTIONS = [
  'Liderança da mediação',
  'Co-liderança da mediação',
  'Co-construção de pauta com PAAC/CGP para ele mediar',
];

/** Compatibilidade com registros antigos */
export const FORMACAO_COLETIVA_FORMATO_OPTIONS = FORMACAO_COLETIVA_PAPEL_OPTIONS;

const PAPEL_LEGADO: Record<string, string> = {
  'Liderança': 'Liderança da mediação',
  'Co-liderança': 'Co-liderança da mediação',
  'Co-construção de Pauta': 'Co-construção de pauta com PAAC/CGP para ele mediar',
};

export const normalizePapelFormacaoColetiva = (v: any): string => {
  const s = String(v ?? '').trim();
  return PAPEL_LEGADO[s] || s;
};

export const FORMACAO_COLETIVA_PARTICIPACAO_OPTIONS = [
  'Não participou',
  'Apenas validou',
  'Trouxe sugestões à pauta elaborada pelo consultor',
  'Participou ativamente na ideação, construção e validação da pauta',
];

const PARTICIPACAO_LEGADO: Record<string, string> = {
  'Participou apenas na validação': 'Apenas validou',
  'Trouxe sugestões': 'Trouxe sugestões à pauta elaborada pelo consultor',
  'Participou da idealização e construção ativamente':
    'Participou ativamente na ideação, construção e validação da pauta',
};

export const normalizeParticipacaoPauta = (v: any): string => {
  const s = String(v ?? '').trim();
  return PARTICIPACAO_LEGADO[s] || s;
};

/** Pontuação 0-3 da participação do coordenador/PAAC na construção da pauta */
export const FORMACAO_COLETIVA_PARTICIPACAO_SCORE: Record<string, number> = {
  'Não participou': 0,
  'Apenas validou': 1,
  'Trouxe sugestões à pauta elaborada pelo consultor': 2,
  'Participou ativamente na ideação, construção e validação da pauta': 3,
  // legados
  'Participou apenas na validação': 1,
  'Trouxe sugestões': 2,
  'Participou da idealização e construção ativamente': 3,
};

export const FORMACAO_COLETIVA_CONFORME_OPTIONS = ['Sim', 'Não', 'Em parte'];

export function validateFormacaoColetiva(responses: any): string | null {
  const r = responses || {};
  if (!String(r.tema ?? '').trim()) return 'Responda: 1. Tema';
  if (r.qtd_professores === '' || r.qtd_professores === null || r.qtd_professores === undefined)
    return 'Responda: 2. Quantidade de professores participantes';
  if (!r.formato) return 'Responda: 3. Papel de atuação da consultoria';
  if (!r.participacao_pauta)
    return 'Responda: 4. Como o coordenador/PAAC participou da construção da pauta?';
  if (!r.conforme_planejado) return 'Responda: 5. A formação aconteceu conforme planejada?';
  if (
    (r.conforme_planejado === 'Não' || r.conforme_planejado === 'Em parte') &&
    !String(r.desafios ?? '').trim()
  )
    return 'Responda: 5.1. Registro dos desafios';
  if (!String(r.link_pauta ?? '').trim()) return 'Responda: 6. Link da pauta';
  return null;
}

export function FormacaoColetivaContent({ responses, onChange, readOnly }: InstrumentContentProps) {
  const r = responses || {};
  const papel = normalizePapelFormacaoColetiva(r.formato);
  const participacao = normalizeParticipacaoPauta(r.participacao_pauta);
  const mostrarDesafios = r.conforme_planejado === 'Não' || r.conforme_planejado === 'Em parte';
  return (
    <div className="space-y-5">
      <Block title="Registro da Formação Coletiva">
        <div className="space-y-2">
          <Label>1. Tema *</Label>
          <Input
            value={r.tema ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('tema', e.target.value)}
            placeholder="Tema da formação"
          />
        </div>

        <div className="space-y-2">
          <Label>2. Quantidade de professores participantes *</Label>
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
          label="3. Papel de atuação da consultoria *"
          options={FORMACAO_COLETIVA_PAPEL_OPTIONS}
          value={papel}
          onChange={(v) => onChange('formato', v)}
          readOnly={readOnly}
        />

        <OptionsField
          label="4. Como o coordenador/PAAC participou da construção da pauta? *"
          options={FORMACAO_COLETIVA_PARTICIPACAO_OPTIONS}
          value={participacao}
          onChange={(v) => onChange('participacao_pauta', v)}
          readOnly={readOnly}
        />

        <OptionsField
          label="5. A formação aconteceu conforme planejada? *"
          options={FORMACAO_COLETIVA_CONFORME_OPTIONS}
          value={r.conforme_planejado}
          onChange={(v) => {
            onChange('conforme_planejado', v);
            if (v === 'Sim') onChange('desafios', undefined);
          }}
          readOnly={readOnly}
        />

        {mostrarDesafios && (
          <div className="space-y-2">
            <Label>5.1. Registro dos desafios *</Label>
            <Textarea
              rows={5}
              value={r.desafios ?? ''}
              disabled={readOnly}
              onChange={(e) => onChange('desafios', e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>6. Link da pauta *</Label>
          <Input
            type="url"
            value={r.link_pauta ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('link_pauta', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label>7. Anotações</Label>
          <Textarea
            rows={6}
            value={r.anotacoes_formacao ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('anotacoes_formacao', e.target.value)}
          />
        </div>
      </Block>
    </div>
  );
}

export default FormacaoCoordenadorContent;
