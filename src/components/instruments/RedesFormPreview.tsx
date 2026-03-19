import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  REDES_OBSERVACAO_CRITERIA,
  ETEG_ITEMS,
  PROFESSOR_ITEMS,
  RubricaLegendCard,
  BinaryScaleLegendCard,
} from '@/pages/formularios/redesFormShared';

function ObservacaoAulaRedesPreview() {
  return (
    <div className="space-y-6">
      <RubricaLegendCard />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campos de Identificação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Entidade (Município/Escola)</p>
          <p>• Data / Horário</p>
          <p>• Nome da Escola / Professor(a) / Observador(a)</p>
          <p>• Segmento / Turma / Ano</p>
          <p>• Qtd. Estudantes (Masculino / Feminino)</p>
          <p>• Material Didático utilizado</p>
          <p>• Caderno (1 a 8)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">9 Critérios de Observação (escala 1–4)</CardTitle>
          <CardDescription>Cada critério possui 4 níveis de rubrica descritiva e campo de evidência.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {REDES_OBSERVACAO_CRITERIA.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-4 space-y-2">
              <p className="font-medium text-foreground text-sm">
                {c.id}. {c.title}
              </p>
              <p className="text-xs text-muted-foreground italic">{c.focus}</p>
              <div className="grid gap-1 mt-2">
                {c.levels.map((level, i) => (
                  <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground shrink-0">{i + 1}.</span>
                    <span>{level}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">📝 Campo de evidência (texto livre)</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campos Qualitativos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Pontos Fortes</p>
          <p>• Aspectos a Fortalecer</p>
          <p>• Estratégias Sugeridas</p>
          <p>• Combinação para Acompanhamento</p>
        </CardContent>
      </Card>
    </div>
  );
}

function BinaryItemsPreview({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="space-y-6">
      <BinaryScaleLegendCard />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campos de Identificação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Entidade (Município)</p>
          <p>• Data / Horário</p>
          <p>• Observador(a)</p>
          {title.includes('Professor') && <p>• Componente Curricular / Turma-Ano / Formador(a)</p>}
          {title.includes('ET/EG') && <p>• Equipe / Mês de Referência</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title} (escala 0–2)</CardTitle>
          <CardDescription>Cada item é avaliado em escala de 0 a 2.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{i + 1}.</span> {item}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campos Qualitativos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Relato Objetivo</p>
          <p>• Pontos Fortes</p>
          <p>• Aspectos Críticos</p>
          <p>• Encaminhamentos</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface RedesFormPreviewProps {
  formType: string;
}

export function RedesFormPreview({ formType }: RedesFormPreviewProps) {
  switch (formType) {
    case 'observacao_aula_redes':
      return <ObservacaoAulaRedesPreview />;
    case 'encontro_eteg_redes':
      return <BinaryItemsPreview title="Itens de Verificação — Encontro ET/EG" items={ETEG_ITEMS} />;
    case 'encontro_professor_redes':
      return <BinaryItemsPreview title="Itens de Verificação — Encontro Professor" items={PROFESSOR_ITEMS} />;
    default:
      return <p className="text-muted-foreground text-center py-4">Formulário não disponível para pré-visualização.</p>;
  }
}

export const REDES_FORM_TYPES = new Set(['observacao_aula_redes', 'encontro_eteg_redes', 'encontro_professor_redes']);
