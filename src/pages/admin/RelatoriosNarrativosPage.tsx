import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FileDown, Loader2, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, ProgramaType } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { programaLabels } from "@/config/roleConfig";
import { INSTRUMENT_FORM_TYPES, useInstrumentFields } from "@/hooks/useInstrumentFields";
import { useAcoesByPrograma } from "@/hooks/useAcoesByPrograma";
import { normalizeAcaoTipo } from "@/config/acaoPermissions";
import { useNarrativeReport, NarrativeReport } from "@/hooks/useNarrativeReport";
import { NarrativeReportViewer } from "@/components/relatoriosNarrativos/NarrativeReportViewer";
import { exportSectionsToPdf } from "@/lib/pdfExport";

const PROGRAMAS: ProgramaType[] = ["escolas", "regionais", "redes_municipais"];
const sortAZ = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

const DEDICATED_TABLES: Record<string, string> = {
  registro_consultoria_pedagogica: "consultoria_pedagogica_respostas",
  monitoramento_gestao: "relatorios_monitoramento_gestao",
  monitoramento_acoes_formativas: "relatorios_monit_acoes_formativas",
  observacao_aula_redes: "observacoes_aula_redes",
  visita_tecnica_alfabetizacao_redes: "relatorios_visita_tecnica_alfabetizacao_redes",
  encontro_microciclos_recomposicao: "relatorios_microciclos_recomposicao",
  encontro_eteg_redes: "relatorios_eteg_redes",
  encontro_professor_redes: "relatorios_professor_redes",
  observacao_aula: "avaliacoes_aula",
  visita_tecnica_alfabetizacao: "relatorios_visita_tecnica_alfabetizacao",
  visita_tecnica_tarl: "relatorios_visita_tecnica_tarl",
  observacao_aula_gpa: "observacoes_aula_gpa",
  reuniao_acomp_alfabetizacao: "relatorios_reuniao_acomp_alfabetizacao",
};

const INSTRUMENT_FORM_TYPE_VALUES = new Set<string>(
  INSTRUMENT_FORM_TYPES.map((t) => t.value as string),
);
const actionTypeAliases = (formType: string) => {
  const set = new Set<string>([formType]);
  if (formType === "observacao_aula") {
    set.add("acompanhamento_aula");
    set.add("visita");
  }
  return Array.from(set);
};

const STATUS_OPTIONS = [
  { value: "prevista", label: "Prevista" },
  { value: "agendada", label: "Agendada" },
  { value: "realizada", label: "Realizada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "reagendada", label: "Reagendada" },
];

const slugify = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "relatorio_narrativo";

export default function RelatoriosNarrativosPage() {
  const { profile, isAdmin, isManager, effectiveProgramas } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const allowed = isManager;
  useEffect(() => {
    if (profile && !allowed) navigate("/unauthorized", { replace: true });
  }, [profile, allowed, navigate]);

  const userProgramas = useMemo<ProgramaType[]>(() => {
    if (isAdmin) return PROGRAMAS;
    return (effectiveProgramas || []) as ProgramaType[];
  }, [isAdmin, effectiveProgramas]);

  const [programa, setPrograma] = useState<ProgramaType | "">("");
  const [instrumento, setInstrumento] = useState("");
  const [atorId, setAtorId] = useState("todos");
  const [entidadeId, setEntidadeId] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [report, setReport] = useState<NarrativeReport | null>(null);

  useEffect(() => {
    if (!programa && userProgramas.length === 1) setPrograma(userProgramas[0]);
  }, [userProgramas, programa]);

  const onChangePrograma = (v: string) => {
    setPrograma(v as ProgramaType);
    setInstrumento("");
    setAtorId("todos");
    setEntidadeId("todos");
    setStatus("todos");
    setDataInicio("");
    setDataFim("");
    setReport(null);
  };
  const onChangeInstrumento = (v: string) => {
    setInstrumento(v);
    setAtorId("todos");
    setEntidadeId("todos");
    setStatus("todos");
    setReport(null);
  };

  // Instrumentos disponíveis no programa
  const { data: formTypesNoPrograma = [] } = useQuery({
    queryKey: ["narrativo-formtypes", programa],
    queryFn: async () => {
      if (!programa) return [] as string[];
      const set = new Set<string>();
      const { data: registrosData } = await (supabase as any)
        .from("registros_acao")
        .select("tipo")
        .contains("programa", [programa])
        .limit(5000);
      (registrosData || []).forEach((r: any) => {
        const n = normalizeAcaoTipo(r.tipo) as string;
        if (INSTRUMENT_FORM_TYPE_VALUES.has(n)) set.add(n);
      });
      const { data } = await (supabase as any)
        .from("instrument_responses")
        .select("form_type, registros_acao!inner(programa)")
        .contains("registros_acao.programa", [programa])
        .limit(5000);
      (data || []).forEach((r: any) => r.form_type && set.add(r.form_type));
      const probes = await Promise.all(
        Object.entries(DEDICATED_TABLES).map(async ([ft, table]) => {
          const { data: d } = await (supabase as any)
            .from(table)
            .select("id, registros_acao!inner(programa)")
            .contains("registros_acao.programa", [programa])
            .limit(1);
          return (d || []).length > 0 ? ft : null;
        }),
      );
      probes.forEach((ft) => ft && set.add(ft));
      return Array.from(set);
    },
    enabled: !!programa,
  });

  const { isAcaoEnabledForPrograma, isAcaoInativa } = useAcoesByPrograma();

  const instrumentosDisponiveis = useMemo(() => {
    const avail = new Set<string>(formTypesNoPrograma as string[]);
    const isActive = (ft: string) =>
      !!programa && isAcaoEnabledForPrograma(ft, programa as ProgramaType) && !isAcaoInativa(ft);
    const items: { value: string; label: string }[] = INSTRUMENT_FORM_TYPES
      .filter((t) => avail.has(t.value as string) && isActive(t.value as string))
      .map((t) => ({ value: t.value as string, label: t.label as string }));
    return items.sort((a, b) => sortAZ(a.label, b.label));
  }, [formTypesNoPrograma, programa, isAcaoEnabledForPrograma, isAcaoInativa]);

  // Atores
  const { data: atores = [] } = useQuery({
    queryKey: ["narrativo-atores", programa, instrumento],
    queryFn: async () => {
      if (!programa || !instrumento) return [] as { id: string; nome: string }[];
      const { data } = await (supabase as any)
        .from("registros_acao")
        .select("aap_id")
        .in("tipo", actionTypeAliases(instrumento))
        .contains("programa", [programa])
        .limit(5000);
      const ids = Array.from(new Set((data || []).map((r: any) => r.aap_id).filter(Boolean))) as string[];
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles").select("id, nome").in("id", ids);
      return (profs || [])
        .map((p) => ({ id: p.id, nome: p.nome || "—" }))
        .sort((a, b) => sortAZ(a.nome, b.nome));
    },
    enabled: !!programa && !!instrumento,
  });

  // Entidades
  const { data: entidades = [] } = useQuery({
    queryKey: ["narrativo-entidades", programa],
    queryFn: async () => {
      if (!programa) return [] as { id: string; nome: string }[];
      const { data } = await (supabase as any)
        .from("escolas")
        .select("id, nome")
        .eq("ativa", true)
        .contains("programa", [programa]);
      return (data || [])
        .map((e: any) => ({ id: e.id, nome: e.nome || "—" }))
        .sort((a: any, b: any) => sortAZ(a.nome, b.nome));
    },
    enabled: !!programa,
  });

  const { fields } = useInstrumentFields(instrumento || undefined);
  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  );

  const instrumentoLabel = useMemo(
    () => instrumentosDisponiveis.find((i) => i.value === instrumento)?.label || instrumento,
    [instrumentosDisponiveis, instrumento],
  );

  const narrative = useNarrativeReport();

  const handleGerar = () => {
    if (!programa || !instrumento) return;
    setReport(null);
    narrative.mutate(
      {
        filters: {
          programa,
          programaLabel: programaLabels[programa as ProgramaType] || programa,
          instrumento,
          instrumentoLabel,
          atorId,
          entidadeId,
          status,
          dataInicio,
          dataFim,
        },
        fields: orderedFields,
      },
      {
        onSuccess: (r) => setReport(r),
        onError: (e: any) => {
          toast({
            title: "Erro ao gerar relatório",
            description: e?.message || "Tente novamente em instantes.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const viewerRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const handleExportPdf = async () => {
    if (!report) return;
    setPdfLoading(true);
    try {
      await exportSectionsToPdf(
        [{ node: <NarrativeReportViewer report={report} /> }],
        `${slugify(report.filters.programaLabel)}_${slugify(report.filters.instrumentoLabel)}_narrativo.pdf`,
        {
          title: `Relatório Narrativo — ${report.filters.instrumentoLabel}`,
          subtitle: `${report.filters.programaLabel}`,
        },
      );
    } finally {
      setPdfLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios Narrativos</h1>
        <p className="text-sm text-muted-foreground">
          Selecione a ação/instrumento e gere um relatório consolidado com temas, médias e destaques,
          no formato do relatório de Consultoria Pedagógica.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Programa *</Label>
              <Select value={programa} onValueChange={onChangePrograma}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um programa" />
                </SelectTrigger>
                <SelectContent>
                  {userProgramas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {programaLabels[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ação / Instrumento *</Label>
              <Select value={instrumento} onValueChange={onChangeInstrumento} disabled={!programa}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={programa ? "Selecione uma ação/instrumento" : "Selecione o Programa primeiro"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {instrumentosDisponiveis.length === 0 && programa ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum instrumento com registros neste programa.
                    </div>
                  ) : (
                    instrumentosDisponiveis.map((i) => (
                      <SelectItem key={i.value} value={i.value}>
                        {i.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Filtros opcionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label>Ator</Label>
                  <Select value={atorId} onValueChange={setAtorId} disabled={!programa || !instrumento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {atores.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entidade</Label>
                  <Select value={entidadeId} onValueChange={setEntidadeId} disabled={!programa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {(entidades as any[]).map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus} disabled={!programa || !instrumento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    disabled={!programa || !instrumento}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data fim</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    disabled={!programa || !instrumento}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {report && (
          <Button variant="outline" onClick={handleExportPdf} disabled={pdfLoading}>
            {pdfLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>
        )}
        <Button
          onClick={handleGerar}
          disabled={!programa || !instrumento || narrative.isPending}
        >
          {narrative.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Gerar Relatório
        </Button>
      </div>

      {narrative.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Analisando registros e gerando o relatório…</p>
          </CardContent>
        </Card>
      )}

      {report && !narrative.isPending && (
        <div ref={viewerRef}>
          <NarrativeReportViewer report={report} />
        </div>
      )}
    </div>
  );
}
