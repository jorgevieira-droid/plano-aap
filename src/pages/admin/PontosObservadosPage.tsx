import { useState, useEffect, useRef } from 'react';
import { Download, Loader2, FileText, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ProgramaType = Database['public']['Enums']['programa_type'];

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Programa de Regionais de Ensino',
  redes_municipais: 'Programa de Redes Municipais',
};

interface Programacao {
  id: string;
  titulo: string;
  data: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  programa: string[] | null;
}

interface RegistroAcao {
  id: string;
  observacoes: string | null;
  avancos: string | null;
  dificuldades: string | null;
  tipo: string;
  data: string;
  segmento: string;
  componente: string;
  ano_serie: string;
}

interface InstrumentField {
  id: string;
  field_key: string;
  label: string;
  dimension: string | null;
  form_type: string;
  scale_min: number | null;
  scale_max: number | null;
  scale_labels: any;
  sort_order: number;
  field_type: string;
}

interface InstrumentResponse {
  id: string;
  form_type: string;
  responses: Record<string, any>;
  professor_id: string | null;
}

interface AvaliacaoAula {
  id: string;
  professor_id: string;
  clareza_objetivos: number;
  dominio_conteudo: number;
  estrategias_didaticas: number;
  engajamento_turma: number;
  gestao_tempo: number;
  observacoes: string | null;
}

const segmentoLabels: Record<string, string> = {
  anos_iniciais: 'Anos Iniciais',
  anos_finais: 'Anos Finais',
  ensino_medio: 'Ensino Médio',
};

export default function PontosObservadosPage() {
  const { profile } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter states
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [formadorFilter, setFormadorFilter] = useState<string>('todos');
  const [formacaoFilter, setFormacaoFilter] = useState<string>('');

  // Data
  const [formadores, setFormadores] = useState<{ id: string; nome: string }[]>([]);
  const [formacoes, setFormacoes] = useState<Programacao[]>([]);
  const [escolas, setEscolas] = useState<{ id: string; nome: string }[]>([]);
  const [professores, setProfessores] = useState<{ id: string; nome: string }[]>([]);

  // Selected formation data
  const [registros, setRegistros] = useState<RegistroAcao[]>([]);
  const [instrumentFields, setInstrumentFields] = useState<InstrumentField[]>([]);
  const [instrumentResponses, setInstrumentResponses] = useState<InstrumentResponse[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoAula[]>([]);

  // Load formadores and formações
  useEffect(() => {
    const loadFormacoes = async () => {
      // Load all realized formations
      const { data: programacoes } = await supabase
        .from('programacoes')
        .select('id, titulo, data, escola_id, aap_id, segmento, componente, ano_serie, programa')
        .in('tipo', ['formacao', 'visita', 'acompanhamento_aula', 'observacao_aula', 'devolutiva'])
        .eq('status', 'realizada')
        .order('data', { ascending: false });

      const allFormacoes = (programacoes || []) as Programacao[];

      // Get unique formador IDs
      const aapIds = [...new Set(allFormacoes.map(f => f.aap_id))];

      // Load formador names
      const { data: profilesData } = await supabase
        .from('profiles_directory')
        .select('id, nome')
        .in('id', aapIds.length > 0 ? aapIds : ['00000000-0000-0000-0000-000000000000']);

      setFormadores((profilesData || []).filter(p => p.id && p.nome).map(p => ({ id: p.id!, nome: p.nome! })));
      setFormacoes(allFormacoes);

      // Load escolas
      const escolaIds = [...new Set(allFormacoes.map(f => f.escola_id))];
      if (escolaIds.length > 0) {
        const { data: escolasData } = await supabase
          .from('escolas')
          .select('id, nome')
          .in('id', escolaIds);
        setEscolas(escolasData || []);
      }
    };

    loadFormacoes();
  }, []);

  // Filter formações based on programa and formador
  const filteredFormacoes = formacoes.filter(f => {
    if (programaFilter !== 'todos' && (!f.programa || !f.programa.includes(programaFilter))) return false;
    if (formadorFilter !== 'todos' && f.aap_id !== formadorFilter) return false;
    return true;
  });

  // Load data when a formation is selected
  useEffect(() => {
    if (!formacaoFilter) {
      setRegistros([]);
      setInstrumentResponses([]);
      setInstrumentFields([]);
      setAvaliacoes([]);
      return;
    }

    const loadFormacaoData = async () => {
      setIsLoading(true);
      try {
        // Fetch registros linked to this programação
        const { data: registrosData } = await supabase
          .from('registros_acao')
          .select('id, observacoes, avancos, dificuldades, tipo, data, segmento, componente, ano_serie')
          .eq('programacao_id', formacaoFilter);

        const regs = (registrosData || []) as RegistroAcao[];
        setRegistros(regs);

        if (regs.length === 0) {
          setInstrumentResponses([]);
          setInstrumentFields([]);
          setAvaliacoes([]);
          setIsLoading(false);
          return;
        }

        const regIds = regs.map(r => r.id);

        // Fetch instrument responses, avaliacoes, and professors in parallel
        const [responsesRes, avaliacoesRes, professoresRes] = await Promise.all([
          supabase
            .from('instrument_responses')
            .select('id, form_type, responses, professor_id')
            .in('registro_acao_id', regIds),
          supabase
            .from('avaliacoes_aula')
            .select('id, professor_id, clareza_objetivos, dominio_conteudo, estrategias_didaticas, engajamento_turma, gestao_tempo, observacoes')
            .in('registro_acao_id', regIds),
          supabase
            .from('professores')
            .select('id, nome'),
        ]);

        const responses = (responsesRes.data || []) as InstrumentResponse[];
        setInstrumentResponses(responses);
        setAvaliacoes((avaliacoesRes.data || []) as AvaliacaoAula[]);
        setProfessores((professoresRes.data || []).map(p => ({ id: p.id, nome: p.nome })));

        // Get unique form types and fetch field definitions
        const formTypes = [...new Set(responses.map(r => r.form_type))];
        if (formTypes.length > 0) {
          const { data: fieldsData } = await supabase
            .from('instrument_fields')
            .select('id, field_key, label, dimension, form_type, scale_min, scale_max, scale_labels, sort_order, field_type')
            .in('form_type', formTypes)
            .order('sort_order');
          setInstrumentFields((fieldsData || []) as InstrumentField[]);
        } else {
          setInstrumentFields([]);
        }
      } catch (error) {
        console.error('Error loading formation data:', error);
        toast.error('Erro ao carregar dados da formação');
      } finally {
        setIsLoading(false);
      }
    };

    loadFormacaoData();
  }, [formacaoFilter]);

  const selectedFormacao = formacoes.find(f => f.id === formacaoFilter);
  const escolaNome = escolas.find(e => e.id === selectedFormacao?.escola_id)?.nome || '';
  const formadorNome = formadores.find(f => f.id === selectedFormacao?.aap_id)?.nome || '';

  const getProfessorNome = (id: string | null) => {
    if (!id) return 'N/A';
    return professores.find(p => p.id === id)?.nome || id.slice(0, 8);
  };

  // Group instrument responses by form_type
  const responsesByFormType = instrumentResponses.reduce((acc, resp) => {
    if (!acc[resp.form_type]) acc[resp.form_type] = [];
    acc[resp.form_type].push(resp);
    return acc;
  }, {} as Record<string, InstrumentResponse[]>);

  const getFieldLabel = (formType: string, fieldKey: string) => {
    return instrumentFields.find(f => f.form_type === formType && f.field_key === fieldKey)?.label || fieldKey;
  };

  const getFormTypeLabel = (formType: string) => {
    const field = instrumentFields.find(f => f.form_type === formType);
    if (!field) return formType;
    // Use dimension or form_type as group label
    return formType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleExportPdf = async () => {
    if (!contentRef.current || !selectedFormacao) return;

    setIsExporting(true);
    toast.info('Gerando PDF...');

    try {
      const a4Width = 210;
      const a4Height = 297;
      const margin = 10;
      const headerHeight = 25;
      const contentWidth = a4Width - margin * 2;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Load logo
      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        const logoModule = await import('@/assets/pe-logo-branco-horizontal.png');
        logoImg.src = logoModule.default;
        await new Promise((resolve, reject) => {
          logoImg!.onload = resolve;
          logoImg!.onerror = reject;
          setTimeout(reject, 3000);
        });
      } catch {
        logoImg = null;
      }

      const programaText = selectedFormacao.programa?.[0]
        ? programaLabels[selectedFormacao.programa[0] as ProgramaType] || selectedFormacao.programa[0]
        : 'Programa';
      const dataFormatada = format(new Date(selectedFormacao.data + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

      const drawHeader = (isFirst: boolean) => {
        const hdrH = headerHeight;
        pdf.setFillColor(26, 58, 92);
        pdf.roundedRect(margin, 4, a4Width - margin * 2, hdrH - 4, 4, 4, 'F');

        const logoH = 9;
        const logoW = 45;
        const logoX = margin + 6;
        const logoY = 4 + (hdrH - 4 - logoH) / 2;
        if (logoImg) {
          pdf.addImage(logoImg, 'PNG', logoX, logoY, logoW, logoH);
        }

        const titleX = logoX + logoW + 6;
        const midY = 4 + (hdrH - 4) / 2;
        pdf.setTextColor(255, 255, 255);

        if (isFirst) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Pontos Observados por Formação', titleX, midY - 3);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${selectedFormacao.titulo} • ${escolaNome}`, titleX, midY + 2);
          pdf.setFontSize(7);
          pdf.setTextColor(180, 200, 220);
          pdf.text(`${formadorNome} • ${dataFormatada}`, titleX, midY + 6.5);
        } else {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Pontos Observados por Formação', titleX, midY + 1);
        }

        const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const dateW = pdf.getTextWidth(dateStr);
        pdf.text(dateStr, a4Width - margin - 6 - dateW, midY + 1);
      };

      drawHeader(true);

      // Capture content sections
      const sections = Array.from(contentRef.current.querySelectorAll('[data-pdf-section]')) as HTMLElement[];
      const contentStartY = headerHeight + margin;
      let currentY = contentStartY;

      for (const section of sections) {
        const canvas = await html2canvas(section, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgW = contentWidth;
        const imgH = (canvas.height / canvas.width) * imgW;

        if (currentY + imgH > a4Height - margin) {
          pdf.addPage();
          drawHeader(false);
          currentY = contentStartY;
        }

        pdf.addImage(imgData, 'JPEG', margin, currentY, imgW, imgH);
        currentY += imgH + 3;
      }

      const fileName = `pontos_observados_${selectedFormacao.titulo.replace(/\s+/g, '_')}_${selectedFormacao.data}.pdf`;
      pdf.save(fileName);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const hasData = registros.length > 0 || instrumentResponses.length > 0 || avaliacoes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pontos Observados por Formação</h1>
          <p className="text-muted-foreground">Visualize e exporte os pontos observados em cada formação</p>
        </div>
        {selectedFormacao && hasData && (
          <Button onClick={handleExportPdf} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Exportar PDF
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Programa</label>
              <Select value={programaFilter} onValueChange={(v) => { setProgramaFilter(v as ProgramaType | 'todos'); setFormacaoFilter(''); }}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="escolas">Escolas</SelectItem>
                  <SelectItem value="regionais">Regionais</SelectItem>
                  <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Formador</label>
              <Select value={formadorFilter} onValueChange={(v) => { setFormadorFilter(v); setFormacaoFilter(''); }}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {formadores.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Formação</label>
              <Select value={formacaoFilter} onValueChange={setFormacaoFilter}>
                <SelectTrigger><SelectValue placeholder="Selecione uma formação" /></SelectTrigger>
                <SelectContent>
                  {filteredFormacoes.map(f => {
                    const escola = escolas.find(e => e.id === f.escola_id);
                    const dataStr = format(new Date(f.data + 'T12:00:00'), 'dd/MM/yyyy');
                    return (
                      <SelectItem key={f.id} value={f.id}>
                        {f.titulo} — {dataStr} {escola ? `(${escola.nome})` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !formacaoFilter ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione uma formação para visualizar os pontos observados</p>
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum registro encontrado para esta formação</p>
          </CardContent>
        </Card>
      ) : (
        <div ref={contentRef}>
          {/* Formation Info */}
          {selectedFormacao && (
            <Card data-pdf-section className="mb-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Formação</p>
                    <p className="font-semibold text-sm">{selectedFormacao.titulo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-semibold text-sm">{format(new Date(selectedFormacao.data + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Escola</p>
                    <p className="font-semibold text-sm">{escolaNome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Formador</p>
                    <p className="font-semibold text-sm">{formadorNome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Segmento</p>
                    <p className="font-semibold text-sm">{segmentoLabels[selectedFormacao.segmento] || selectedFormacao.segmento}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Componente</p>
                    <p className="font-semibold text-sm">{selectedFormacao.componente}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ano/Série</p>
                    <p className="font-semibold text-sm">{selectedFormacao.ano_serie}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Programa</p>
                    <p className="font-semibold text-sm">
                      {selectedFormacao.programa?.map(p => programaLabels[p as ProgramaType] || p).join(', ') || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avaliacoes de Aula (legacy fields) */}
          {avaliacoes.length > 0 && (
            <Card data-pdf-section className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Avaliações de Aula</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-2 border border-border">Professor</th>
                        <th className="text-center p-2 border border-border">Intencionalidade</th>
                        <th className="text-center p-2 border border-border">Estratégias</th>
                        <th className="text-center p-2 border border-border">Mediação</th>
                        <th className="text-center p-2 border border-border">Engajamento</th>
                        <th className="text-center p-2 border border-border">Avaliação</th>
                        <th className="text-left p-2 border border-border">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {avaliacoes.map((av) => (
                        <tr key={av.id} className="even:bg-muted/30">
                          <td className="p-2 border border-border">{getProfessorNome(av.professor_id)}</td>
                          <td className="text-center p-2 border border-border">{av.clareza_objetivos}</td>
                          <td className="text-center p-2 border border-border">{av.dominio_conteudo}</td>
                          <td className="text-center p-2 border border-border">{av.estrategias_didaticas}</td>
                          <td className="text-center p-2 border border-border">{av.engajamento_turma}</td>
                          <td className="text-center p-2 border border-border">{av.gestao_tempo}</td>
                          <td className="p-2 border border-border text-xs">{av.observacoes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instrument Responses */}
          {Object.keys(responsesByFormType).length > 0 && (
            <>
              {Object.entries(responsesByFormType).map(([formType, responses]) => {
                const fields = instrumentFields
                  .filter(f => f.form_type === formType)
                  .sort((a, b) => a.sort_order - b.sort_order);

                return (
                  <Card key={formType} data-pdf-section className="mb-4">
                    <CardHeader>
                      <CardTitle className="text-base">{getFormTypeLabel(formType)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="text-left p-2 border border-border">Professor</th>
                              {fields.map(field => (
                                <th key={field.field_key} className="text-center p-2 border border-border text-xs">
                                  {field.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {responses.map((resp) => (
                              <tr key={resp.id} className="even:bg-muted/30">
                                <td className="p-2 border border-border">{getProfessorNome(resp.professor_id)}</td>
                                {fields.map(field => {
                                  const value = resp.responses?.[field.field_key];
                                  const displayValue = value !== undefined && value !== null ? String(value) : '-';
                                  return (
                                    <td key={field.field_key} className={`p-2 border border-border ${field.field_type === 'text' ? 'text-xs text-left' : 'text-center'}`}>
                                      {displayValue}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}

          {/* Observações dos Registros */}
          {registros.some(r => r.observacoes || r.avancos || r.dificuldades) && (
            <Card data-pdf-section className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Observações do Registro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {registros.map((reg) => (
                  <div key={reg.id} className="space-y-3">
                    {reg.observacoes && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                        <p className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{reg.observacoes}</p>
                      </div>
                    )}
                    {reg.avancos && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Avanços</p>
                        <p className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{reg.avancos}</p>
                      </div>
                    )}
                    {reg.dificuldades && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Dificuldades</p>
                        <p className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{reg.dificuldades}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
