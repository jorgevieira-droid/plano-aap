import { ExternalLink } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  RUBRICAS,
  RUBRICA_FOCOS,
  PRATICAS_ESSENCIAIS,
  OUTROS_OBSERVADORES_OPTIONS,
  DIFERENCA_HORARIO_OPTIONS,
  AVALIACAO_APOIO_OPTIONS,
  GEM_TRANSCRITOR_URL,
  RubricaDef,
  PraticaDef,
} from './apoioPresencialShared';


export interface InstrumentContentProps {
  responses: Record<string, any>;
  onChange: (key: string, value: any) => void;
  readOnly?: boolean;
}

const NIVEL_COLORS: Record<number, string> = {
  3: 'bg-emerald-600',
  2: 'bg-lime-600',
  1: 'bg-amber-500',
  0: 'bg-red-600',
};

export function SimNaoField({
  label,
  value,
  onChange,
  readOnly,
  required,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <RadioGroup
        value={value || ''}
        onValueChange={onChange}
        disabled={readOnly}
        className="flex gap-4"
      >
        {['Sim', 'Não'].map((opt) => (
          <div key={opt} className="flex items-center gap-2">
            <RadioGroupItem value={opt} id={`${label}_${opt}`} />
            <Label htmlFor={`${label}_${opt}`} className="cursor-pointer text-sm">
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

export function RubricaCard({
  titulo,
  resumo,
  niveis,
  value,
  onChange,
  readOnly,
}: {
  titulo: string;
  resumo: string;
  niveis: { value: number; label: string; description: string }[];
  value: any;
  onChange: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold leading-snug">{titulo}</p>
        <p className="mt-1 text-sm italic text-muted-foreground">{resumo}</p>
      </div>

      <div className="space-y-1.5">
        {niveis.map((n) => (
          <div key={n.value} className="flex gap-2 text-xs">
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-white ${NIVEL_COLORS[n.value]}`}
            >
              {n.value}
            </span>
            <p className="min-w-0 break-words leading-snug">
              <span className="font-semibold">{n.label}: </span>
              {n.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {[3, 2, 1, 0].map((v) => {
          const active = Number(value) === v;
          return (
            <button
              key={v}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(v)}
              className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? `${NIVEL_COLORS[v]} border-transparent text-white`
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {v} — {niveis.find((n) => n.value === v)?.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RubricaSelector({
  label,
  selectedKey,
  onSelect,
  disabledKeys,
  readOnly,
}: {
  label: string;
  selectedKey: string;
  onSelect: (key: string) => void;
  disabledKeys: string[];
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} <span className="text-destructive">*</span>
      </Label>
      <Select value={selectedKey || ''} onValueChange={onSelect} disabled={readOnly}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a rubrica observada" />
        </SelectTrigger>
        <SelectContent className="max-w-[92vw]">
          {RUBRICA_FOCOS.map((foco) => (
            <SelectGroup key={foco}>
              <SelectLabel className="whitespace-normal break-words text-xs uppercase text-muted-foreground">
                {foco}
              </SelectLabel>
              {RUBRICAS.filter((r: RubricaDef) => r.foco === foco).map((r: RubricaDef) => (
                <SelectItem key={r.key} value={r.key} disabled={disabledKeys.includes(r.key)}>
                  <span className="block max-w-[70vw] whitespace-normal break-words sm:max-w-[520px]">
                    {r.numero} - {r.titulo}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

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

export function RegistroApoioPresencialContent({
  responses,
  onChange,
  readOnly,
}: InstrumentContentProps) {
  const r = responses || {};
  const rubrica1 = RUBRICAS.find((x) => x.key === r.rubrica_1_key);
  const rubrica2 = RUBRICAS.find((x) => x.key === r.rubrica_2_key);
  const pratica = (ordem: number): PraticaDef => PRATICAS_ESSENCIAIS[ordem - 1];

  const observadores: string[] = Array.isArray(r.outros_observadores) ? r.outros_observadores : [];

  return (
    <div className="space-y-5">
      <Block title="2. Dados da Realização">
        <SimNaoField
          label="Turma do VOAR"
          value={r.turma_voar}
          onChange={(v) => onChange('turma_voar', v)}
          readOnly={readOnly}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Alunos presentes <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min={0}
              value={r.alunos_presentes ?? ''}
              disabled={readOnly}
              onChange={(e) =>
                onChange('alunos_presentes', e.target.value ? parseInt(e.target.value) : null)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>
              Qual a diferença entre o horário previsto e o horário real de início da aula?
            </Label>
            <Select
              value={r.diferenca_horario || ''}
              onValueChange={(v) => onChange('diferenca_horario', v)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {DIFERENCA_HORARIO_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        <div className="space-y-2">
          <Label>Outros observadores</Label>
          <div className="space-y-2 rounded-md border border-border p-3">
            {OUTROS_OBSERVADORES_OPTIONS.map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={observadores.includes(opt)}
                  disabled={readOnly}
                  onCheckedChange={(checked) =>
                    onChange(
                      'outros_observadores',
                      checked ? [...observadores, opt] : observadores.filter((o) => o !== opt),
                    )
                  }
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <SimNaoField
          label="Devolutiva realizada"
          required
          value={r.devolutiva_realizada}
          onChange={(v) => onChange('devolutiva_realizada', v)}
          readOnly={readOnly}
        />

        {r.devolutiva_realizada === 'Sim' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data da devolutiva</Label>
              <Input
                type="date"
                value={r.data_devolutiva ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('data_devolutiva', e.target.value || null)}
              />
            </div>
            <SimNaoField
              label="Dobradinha"
              value={r.dobradinha}
              onChange={(v) => onChange('dobradinha', v)}
              readOnly={readOnly}
            />
          </div>
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

      <Block title="3. Coleta de Evidências">
        <div className="space-y-2">
          <Label>
            Registre as evidências da observação de aula <span className="text-destructive">*</span>
          </Label>
          <Textarea
            rows={6}
            value={r.evidencias_observacao ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('evidencias_observacao', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Dica: use o Gem Transcritor de Evidências para te ajudar a transcrever o que você
            escreveu no caderno.{' '}
            <a
              href={GEM_TRANSCRITOR_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary underline"
            >
              Acesse aqui <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </Block>

      <Block title="4. Devolutiva Formativa">
        <div className="space-y-2">
          <Label>Temas abordados na devolutiva</Label>
          <Textarea
            rows={4}
            value={r.devolutiva_temas ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('devolutiva_temas', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Encaminhamentos combinados com o Professor</Label>
          <Textarea
            rows={4}
            value={r.devolutiva_encaminhamentos ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('devolutiva_encaminhamentos', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Participação e engajamento do Professor na devolutiva</Label>
          <Textarea
            rows={4}
            value={r.devolutiva_participacao ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('devolutiva_participacao', e.target.value)}
          />
        </div>
      </Block>


      <Block title="5. Escolha da Rubrica de Observação">
        <RubricaSelector
          label="Rubrica observada"
          selectedKey={r.rubrica_1_key || ''}
          onSelect={(k) => onChange('rubrica_1_key', k)}
          disabledKeys={r.rubrica_2_key ? [r.rubrica_2_key] : []}
          readOnly={readOnly}
        />
        {rubrica1 && (
          <RubricaCard
            titulo={`${rubrica1.numero} - ${rubrica1.titulo}`}
            resumo={rubrica1.resumo}
            niveis={rubrica1.niveis}
            value={r.rubrica_1_nota}
            onChange={(v) => onChange('rubrica_1_nota', v)}
            readOnly={readOnly}
          />
        )}
        <SimNaoField
          label="Existe outra rubrica escolhida?"
          value={r.tem_rubrica_2}
          onChange={(v) => {
            onChange('tem_rubrica_2', v);
            if (v === 'Não') {
              onChange('rubrica_2_key', null);
              onChange('rubrica_2_nota', null);
            }
          }}
          readOnly={readOnly}
        />
      </Block>

      {r.tem_rubrica_2 === 'Sim' && (
        <Block title="6. Segunda Rubrica de Observação">
          <RubricaSelector
            label="Segunda rubrica observada"
            selectedKey={r.rubrica_2_key || ''}
            onSelect={(k) => onChange('rubrica_2_key', k)}
            disabledKeys={r.rubrica_1_key ? [r.rubrica_1_key] : []}
            readOnly={readOnly}
          />
          {rubrica2 && (
            <RubricaCard
              titulo={`${rubrica2.numero} - ${rubrica2.titulo}`}
              resumo={rubrica2.resumo}
              niveis={rubrica2.niveis}
              value={r.rubrica_2_nota}
              onChange={(v) => onChange('rubrica_2_nota', v)}
              readOnly={readOnly}
            />
          )}
        </Block>
      )}

      <Block title="7. Rubrica da Primeira Prática Essencial — Retomada">
        <RubricaCard
          titulo={pratica(1).titulo}
          resumo={pratica(1).resumo}
          niveis={pratica(1).niveis}
          value={r.pratica_1_nota}
          onChange={(v) => onChange('pratica_1_nota', v)}
          readOnly={readOnly}
        />
        <SimNaoField
          label="Você observou outra prática essencial?"
          value={r.tem_pratica_2}
          onChange={(v) => {
            onChange('tem_pratica_2', v);
            if (v === 'Não') {
              onChange('pratica_2_nota', null);
              onChange('tem_pratica_3', null);
              onChange('pratica_3_nota', null);
            }
          }}
          readOnly={readOnly}
        />
      </Block>

      {r.tem_pratica_2 === 'Sim' && (
        <Block title="8. Rubrica da Segunda Prática Essencial">
          <RubricaCard
            titulo={pratica(2).titulo}
            resumo={pratica(2).resumo}
            niveis={pratica(2).niveis}
            value={r.pratica_2_nota}
            onChange={(v) => onChange('pratica_2_nota', v)}
            readOnly={readOnly}
          />
          <SimNaoField
            label="Você observou outra prática essencial?"
            value={r.tem_pratica_3}
            onChange={(v) => {
              onChange('tem_pratica_3', v);
              if (v === 'Não') onChange('pratica_3_nota', null);
            }}
            readOnly={readOnly}
          />
        </Block>
      )}

      {r.tem_pratica_2 === 'Sim' && r.tem_pratica_3 === 'Sim' && (
        <Block title="9. Rubrica da Terceira Prática Essencial">
          <RubricaCard
            titulo={pratica(3).titulo}
            resumo={pratica(3).resumo}
            niveis={pratica(3).niveis}
            value={r.pratica_3_nota}
            onChange={(v) => onChange('pratica_3_nota', v)}
            readOnly={readOnly}
          />
        </Block>
      )}
    </div>
  );
}

export default RegistroApoioPresencialContent;
