import { NarrativeReport, ThemeItem } from "@/hooks/useNarrativeReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";

interface Props {
  report: NarrativeReport;
}

const fmt1 = (n: number | null) => (n === null ? "—" : n.toFixed(2));

function Bar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ThemeBars({ themes }: { themes: ThemeItem[] }) {
  if (!themes.length) return <p className="text-sm text-muted-foreground">Sem temas identificados.</p>;
  const max = Math.max(...themes.map((t) => t.count), 1);
  return (
    <ul className="space-y-3">
      {themes.map((t, i) => (
        <li key={i} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{t.label}</span>
            <span className="text-xs text-muted-foreground">{t.count} menç.</span>
          </div>
          <Bar value={t.count} max={max} />
          {t.descricao && (
            <p className="text-xs leading-relaxed text-muted-foreground">{t.descricao}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

const highlightStyles: Record<string, { color: string; bg: string; border: string; label: string; icon: any }> = {
  destaque: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "DESTAQUE",
    icon: Sparkles,
  },
  alerta: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "ALERTA RECORRENTE",
    icon: AlertTriangle,
  },
  padrao: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "PADRÃO DE AÇÃO",
    icon: TrendingUp,
  },
};

export function NarrativeReportViewer({ report }: Props) {
  const { filters, totalRegistros, entidadesUnicas, atoresUnicos } = report;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card data-pdf-section>
        <CardHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{filters.instrumentoLabel}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Relatório Narrativo • {filters.programaLabel}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Gerado em {new Date().toLocaleDateString("pt-BR")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Registros</p>
              <p className="mt-1 text-2xl font-bold">{totalRegistros}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Entidades únicas</p>
              <p className="mt-1 text-2xl font-bold">{entidadesUnicas}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Atores únicos</p>
              <p className="mt-1 text-2xl font-bold">{atoresUnicos}</p>
            </div>
          </div>

          {report.resumoExecutivo && (
            <div className="mt-5 rounded-lg border-l-4 border-primary bg-muted/40 p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Resumo executivo</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed">{report.resumoExecutivo}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destaques */}
      {report.highlights.length > 0 && (
        <Card data-pdf-section>
          <CardHeader>
            <CardTitle className="text-base">Destaques, alertas e padrões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {report.highlights.map((h, i) => {
                const cfg = highlightStyles[h.tipo] || highlightStyles.padrao;
                const Icon = cfg.icon;
                return (
                  <div key={i} className={`rounded-lg border ${cfg.border} ${cfg.bg} p-4`}>
                    <div className={`mb-1 flex items-center gap-2 text-xs font-bold ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                      {cfg.label}
                    </div>
                    <p className="text-sm leading-relaxed">{h.texto}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Médias por critério (campos rating) */}
      {report.ratingDimensions.length > 0 && (
        <Card data-pdf-section>
          <CardHeader>
            <CardTitle className="text-base">Médias por critério</CardTitle>
            <p className="text-xs text-muted-foreground">
              Médias excluem zeros (N/A), exceto em escalas REDES (0–2).
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.ratingDimensions.map((d) => (
                <div key={d.field_key} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{d.label}</span>
                    <span className="text-sm">
                      <strong>{fmt1(d.avg)}</strong>
                      <span className="text-xs text-muted-foreground"> / {d.scaleMax}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({d.count} resp.)</span>
                    </span>
                  </div>
                  <Bar value={d.avg || 0} max={d.scaleMax} color="bg-primary" />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {d.distribution
                      .filter((x) => x.count > 0)
                      .map((x) => (
                        <span
                          key={x.value}
                          className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {x.value}
                          {x.label ? ` (${x.label})` : ""}: {x.count}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Temas por campo textual */}
      {Object.keys(report.themesByField).length > 0 && (
        <div className="space-y-4">
          {report.textFields
            .filter((f) => (report.themesByField[f.field_key] || []).length > 0)
            .map((f) => (
              <Card key={f.field_key} data-pdf-section>
                <CardHeader>
                  <CardTitle className="text-base">{f.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{f.responseCount} respostas analisadas</p>
                </CardHeader>
                <CardContent>
                  <ThemeBars themes={report.themesByField[f.field_key] || []} />
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Ranking de entidades */}
      {report.rankingEntidades.length > 0 && (
        <Card data-pdf-section>
          <CardHeader>
            <CardTitle className="text-base">Top entidades por volume</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">#</th>
                  <th className="py-2">Entidade</th>
                  <th className="py-2 text-right">Registros</th>
                </tr>
              </thead>
              <tbody>
                {report.rankingEntidades.map((e, i) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2">{e.nome}</td>
                    <td className="py-2 text-right font-medium">{e.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
