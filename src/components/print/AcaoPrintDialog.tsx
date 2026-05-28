import React, { useEffect, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { exportSectionsToPdf } from '@/lib/pdfExport';
import { AcaoPrintForm } from './AcaoPrintForm';
import { getAcaoLabel, normalizeAcaoTipo } from '@/config/acaoPermissions';
import type { InstrumentField } from '@/hooks/useInstrumentFields';
import { toast } from 'sonner';

function slugify(s: string): string {
  return (s || 'acao')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'acao';
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  programacaoId: string | null;
}

export function AcaoPrintDialog({ open, onOpenChange, programacaoId }: Props) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<{
    programacao: any;
    escolaNome: string;
    responsavelNome: string;
    professorNome?: string;
    fields: InstrumentField[];
    responses: Record<string, any> | null;
    textFields: { label: string; value: string | null | undefined }[];
    acaoLabel: string;
    visitaMicrociclos?: any | null;
    visitaAlfabetizacao?: any | null;
  } | null>(null);

  useEffect(() => {
    if (!open || !programacaoId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: prog } = await supabase
          .from('programacoes')
          .select('*')
          .eq('id', programacaoId)
          .maybeSingle();
        if (!prog) throw new Error('Programação não encontrada');

        const [{ data: escola }, { data: responsavel }] = await Promise.all([
          prog.escola_id
            ? supabase.from('escolas').select('nome').eq('id', prog.escola_id).maybeSingle()
            : Promise.resolve({ data: null } as any),
          prog.aap_id
            ? supabase.from('profiles').select('nome').eq('id', prog.aap_id).maybeSingle()
            : Promise.resolve({ data: null } as any),
        ]);

        const formType = normalizeAcaoTipo(prog.tipo);

        const { data: fields } = await (supabase as any)
          .from('instrument_fields')
          .select('*')
          .eq('form_type', formType)
          .order('sort_order', { ascending: true });

        // Load registro_acao to find responses if action was realized
        const { data: registros } = await supabase
          .from('registros_acao')
          .select('id')
          .eq('programacao_id', prog.id)
          .limit(1);
        const registroId = registros?.[0]?.id;

        let responses: Record<string, any> | null = null;
        const textFields: { label: string; value: string | null | undefined }[] = [];

        if (registroId) {
          // Generic instrument response
          const { data: ir } = await (supabase as any)
            .from('instrument_responses')
            .select('responses')
            .eq('registro_acao_id', registroId)
            .eq('form_type', formType)
            .maybeSingle();
          if (ir?.responses) responses = ir.responses;

          // Special tables
          if (formType === 'observacao_aula') {
            const { data: av } = await supabase
              .from('avaliacoes_aula')
              .select('clareza_objetivos,dominio_conteudo,estrategias_didaticas,engajamento_turma,gestao_tempo,observacoes')
              .eq('registro_acao_id', registroId)
              .maybeSingle();
            if (av) {
              responses = {
                clareza_objetivos: av.clareza_objetivos,
                dominio_conteudo: av.dominio_conteudo,
                estrategias_didaticas: av.estrategias_didaticas,
                engajamento_turma: av.engajamento_turma,
                gestao_tempo: av.gestao_tempo,
                ...(responses || {}),
              };
              if (av.observacoes) textFields.push({ label: 'Observações', value: av.observacoes });
            }
          }

          if (formType === 'registro_consultoria_pedagogica') {
            const { data: cr } = await supabase
              .from('consultoria_pedagogica_respostas')
              .select('boas_praticas,pontos_preocupacao,encaminhamentos,outros_pontos')
              .eq('registro_acao_id', registroId)
              .maybeSingle();
            if (cr) {
              textFields.push(
                { label: 'Boas práticas', value: cr.boas_praticas },
                { label: 'Pontos de preocupação', value: cr.pontos_preocupacao },
                { label: 'Encaminhamentos', value: cr.encaminhamentos },
                { label: 'Outros pontos', value: cr.outros_pontos },
              );
            }
          }
        }

        // Visitas Técnicas - Microciclos (tipo `observacao_aula_redes`) — tabela própria
        // Estratégia de busca em camadas para evitar PDF em branco quando o relatório
        // foi salvo em um registro_acao diferente do vinculado a esta programação.
        let visitaMicrociclos: any | null = null;
        let professorNomeRedes: string | undefined;
        if (formType === 'observacao_aula_redes') {
          const pickBest = (rows: any[] | null | undefined) => {
            if (!rows || rows.length === 0) return null;
            // Prioriza enviado > rascunho, e mais recente.
            const sorted = [...rows].sort((a, b) => {
              const sa = a.status === 'enviado' ? 0 : 1;
              const sb = b.status === 'enviado' ? 0 : 1;
              if (sa !== sb) return sa - sb;
              return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
            });
            return sorted[0];
          };

          // 1) Direto pelo registro_acao_id principal desta programação
          if (registroId) {
            const { data: vmList } = await (supabase as any)
              .from('relatorios_visita_tecnica_microciclos')
              .select('*')
              .eq('registro_acao_id', registroId);
            visitaMicrociclos = pickBest(vmList);
          }

          // 2) Qualquer registro_acao desta mesma programação
          if (!visitaMicrociclos) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('programacao_id', prog.id);
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: vmList } = await (supabase as any)
                .from('relatorios_visita_tecnica_microciclos')
                .select('*')
                .in('registro_acao_id', ids);
              visitaMicrociclos = pickBest(vmList);
            }
          }

          // 3) Fallback final: mesma escola + mesma data (relatório salvo em outro registro)
          if (!visitaMicrociclos && prog.escola_id && prog.data) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('escola_id', prog.escola_id)
              .eq('data', prog.data)
              .eq('tipo', 'observacao_aula_redes');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: vmList } = await (supabase as any)
                .from('relatorios_visita_tecnica_microciclos')
                .select('*')
                .in('registro_acao_id', ids);
              visitaMicrociclos = pickBest(vmList);
            }
          }

          if (visitaMicrociclos?.professor_observado) {
            professorNomeRedes = visitaMicrociclos.professor_observado;
          }
        }

        // Visita Técnica — Alfabetização (REDES) — tabela própria
        let visitaAlfabetizacao: any | null = null;
        if (formType === 'visita_tecnica_alfabetizacao_redes') {
          const pickBest = (rows: any[] | null | undefined) => {
            if (!rows || rows.length === 0) return null;
            const sorted = [...rows].sort((a, b) => {
              const sa = a.status === 'enviado' ? 0 : 1;
              const sb = b.status === 'enviado' ? 0 : 1;
              if (sa !== sb) return sa - sb;
              return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
            });
            return sorted[0];
          };

          if (registroId) {
            const { data: vmList } = await (supabase as any)
              .from('relatorios_visita_tecnica_alfabetizacao_redes')
              .select('*')
              .eq('registro_acao_id', registroId);
            visitaAlfabetizacao = pickBest(vmList);
          }

          if (!visitaAlfabetizacao) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('programacao_id', prog.id);
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: vmList } = await (supabase as any)
                .from('relatorios_visita_tecnica_alfabetizacao_redes')
                .select('*')
                .in('registro_acao_id', ids);
              visitaAlfabetizacao = pickBest(vmList);
            }
          }

          if (!visitaAlfabetizacao && prog.escola_id && prog.data) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('escola_id', prog.escola_id)
              .eq('data', prog.data)
              .eq('tipo', 'visita_tecnica_alfabetizacao_redes');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: vmList } = await (supabase as any)
                .from('relatorios_visita_tecnica_alfabetizacao_redes')
                .select('*')
                .in('registro_acao_id', ids);
              visitaAlfabetizacao = pickBest(vmList);
            }
          }
        }


        // Apoio Presencial: extra cadastro fields already on programacao

        if (cancelled) return;
        setData({
          programacao: prog,
          escolaNome: (escola as any)?.nome || '—',
          responsavelNome: (responsavel as any)?.nome || '—',
          professorNome: professorNomeRedes,
          fields: (fields || []) as InstrumentField[],
          responses,
          textFields,
          acaoLabel: getAcaoLabel(prog.tipo),
          visitaMicrociclos,
          visitaAlfabetizacao,
        });
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || 'Erro ao carregar dados da ação');
        onOpenChange(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, programacaoId, onOpenChange]);

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await exportSectionsToPdf(
        [{
          node: (
            <AcaoPrintForm
              acaoLabel={data.acaoLabel}
              programacao={data.programacao}
              escolaNome={data.escolaNome}
              responsavelNome={data.responsavelNome}
              professorNome={data.professorNome}
              fields={data.fields}
              responses={data.responses}
              textFields={data.textFields}
              visitaMicrociclos={data.visitaMicrociclos}
              visitaAlfabetizacao={data.visitaAlfabetizacao}
            />
          ),
        }],
        `${slugify(data.acaoLabel)}-${data.programacao.data}.pdf`,
        { title: data.acaoLabel, subtitle: `${data.escolaNome} | ${data.programacao.data}` },
      );
      toast.success('PDF gerado');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Imprimir formulário da ação</DialogTitle>
        </DialogHeader>

        {loading || !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="text-sm space-y-2">
            <p><strong>{data.acaoLabel}</strong> — {data.programacao.titulo}</p>
            <p className="text-muted-foreground">
              Escola: {data.escolaNome} | Data: {data.programacao.data} | Status: {data.programacao.status}
            </p>
            <p className="text-muted-foreground text-xs">
              {data.programacao.status === 'realizada'
                ? 'O PDF incluirá os dados já preenchidos.'
                : 'O PDF trará a estrutura do formulário em branco para preenchimento.'}
            </p>
            {data.programacao.tipo === 'observacao_aula_redes'
              && data.programacao.status === 'realizada'
              && !data.visitaMicrociclos && (
              <p className="text-xs text-destructive">
                Atenção: não localizamos um relatório de Visita Técnica preenchido para esta ação. O PDF será gerado em branco.
              </p>
            )}
          </div>

        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleExport} disabled={loading || exporting || !data}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
            Gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
