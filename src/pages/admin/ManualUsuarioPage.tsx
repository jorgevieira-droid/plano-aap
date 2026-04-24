import { useRef, useState } from 'react';
import { 
  LogIn, LayoutDashboard, Calendar, FileText, ClipboardList, School, Users, 
  UserCheck, TrendingUp, BarChart3, Printer, History, UserCog, AlertTriangle, 
  User, BookOpen, Download, Loader2, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ManualSection {
  icon: typeof LogIn;
  title: string;
  description: string;
  tips?: string[];
}

const sections: ManualSection[] = [
  {
    icon: LogIn,
    title: '1. Login e Autenticação',
    description: 'Na tela de login, insira seu e-mail e senha fornecidos pelo administrador. Caso seja seu primeiro acesso, será solicitada a troca de senha obrigatória. A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.',
    tips: ['Se esquecer a senha, entre em contato com o administrador do sistema.', 'Após 3 tentativas incorretas, aguarde alguns minutos antes de tentar novamente.'],
  },
  {
    icon: LayoutDashboard,
    title: '2. Dashboard (Painel Principal)',
    description: 'O Dashboard é a tela inicial após o login. Ele apresenta indicadores gerais como total de ações realizadas, programações pendentes, escolas atendidas e gráficos de acompanhamento. Os dados são filtrados automaticamente conforme seu perfil de acesso (programa e entidades vinculadas).',
    tips: ['Utilize os filtros de período para analisar dados de meses específicos.', 'Clique nos cards de indicadores para navegar diretamente ao módulo relacionado.'],
  },
  {
    icon: Calendar,
    title: '3. Programação (Calendário de Ações)',
    description: 'Neste módulo você visualiza e gerencia as ações pedagógicas programadas. O calendário mostra as ações por data, escola, componente curricular e segmento. É possível criar novas programações, editar existentes e acompanhar o status de cada uma (agendada, realizada, cancelada).',
    tips: ['Use os filtros de escola, segmento e componente para localizar programações específicas.', 'Programações podem ser importadas em lote via planilha Excel.'],
  },
  {
    icon: FileText,
    title: '4. Registrar Ação (Formulário)',
    description: 'O formulário de registro de ação permite documentar as atividades realizadas nas escolas. Preencha os campos obrigatórios: escola, data, tipo de ação, segmento, componente e ano/série. Campos adicionais como observações, avanços e dificuldades enriquecem o registro. Instrumentos de acompanhamento (rubricas) podem ser preenchidos junto ao registro.',
    tips: ['Salve o registro ao final — não há salvamento automático.', 'Campos marcados com asterisco (*) são obrigatórios.', 'O instrumento de avaliação pode incluir escalas de 1 a 4 com descritores detalhados.'],
  },
  {
    icon: ClipboardList,
    title: '5. Registros (Histórico de Ações)',
    description: 'A tabela de registros exibe todas as ações cadastradas com filtros por escola, período, tipo de ação, status e AAP responsável. É possível visualizar detalhes de cada registro, editar informações e acompanhar o status (realizado, pendente, cancelado). A tabela suporta ordenação e paginação.',
    tips: ['Exporte os registros filtrados para análise externa.', 'Clique em um registro para ver todos os detalhes e instrumentos vinculados.'],
  },
  {
    icon: School,
    title: '6. Escolas / Regional / Rede',
    description: 'Gerencie o cadastro de escolas, regionais de ensino e redes municipais. Cada escola possui nome, código INEP, CODESC, endereço e programas vinculados. É possível ativar/desativar escolas e importar cadastros em lote via planilha.',
    tips: ['Escolas desativadas não aparecem nos filtros de programação e registro.', 'O código INEP é único e serve para identificação oficial.'],
  },
  {
    icon: Users,
    title: '7. Atores Educacionais',
    description: 'Cadastre e gerencie professores e coordenadores pedagógicos vinculados às escolas. Os campos incluem nome, cargo, componente curricular, segmento, ano/série, e-mail e telefone. Professores podem ser filtrados por escola, segmento e componente.',
    tips: ['Professores desativados mantêm histórico mas não aparecem em novos registros.', 'A importação em lote facilita o cadastro de muitos professores de uma vez.'],
  },
  {
    icon: UserCheck,
    title: '8. Consultores / Gestores / Formadores',
    description: 'Gerencie os Consultores, Gestores e Formadores do sistema. Cada um possui escolas e programas vinculados que determinam seu escopo de atuação. O cadastro inclui criação de credenciais de acesso ao sistema.',
    tips: ['Consultores/Gestores/Formadores só visualizam dados das escolas e programas a que estão vinculados.', 'O perfil de acesso determina quais módulos estarão disponíveis.'],
  },
  {
    icon: TrendingUp,
    title: '9. Evolução do Professor',
    description: 'Acompanhe a evolução dos professores ao longo do tempo com gráficos de linha e matrizes comparativas. Os dados são extraídos dos instrumentos de avaliação preenchidos nos registros de ação. Filtre por escola, professor, período e dimensão do instrumento.',
    tips: ['Compare a evolução de diferentes dimensões para identificar padrões.', 'Exporte o relatório de evolução em PDF para compartilhar com a equipe.'],
  },
  {
    icon: BarChart3,
    title: '10. Relatórios',
    description: 'Gere relatórios consolidados com dados de programações, registros e instrumentos. Os relatórios podem ser filtrados por programa, escola, período e tipo de ação. Inclui gráficos de distribuição e tabelas resumo. Exportação disponível em PDF.',
    tips: ['Utilize filtros combinados para análises mais específicas.', 'Relatórios são atualizados em tempo real conforme novos registros são inseridos.'],
  },
  {
    icon: Printer,
    title: '11. Lista de Presença',
    description: 'Gere e imprima listas de presença para formações e encontros. Selecione a escola, data e tipo de ação para gerar a lista com os professores vinculados. A lista pode ser impressa diretamente do navegador em formato otimizado para A4.',
    tips: ['Marque a presença dos participantes diretamente na tela antes de imprimir.', 'O layout de impressão é otimizado para papel A4 com cabeçalho institucional.'],
  },
  {
    icon: History,
    title: '12. Histórico de Presença',
    description: 'Consulte o histórico completo de presenças por professor, escola e período. Visualize percentuais de frequência e identifique padrões de ausência. Os dados são consolidados a partir dos registros de presença das ações realizadas.',
    tips: ['Filtre por período para analisar frequência em intervalos específicos.', 'O percentual de presença é calculado automaticamente.'],
  },
  {
    icon: UserCog,
    title: '13. Gestão de Usuários',
    description: 'Módulo exclusivo para administradores. Cadastre novos usuários, atribua papéis (N1 a N8), vincule programas e entidades. Cada papel possui permissões específicas que determinam o acesso aos módulos do sistema. É possível redefinir senhas e desativar contas.',
    tips: ['Consulte a tabela de papéis para entender as permissões de cada nível.', 'Usuários podem ser cadastrados em lote via upload de planilha.'],
  },
  {
    icon: AlertTriangle,
    title: '14. Pendências',
    description: 'Visualize ações pendentes que requerem atenção, como programações sem registro realizado, registros incompletos e instrumentos não preenchidos. As pendências são calculadas automaticamente e podem ser filtradas por escola e período.',
    tips: ['Resolva as pendências atualizando o status ou completando os registros correspondentes.'],
  },
  {
    icon: User,
    title: '15. Perfil do Usuário',
    description: 'Acesse e edite suas informações pessoais como nome, telefone e senha. O perfil exibe seu papel no sistema, programas e entidades vinculadas. A alteração de senha exige a senha atual e deve atender aos requisitos de segurança.',
    tips: ['Mantenha seus dados atualizados para facilitar a comunicação.', 'Troque sua senha periodicamente para maior segurança.'],
  },
];

export default function ManualUsuarioPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    if (!contentRef.current) return;
    setExporting(true);

    try {
      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const MARGIN_MM = 10;
      const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;
      const SECTION_GAP_MM = 3;
      const SCALE = 1.5;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Capture header once
      const headerEl = contentRef.current.querySelector('[data-pdf-header]') as HTMLElement;
      let headerCanvas: HTMLCanvasElement | null = null;
      let headerHeightMM = 0;
      if (headerEl) {
        headerCanvas = await html2canvas(headerEl, { scale: SCALE, useCORS: true, backgroundColor: '#ffffff', logging: false });
        const scaleFactor = CONTENT_WIDTH_MM / (headerCanvas.width / SCALE);
        headerHeightMM = (headerCanvas.height / SCALE) * scaleFactor;
      }

      // Capture each section
      const sectionEls = Array.from(contentRef.current.querySelectorAll('[data-pdf-section]')) as HTMLElement[];
      const sectionCanvases: { canvas: HTMLCanvasElement; heightMM: number }[] = [];
      for (const el of sectionEls) {
        const canvas = await html2canvas(el, { scale: SCALE, useCORS: true, backgroundColor: '#ffffff', logging: false });
        const scaleFactor = CONTENT_WIDTH_MM / (canvas.width / SCALE);
        const heightMM = (canvas.height / SCALE) * scaleFactor;
        sectionCanvases.push({ canvas, heightMM });
      }

      const addHeader = (currentPdf: jsPDF) => {
        if (headerCanvas) {
          const imgData = headerCanvas.toDataURL('image/jpeg', 0.85);
          currentPdf.addImage(imgData, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, headerHeightMM);
        }
      };

      const startNewPage = () => {
        pdf.addPage();
        addHeader(pdf);
        return MARGIN_MM + headerHeightMM + SECTION_GAP_MM;
      };

      let currentY = MARGIN_MM + headerHeightMM + SECTION_GAP_MM;
      addHeader(pdf);

      for (const { canvas, heightMM } of sectionCanvases) {
        const availableHeight = A4_HEIGHT_MM - MARGIN_MM;
        const remainingSpace = availableHeight - currentY;

        // If section doesn't fit on current page, start a new one
        if (heightMM > remainingSpace) {
          currentY = startNewPage();
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        pdf.addImage(imgData, 'JPEG', MARGIN_MM, currentY, CONTENT_WIDTH_MM, heightMM);
        currentY += heightMM + SECTION_GAP_MM;
      }

      pdf.save('Manual_do_Usuario_Olhar_Parceiro.pdf');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with export button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manual do Usuário</h1>
            <p className="text-sm text-muted-foreground">Guia completo de uso do sistema Olhar Parceiro</p>
          </div>
        </div>
        <Button onClick={handleExportPdf} disabled={exporting} className="gap-2">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>

      {/* Printable content */}
      <div ref={contentRef} style={{ backgroundColor: '#ffffff' }}>
        {/* PDF Header */}
        <div
          data-pdf-header
          style={{
            backgroundColor: '#1a3a5c',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
           <div className="flex items-center gap-4">
            <img src="/pe-logo-branco.png" alt="Parceiros da Educação" className="h-14 w-auto" />
            <img src="/logo-bussola-vertical-branco.png" alt="Olhar Parceiro" className="h-14 w-auto" />
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Manual do Usuário</h2>
              <p className="text-sm opacity-80" style={{ color: '#ffffffcc' }}>Olhar Parceiro — Plataforma de Acompanhamento Pedagógico</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sections.map((section, idx) => (
            <div
              key={idx}
              data-pdf-section
              style={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                backgroundColor: '#ffffff',
                breakInside: 'avoid',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: '#1a3a5c', borderRadius: '8px' }}
                >
                  <section.icon className="h-5 w-5" style={{ color: '#ffffff' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a5c' }}>
                    {section.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#4b5563', lineHeight: '1.7' }}>
                    {section.description}
                  </p>

                  {section.tips && section.tips.length > 0 && (
                    <div style={{ backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '12px', marginTop: '12px' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Lightbulb className="h-4 w-4" style={{ color: '#d97706' }} />
                        <span className="text-xs font-semibold" style={{ color: '#92400e' }}>Dicas</span>
                      </div>
                      <ul className="space-y-1">
                        {section.tips.map((tip, tipIdx) => (
                          <li key={tipIdx} className="text-xs" style={{ color: '#1e40af', lineHeight: '1.6' }}>
                            • {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center', paddingBottom: '16px' }}>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            Parceiros da Educação © {new Date().getFullYear()} — Manual gerado automaticamente pelo sistema
          </p>
        </div>
      </div>
    </div>
  );
}