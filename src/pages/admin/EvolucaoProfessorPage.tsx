import { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Download, Loader2, Eye, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { EvolucaoMatrix } from '@/components/evolucao/EvolucaoMatrix';
import { EvolucaoObservacoes } from '@/components/evolucao/EvolucaoObservacoes';
import { EvolucaoPdfSection1, EvolucaoPdfSection2, EvolucaoPdfSection3 } from '@/components/evolucao/EvolucaoPdfContent';
import type { EvolucaoPdfContentProps } from '@/components/evolucao/EvolucaoPdfContent';
import { EvolucaoLineChart } from '@/components/evolucao/EvolucaoLineChart';
import type { DynamicAvaliacao, DimensionGroup } from '@/components/evolucao/EvolucaoLineChart';
import type { InstrumentField } from '@/hooks/useInstrumentFields';

interface Escola {
  id: string;
  nome: string;
}

interface Professor {
  id: string;
  nome: string;
  componente: string;
  ano_serie: string;
  segmento: string;
}

const componenteLabels: Record<string, string> = {
  matematica: 'Matemática',
  portugues: 'Língua Portuguesa',
  lingua_portuguesa: 'Língua Portuguesa',
  alfabetizacao: 'Alfabetização',
  polivalente: 'Polivalente',
};

const segmentoLabels: Record<string, string> = {
  anos_iniciais: 'Anos Iniciais',
  anos_finais: 'Anos Finais',
  ensino_medio: 'Ensino Médio',
  eja: 'EJA',
  todos: 'Todos os Segmentos',
};

// Generate year options from 2024 to current year
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 2023 }, (_, i) => 2024 + i);

const monthOptions = [
  { value: '0', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const RATING_FIELD_TYPES = ['rating', 'scale'];
const EVOLUCAO_FORM_TYPES = ['observacao_aula', 'registro_apoio_presencial'] as const;
type EvolucaoFormType = typeof EVOLUCAO_FORM_TYPES[number];

interface EvolucaoConfig {
  formType: EvolucaoFormType;
  title: string;
  chartTitle: string;
  matrixTitle: string;
  observationsTitle: string;
  itemLabel: string;
  includeZeroValues: boolean;
}

const EVOLUCAO_CONFIGS: Record<EvolucaoFormType, EvolucaoConfig> = {
  observacao_aula: {
    formType: 'observacao_aula',
    title: 'Histórico — Observação de Aula',
    chartTitle: 'Evolução por Visita — Observação de Aula',
    matrixTitle: 'Evolução por Dimensão — Observação de Aula',
    observationsTitle: 'Observações — Observação de Aula',
    itemLabel: 'Visita',
    includeZeroValues: false,
  },
  registro_apoio_presencial: {
    formType: 'registro_apoio_presencial',
    title: 'Histórico — Registro de Apoio Presencial',
    chartTitle: 'Evolução por Registro — Apoio Presencial',
    matrixTitle: 'Evolução por Dimensão — Apoio Presencial',
    observationsTitle: 'Observações — Apoio Presencial',
    itemLabel: 'Registro',
    includeZeroValues: true,
  },
};

export default function EvolucaoProfessorPage() {
  const { isAdmin, isGestor, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  // Filters
  const [selectedEscolaId, setSelectedEscolaId] = useState<string>('');
  const [selectedProfessorId, setSelectedProfessorId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>('0');
  
  // Data
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [avaliacoesByType, setAvaliacoesByType] = useState<Record<EvolucaoFormType, DynamicAvaliacao[]>>({
    observacao_aula: [],
    registro_apoio_presencial: [],
  });
  const [instrumentFieldsByType, setInstrumentFieldsByType] = useState<Record<EvolucaoFormType, InstrumentField[]>>({
    observacao_aula: [],
    registro_apoio_presencial: [],
  });
  
  // Selected data for display
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);

  const instrumentMetaByType = useMemo(() => {
    return EVOLUCAO_FORM_TYPES.reduce((acc, formType) => {
      const fields = instrumentFieldsByType[formType];
      const ratingFields = fields.filter(f => RATING_FIELD_TYPES.includes(f.field_type)).sort((a, b) => a.sort_order - b.sort_order);
      const dimensoesKeys = ratingFields.map(f => f.field_key);
      const requiredKeys = new Set(ratingFields.filter(f => f.is_required).map(f => f.field_key));
      const dimensoesLabels: Record<string, string> = {};
      ratingFields.forEach(f => { dimensoesLabels[f.field_key] = f.label; });
      acc[formType] = { fields, ratingFields, dimensoesKeys, requiredKeys, dimensoesLabels };
      return acc;
    }, {} as Record<EvolucaoFormType, { fields: InstrumentField[]; ratingFields: InstrumentField[]; dimensoesKeys: string[]; requiredKeys: Set<string>; dimensoesLabels: Record<string, string> }>);
  }, [instrumentFieldsByType]);

  // Group colors: H, S%, L% base (lightness will be varied for individual items)
  const GROUP_COLORS: Record<string, string> = {
    'Conhecimento pedagógico do conteúdo': '217, 80%, 55%',
    'Prática de ensino': '38, 92%, 50%',
    'Engajamento e verificação': '142, 65%, 45%',
    'Clima e gestão do tempo': '280, 60%, 55%',
  };
  const DEFAULT_GROUP_COLOR = '200, 60%, 50%';

  const dimensionGroups = useMemo<DimensionGroup[]>(() => {
    const groupMap = new Map<string, string[]>();
    ratingFields.forEach(f => {
      const dim = f.dimension || 'Outros';
      if (!groupMap.has(dim)) groupMap.set(dim, []);
      groupMap.get(dim)!.push(f.field_key);
    });
    return Array.from(groupMap.entries()).map(([name, keys]) => ({
      name,
      keys,
      color: GROUP_COLORS[name] || DEFAULT_GROUP_COLOR,
    }));
  }, [ratingFields]);

  const textFieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    instrumentFields
      .filter(f => !RATING_FIELD_TYPES.includes(f.field_type) && !['number', 'select_one'].includes(f.field_type))
      .forEach(f => { labels[f.field_key] = f.label; });
    return labels;
  }, [instrumentFields]);

  const scaleMax = useMemo(() => {
    if (ratingFields.length === 0) return 4;
    return Math.max(...ratingFields.map(f => f.scale_max ?? 4));
  }, [ratingFields]);

  // Filter avaliacoes by period
  const filteredAvaliacoes = useMemo(() => {
    return avaliacoes.filter(avaliacao => {
      const date = new Date(avaliacao.data);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      if (String(year) !== selectedYear) return false;
      if (selectedMonth !== '0' && month !== parseInt(selectedMonth)) return false;
      return true;
    });
  }, [avaliacoes, selectedYear, selectedMonth]);

  // Fetch escolas + instrument fields on mount
  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const [escolasRes, fieldsRes] = await Promise.all([
          supabase.from('escolas').select('id, nome').eq('ativa', true).order('nome'),
          (supabase as any).from('instrument_fields').select('*').eq('form_type', 'observacao_aula').order('sort_order', { ascending: true }),
        ]);
        setEscolas(escolasRes.data || []);
        setInstrumentFields((fieldsRes.data || []) as InstrumentField[]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // Fetch professores when escola is selected
  useEffect(() => {
    const fetchProfessores = async () => {
      if (!selectedEscolaId) {
        setProfessores([]);
        setSelectedProfessorId('');
        return;
      }
      
      try {
        const { data: professoresData } = await supabase
          .from('professores')
          .select('id, nome, componente, ano_serie, segmento')
          .eq('escola_id', selectedEscolaId)
          .eq('ativo', true)
          .order('nome');
        setProfessores(professoresData || []);
        
        const escola = escolas.find(e => e.id === selectedEscolaId);
        setSelectedEscola(escola || null);
      } catch (error) {
        console.error('Error fetching professores:', error);
      }
      
      setSelectedProfessorId('');
      setAvaliacoes([]);
    };
    
    fetchProfessores();
  }, [selectedEscolaId, escolas]);

  // Fetch instrument_responses when professor is selected
  useEffect(() => {
    const fetchAvaliacoes = async () => {
      if (!selectedEscolaId || !selectedProfessorId) {
        setAvaliacoes([]);
        setSelectedProfessor(null);
        return;
      }
      
      try {
        const { data: responsesData, error } = await (supabase as any)
          .from('instrument_responses')
          .select('id, responses, registro_acao_id')
          .eq('escola_id', selectedEscolaId)
          .eq('professor_id', selectedProfessorId)
          .eq('form_type', 'observacao_aula');
        
        if (error) throw error;
        
        if (responsesData && responsesData.length > 0) {
          const registroIds = responsesData.map((r: any) => r.registro_acao_id);
          const { data: registrosData } = await supabase
            .from('registros_acao')
            .select('id, data')
            .in('id', registroIds);
          
          const registrosMap = new Map(registrosData?.map(r => [r.id, r]) || []);
          
          const dynamicAvaliacoes: DynamicAvaliacao[] = responsesData
            .map((r: any) => {
              const registro = registrosMap.get(r.registro_acao_id);
              const responses = r.responses as Record<string, any> || {};
              
              // Separate rating vs text fields
              const ratings: Record<string, number> = {};
              const textFields: Record<string, string> = {};
              
              const ratingKeySet = new Set(ratingFields.map(f => f.field_key));
              
              for (const [key, value] of Object.entries(responses)) {
                if (ratingKeySet.has(key) && typeof value === 'number') {
                  ratings[key] = value;
                } else if (typeof value === 'string') {
                  textFields[key] = value;
                }
              }
              
              return {
                id: r.id,
                data: registro?.data || '',
                ratings,
                textFields,
              };
            })
            .filter((a: DynamicAvaliacao) => a.data && Object.keys(a.ratings).length > 0)
            .sort((a: DynamicAvaliacao, b: DynamicAvaliacao) => new Date(a.data).getTime() - new Date(b.data).getTime());
          
          setAvaliacoes(dynamicAvaliacoes);
        } else {
          setAvaliacoes([]);
        }
        
        const professor = professores.find(p => p.id === selectedProfessorId);
        setSelectedProfessor(professor || null);
      } catch (error) {
        console.error('Error fetching avaliacoes:', error);
        toast.error('Erro ao carregar avaliações');
      }
    };
    
    fetchAvaliacoes();
  }, [selectedEscolaId, selectedProfessorId, professores, ratingFields]);

  const handleExportPdf = async () => {
    if (!selectedProfessor || filteredAvaliacoes.length === 0) {
      toast.error('Selecione um professor com avaliações para exportar');
      return;
    }
    
    setIsExportingPdf(true);
    toast.info('Gerando PDF...');
    
    try {
      const pdfProps: EvolucaoPdfContentProps = {
        professor: selectedProfessor,
        escola: selectedEscola,
        avaliacoes: filteredAvaliacoes,
        dimensoesLabels,
        dimensoesKeys,
        componenteLabels,
        segmentoLabels,
        textFieldLabels,
        scaleMax,
      };

      const sections = [
        { Component: EvolucaoPdfSection1, label: 'Evolução por Visita' },
        { Component: EvolucaoPdfSection2, label: 'Matriz de Evolução' },
        { Component: EvolucaoPdfSection3, label: 'Observações' },
      ];

      const a4Width = 210;
      const a4Height = 297;
      const margin = 8;
      const headerHeight = 20;
      const contentWidth = a4Width - (margin * 2);
      const contentStartY = headerHeight + 4;
      const availableHeight = a4Height - contentStartY - margin;

      // Pre-load logo
      let logoImg: HTMLImageElement | null = null;
      let bussolaImg: HTMLImageElement | null = null;
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
      } catch { logoImg = null; }
      try {
        bussolaImg = new Image();
        bussolaImg.crossOrigin = 'anonymous';
        const bussolaModule = await import('@/assets/logo-bussola-branco.png');
        bussolaImg.src = bussolaModule.default;
        await new Promise((resolve, reject) => {
          bussolaImg!.onload = resolve;
          bussolaImg!.onerror = reject;
          setTimeout(reject, 3000);
        });
      } catch { bussolaImg = null; }

      const periodLabel = selectedMonth !== '0' 
        ? `${monthOptions.find(m => m.value === selectedMonth)?.label}/${selectedYear}`
        : selectedYear;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const addHeader = (isFirst: boolean) => {
        pdf.setFillColor(26, 58, 92); // #1a3a5c
        pdf.rect(0, 0, a4Width, headerHeight, 'F');
        
        if (logoImg) {
          const originalRatio = logoImg.naturalWidth / logoImg.naturalHeight;
          const logoH = 8;
          const logoW = logoH * originalRatio;
          pdf.addImage(logoImg, 'PNG', margin, (headerHeight - logoH) / 2, logoW, logoH);
        }
        
        let logosEndX = margin;
        if (logoImg) {
          logosEndX += 8 * (logoImg.naturalWidth / logoImg.naturalHeight);
        }
        if (bussolaImg) {
          const bRatio = bussolaImg.naturalWidth / bussolaImg.naturalHeight;
          const bH = 8;
          const bW = bH * bRatio;
          pdf.addImage(bussolaImg, 'PNG', logosEndX + 3, (headerHeight - bH) / 2, bW, bH);
          logosEndX += 3 + bW;
        }

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        const titleX = logosEndX + 4;
        pdf.text('Evolução do Professor', titleX, 8);
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${selectedProfessor!.nome} | ${selectedEscola?.nome || ''} | ${periodLabel}`, titleX, 13);
        
        const dateStr = new Date().toLocaleDateString('pt-BR');
        pdf.text(`Gerado em ${dateStr}`, a4Width - margin - pdf.getTextWidth(`Gerado em ${dateStr}`), 13);
      };

      let isFirstPage = true;

      for (const { Component } of sections) {
        // Create offscreen container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '1000px';
        container.style.backgroundColor = '#ffffff';
        document.body.appendChild(container);

        const root = createRoot(container);
        root.render(<Component {...pdfProps} />);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if section rendered anything
        if (container.offsetHeight < 10) {
          root.unmount();
          document.body.removeChild(container);
          continue;
        }

        const canvas = await html2canvas(container, {
          scale: 1.5, // Lower scale for smaller file size
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 1000,
          windowWidth: 1000,
        });

        root.unmount();
        document.body.removeChild(container);

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const scaleFactor = contentWidth / (imgWidth / 1.5);
        const sourceSliceHeight = (availableHeight / scaleFactor) * 1.5;

        let sourceY = 0;
        while (sourceY < imgHeight) {
          if (!isFirstPage) {
            pdf.addPage();
          }
          addHeader(isFirstPage);
          isFirstPage = false;

          const sliceCanvas = document.createElement('canvas');
          const ctx = sliceCanvas.getContext('2d');
          const actualSliceHeight = Math.min(sourceSliceHeight, imgHeight - sourceY);
          sliceCanvas.width = imgWidth;
          sliceCanvas.height = actualSliceHeight;
          
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, imgWidth, actualSliceHeight, 0, 0, imgWidth, actualSliceHeight);
            const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.85);
            const sliceScaledHeight = (actualSliceHeight / 1.5) * scaleFactor;
            pdf.addImage(sliceImgData, 'JPEG', margin, contentStartY, contentWidth, sliceScaledHeight);
          }
          
          sourceY += sourceSliceHeight;
        }
      }
      
      pdf.save(`evolucao_professor_${selectedProfessor.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between" data-tour="evo-header">
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap" data-tour="evo-filters">
          {/* Entidade Filter */}
          <div className="space-y-2 min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground">Entidade</label>
            <Select value={selectedEscolaId} onValueChange={setSelectedEscolaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a entidade" />
              </SelectTrigger>
              <SelectContent>
                {escolas.map(escola => (
                  <SelectItem key={escola.id} value={escola.id}>{escola.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Professor Filter */}
          <div className="space-y-2 min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground">Professor</label>
            <Select 
              value={selectedProfessorId} 
              onValueChange={setSelectedProfessorId}
              disabled={!selectedEscolaId || professores.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={!selectedEscolaId ? "Selecione a entidade primeiro" : "Selecione o professor"} />
              </SelectTrigger>
              <SelectContent>
                {professores.map(professor => (
                  <SelectItem key={professor.id} value={professor.id}>
                    {professor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Year Filter */}
          <div className="space-y-2 min-w-[120px]">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Ano
            </label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Month Filter */}
          <div className="space-y-2 min-w-[150px]">
            <label className="text-sm font-medium text-muted-foreground">Mês</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Export Button */}
        <Button
          onClick={handleExportPdf}
          disabled={isExportingPdf || !selectedProfessor || filteredAvaliacoes.length === 0}
          className="flex items-center gap-2"
          data-tour="evo-export-btn"
        >
          {isExportingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Exportar PDF
        </Button>
      </div>

      {/* Content Area */}
      {!selectedProfessorId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Eye className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Selecione Entidade e Professor
            </h3>
            <p className="text-sm text-muted-foreground/70 max-w-md">
              Utilize os filtros acima para visualizar o histórico de evolução do professor nas observações de aula.
            </p>
          </CardContent>
        </Card>
      ) : filteredAvaliacoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Sem dados para os filtros selecionados
            </h3>
            <p className="text-sm text-muted-foreground/70 max-w-md">
              Não foram encontradas observações de aula para este professor no período selecionado ({selectedMonth !== '0' ? monthOptions.find(m => m.value === selectedMonth)?.label + '/' : ''}{selectedYear}).
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Professor Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Eye className="w-5 h-5 text-warning" />
                Histórico — Observação de Aula
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Professor:</span>{' '}
                  <span className="font-medium">{selectedProfessor?.nome}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Entidade:</span>{' '}
                  <span className="font-medium">{selectedEscola?.nome}</span>
                </div>
                {selectedProfessor?.segmento && (
                  <div>
                    <span className="text-muted-foreground">Segmento:</span>{' '}
                    <span className="font-medium">{segmentoLabels[selectedProfessor.segmento] || selectedProfessor.segmento}</span>
                  </div>
                )}
                {selectedProfessor?.componente && (
                  <div>
                    <span className="text-muted-foreground">Componente:</span>{' '}
                    <span className="font-medium">{componenteLabels[selectedProfessor.componente] || selectedProfessor.componente}</span>
                  </div>
                )}
                {selectedProfessor?.ano_serie && (
                  <div>
                    <span className="text-muted-foreground">Ano/Série:</span>{' '}
                    <span className="font-medium">{selectedProfessor.ano_serie}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Evolution Line Chart */}
          <div data-tour="evo-chart">
            <EvolucaoLineChart
              avaliacoes={filteredAvaliacoes}
              dimensoesLabels={dimensoesLabels}
              dimensoesKeys={dimensoesKeys}
              scaleMax={scaleMax}
              groups={dimensionGroups}
              requiredKeys={requiredKeys}
            />
          </div>

          {/* Evolution Matrix */}
          <div data-tour="evo-matrix">
            <EvolucaoMatrix 
              avaliacoes={filteredAvaliacoes}
              dimensoesLabels={dimensoesLabels}
              dimensoesKeys={dimensoesKeys}
              scaleMax={scaleMax}
              requiredKeys={requiredKeys}
            />
          </div>

          {/* Observations Section */}
          <div data-tour="evo-observacoes">
            <EvolucaoObservacoes 
              avaliacoes={filteredAvaliacoes}
              textFieldLabels={textFieldLabels}
            />
          </div>
        </>
      )}
    </div>
  );
}
