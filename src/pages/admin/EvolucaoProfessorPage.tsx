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
import { EvolucaoPdfContent } from '@/components/evolucao/EvolucaoPdfContent';
import { EvolucaoLineChart } from '@/components/evolucao/EvolucaoLineChart';

interface AAP {
  id: string;
  nome: string;
}

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

interface RegistroAvaliacaoAula {
  id: string;
  data: string;
  aap_nome: string;
  clareza_objetivos: number;
  dominio_conteudo: number;
  estrategias_didaticas: number;
  engajamento_turma: number;
  gestao_tempo: number;
  observacoes: string | null;
}

const dimensoesLabels: Record<string, string> = {
  clareza_objetivos: 'Clareza dos Objetivos',
  dominio_conteudo: 'Domínio do Conteúdo',
  estrategias_didaticas: 'Estratégias Didáticas',
  engajamento_turma: 'Engajamento da Turma',
  gestao_tempo: 'Gestão do Tempo',
};

const componenteLabels: Record<string, string> = {
  matematica: 'Matemática',
  portugues: 'Língua Portuguesa',
  alfabetizacao: 'Alfabetização',
};

const segmentoLabels: Record<string, string> = {
  anos_iniciais: 'Anos Iniciais',
  anos_finais: 'Anos Finais',
  eja: 'EJA',
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

export default function EvolucaoProfessorPage() {
  const { isAdmin, isGestor, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  // Filters
  const [selectedAapId] = useState<string>('');
  const [selectedEscolaId, setSelectedEscolaId] = useState<string>('');
  const [selectedProfessorId, setSelectedProfessorId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>('0'); // 0 = all months
  
  // Data
  const [aaps] = useState<AAP[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<RegistroAvaliacaoAula[]>([]);
  
  // Selected data for display
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);
  const [selectedAap] = useState<AAP | null>(null);

  // Filter avaliacoes by period
  const filteredAvaliacoes = useMemo(() => {
    return avaliacoes.filter(avaliacao => {
      const date = new Date(avaliacao.data);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() is 0-indexed
      
      if (String(year) !== selectedYear) return false;
      if (selectedMonth !== '0' && month !== parseInt(selectedMonth)) return false;
      
      return true;
    });
  }, [avaliacoes, selectedYear, selectedMonth]);

  // Fetch escolas on mount
  useEffect(() => {
    const fetchEscolas = async () => {
      setIsLoading(true);
      try {
        const { data: escolasData } = await supabase
          .from('escolas')
          .select('id, nome')
          .eq('ativa', true)
          .order('nome');
        setEscolas(escolasData || []);
      } catch (error) {
        console.error('Error fetching escolas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEscolas();
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

  // Fetch avaliacoes when professor is selected
  useEffect(() => {
    const fetchAvaliacoes = async () => {
      if (!selectedEscolaId || !selectedProfessorId) {
        setAvaliacoes([]);
        setSelectedProfessor(null);
        return;
      }
      
      try {
        const { data: avaliacoesData, error } = await supabase
          .from('avaliacoes_aula')
          .select(`
            id,
            clareza_objetivos,
            dominio_conteudo,
            estrategias_didaticas,
            engajamento_turma,
            gestao_tempo,
            observacoes,
            registro_acao_id
          `)
          .eq('escola_id', selectedEscolaId)
          .eq('professor_id', selectedProfessorId);
        
        if (error) throw error;
        
        if (avaliacoesData && avaliacoesData.length > 0) {
          const registroIds = avaliacoesData.map(a => a.registro_acao_id);
          const { data: registrosData } = await supabase
            .from('registros_acao')
            .select('id, data')
            .in('id', registroIds);
          
          const registrosMap = new Map(registrosData?.map(r => [r.id, r]) || []);
          
          const avaliacoesWithDates: RegistroAvaliacaoAula[] = avaliacoesData
            .map(a => {
              const registro = registrosMap.get(a.registro_acao_id);
              return {
                id: a.id,
                data: registro?.data || '',
                aap_nome: '',
                clareza_objetivos: a.clareza_objetivos,
                dominio_conteudo: a.dominio_conteudo,
                estrategias_didaticas: a.estrategias_didaticas,
                engajamento_turma: a.engajamento_turma,
                gestao_tempo: a.gestao_tempo,
                observacoes: a.observacoes,
              };
            })
            .filter(a => a.data)
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
          
          setAvaliacoes(avaliacoesWithDates);
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
  }, [selectedEscolaId, selectedProfessorId, professores]);

  const handleExportPdf = async () => {
    if (!selectedProfessor || filteredAvaliacoes.length === 0) {
      toast.error('Selecione um professor com avaliações para exportar');
      return;
    }
    
    setIsExportingPdf(true);
    toast.info('Gerando PDF...');
    
    try {
      // Create an offscreen container for PDF rendering
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.top = '0';
      pdfContainer.style.width = '1000px';
      pdfContainer.style.minWidth = '1000px';
      pdfContainer.style.backgroundColor = '#ffffff';
      document.body.appendChild(pdfContainer);
      
      // Render the PDF-specific component
      const root = createRoot(pdfContainer);
      root.render(
        <EvolucaoPdfContent
          professor={selectedProfessor}
          escola={selectedEscola}
          aap={selectedAap}
          avaliacoes={filteredAvaliacoes}
          dimensoesLabels={dimensoesLabels}
          componenteLabels={componenteLabels}
          segmentoLabels={segmentoLabels}
        />
      );
      
      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      const margin = 10;
      const headerHeight = 25;
      const contentWidth = a4Width - (margin * 2);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Add header with blue background
      pdf.setFillColor(0, 56, 117);
      pdf.rect(0, 0, a4Width, headerHeight, 'F');
      
      // Load and add logo
      const logoHeight = 10;
      const logoWidth = 25;
      const logoX = margin;
      const logoY = 3;
      
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        const logoModule = await import('@/assets/pe-logo-branco.png');
        logoImg.src = logoModule.default;
        
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          setTimeout(reject, 3000);
        });
        
        pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
      }
      
      // Add title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Histórico — Acompanhamento de Aula', logoX + logoWidth + 5, logoY + 5);
      
      // Add subtitle with period info
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const periodLabel = selectedMonth !== '0' 
        ? `${monthOptions.find(m => m.value === selectedMonth)?.label}/${selectedYear}`
        : selectedYear;
      const dateRange = filteredAvaliacoes.length > 0 
        ? `${new Date(filteredAvaliacoes[0].data).toLocaleDateString('pt-BR')} a ${new Date(filteredAvaliacoes[filteredAvaliacoes.length - 1].data).toLocaleDateString('pt-BR')}`
        : '';
      pdf.text(`Professor: ${selectedProfessor.nome} | Período: ${periodLabel} | ${dateRange}`, logoX + logoWidth + 5, logoY + 10);
      
      // Capture the offscreen container
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1000,
        windowWidth: 1000,
      });
      
      // Cleanup
      root.unmount();
      document.body.removeChild(pdfContainer);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate content dimensions
      const contentStartY = headerHeight + margin;
      const availableHeight = a4Height - contentStartY - margin;
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const scale = contentWidth / (imgWidth / 2);
      const scaledHeight = (imgHeight / 2) * scale;
      
      // Add content image with pagination
      let sourceY = 0;
      let pageNumber = 1;
      const sourceSliceHeight = (availableHeight / scale) * 2;
      
      while (sourceY < imgHeight) {
        if (pageNumber > 1) {
          pdf.addPage();
          
          // Add header on new page
          pdf.setFillColor(0, 56, 117);
          pdf.rect(0, 0, a4Width, headerHeight, 'F');
          
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Histórico — Acompanhamento de Aula (continuação)', margin, 15);
        }
        
        // Create a temporary canvas for this slice
        const sliceCanvas = document.createElement('canvas');
        const ctx = sliceCanvas.getContext('2d');
        const actualSliceHeight = Math.min(sourceSliceHeight, imgHeight - sourceY);
        sliceCanvas.width = imgWidth;
        sliceCanvas.height = actualSliceHeight;
        
        if (ctx) {
          ctx.drawImage(canvas, 0, sourceY, imgWidth, actualSliceHeight, 0, 0, imgWidth, actualSliceHeight);
          const sliceImgData = sliceCanvas.toDataURL('image/png');
          
          const sliceScaledHeight = (actualSliceHeight / 2) * scale;
          pdf.addImage(sliceImgData, 'PNG', margin, contentStartY, contentWidth, sliceScaledHeight);
        }
        
        sourceY += sourceSliceHeight;
        pageNumber++;
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
              Utilize os filtros acima para visualizar o histórico de evolução do professor nos acompanhamentos de aula.
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
              Não foram encontradas avaliações de acompanhamento para este professor no período selecionado ({selectedMonth !== '0' ? monthOptions.find(m => m.value === selectedMonth)?.label + '/' : ''}{selectedYear}).
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
                Histórico — Acompanhamento de Aula
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Professor:</span>{' '}
                  <span className="font-medium">{selectedProfessor?.nome}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Escola:</span>{' '}
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
            />
          </div>

          {/* Evolution Matrix */}
          <div data-tour="evo-matrix">
            <EvolucaoMatrix 
              avaliacoes={filteredAvaliacoes}
              dimensoesLabels={dimensoesLabels}
            />
          </div>

          {/* Observations Section */}
          <div data-tour="evo-observacoes">
            <EvolucaoObservacoes avaliacoes={filteredAvaliacoes} />
          </div>
        </>
      )}
    </div>
  );
}
