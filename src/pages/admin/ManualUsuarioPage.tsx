import { useRef, useState } from 'react';
import {
  LogIn, LayoutDashboard, Calendar, FileText, ClipboardList, School, Users,
  UserCheck, TrendingUp, BarChart3, Printer, History, UserCog, AlertTriangle,
  User, BookOpen, Download, Loader2, Lightbulb, Building2, Eye, FileSpreadsheet,
  SlidersHorizontal, Link2, Sparkles, KeyRound, FileDown, Grid3X3, Filter,
  Bell, DollarSign,
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
    description: 'Na tela de login, insira o e-mail e a senha fornecidos pelo administrador. No primeiro acesso a troca de senha é obrigatória. A nova senha deve ter no mínimo 9 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais. Resets só podem ser feitos por um perfil hierarquicamente superior.',
    tips: ['Esqueceu a senha? Solicite o reset ao Coordenador (N3) ou Administrador.', 'Senhas temporárias devem ser trocadas no primeiro login.'],
  },
  {
    icon: LayoutDashboard,
    title: '2. Dashboard (Painel Principal)',
    description: 'Tela inicial após o login, com indicadores consolidados de programações, ações realizadas, presença, observações de aula e visitas técnicas. O escopo de dados é filtrado automaticamente pelo perfil e pelos programas vinculados ao usuário (N2/N3 veem apenas seus programas). Inclui o bloco unificado "Previsto x Realizado" e visões específicas de Monitoramento Regionais e Visita Alfabetização REDES.',
    tips: ['Admin pode simular outro perfil e programa pelo menu lateral para conferir a visão de outros usuários.', 'Médias pedagógicas excluem zeros (N/A), exceto no modelo REDES onde 0 significa "Não Implementado".'],
  },
  {
    icon: Calendar,
    title: '3. Programação (Calendário de Ações)',
    description: 'Visualize e gerencie todas as ações pedagógicas programadas. O calendário tem filtros avançados por Formador, Consultor e GPI, em ordem alfabética. Programações podem ser criadas com duplo clique no calendário e incluem campos opcionais como Projeto, Local e Público (Formação). Importação em lote por planilha Excel está disponível.',
    tips: ['Reagendar uma ação reinicia o prazo de 7 dias para registro.', 'Para uma única opção de programa no dropdown, ela é selecionada automaticamente.'],
  },
  {
    icon: FileText,
    title: '4. Registrar Ação (Formulário)',
    description: 'Documente atividades realizadas nas escolas. O sistema roteia automaticamente para o formulário correto a partir do tipo de ação (ver instrumentos pedagógicos abaixo). Campos obrigatórios e opcionais são configuráveis em "Configurar Formulário" por instrumento e perfil. As Entidades vinculadas são filtradas dinamicamente pelo Programa selecionado.',
    tips: ['Programação e Registros são fluxos independentes — agendar não cria automaticamente o registro.', 'Salve manualmente — não há salvamento automático.'],
  },
  {
    icon: ClipboardList,
    title: '5. Registros (Histórico de Ações)',
    description: 'Tabela com todas as ações cadastradas, com filtros por Escola, Período, Tipo, Status e Ator do Programa. Listas e dropdowns são sempre ordenados A-Z (português). Permite visualizar detalhes, editar e excluir registros conforme a permissão (N3-N5 atuam apenas em ações de sua autoria; N1/N2 têm gestão ampla).',
    tips: ['A coluna Status indica realizado, pendente ou cancelado.', 'Para tipos novos, o roteamento usa INSTRUMENT_TYPE_SET; tipos legados (REDES, monitoramentos) seguem fluxos dedicados.'],
  },
  {
    icon: School,
    title: '6. Escola / Regional / Rede (Entidades)',
    description: 'O conceito de "Entidade" unifica Escolas, Regionais de Ensino e Redes Municipais. Cada escola possui CODESC (6 dígitos), COD_INEP (8 dígitos), endereço, programas vinculados e a flag "ativa" para desativação sem perda de histórico. N1-N3 gerenciam; N4-N8 visualizam dentro de seus programas.',
    tips: ['Entidades desativadas mantêm histórico mas somem dos filtros de novos registros.', 'Importação em lote por Excel está disponível.'],
  },
  {
    icon: Building2,
    title: '7. Entidades Filho (Sub-entidades)',
    description: 'Cadastre sub-entidades para REDES (turmas de formação), Monitoramento e Regionais (escolas vinculadas a uma Regional). Servem para hierarquizar coletas de presença e instrumentos quando a entidade-pai é uma rede ou regional.',
    tips: ['Sub-entidades REDES alimentam a sincronização de "Turma de Formação".', 'Para Regionais, contextualizam a coleta por escola dentro do projeto (PEI, VOAR, PEC).'],
  },
  {
    icon: Users,
    title: '8. Atores Educacionais (/professores)',
    description: 'Cadastre professores e coordenadores pedagógicos vinculados às escolas, com nome, cargo, componente, segmento, ano/série, e-mail e telefone. Mapeamento PEC e importação em lote disponíveis. A elegibilidade para horas de formação é calculada apenas para professores ativos.',
    tips: ['Professores desativados mantêm histórico e somem de novos registros.', 'Atribuição automática de "Não se aplica" para perfis administrativos nas listas de presença.'],
  },
  {
    icon: Users,
    title: '9. Atores dos Programas (/atores)',
    description: 'Diretório dos atores do programa (hierarquia N1-N8): Administrador, Gestor, Coordenador, CPed (N4.1), GPI (N4.2), Formador (N5), Coordenador Pedagógico, Professor e Equipe Técnica SME. N4/N5 enxergam perfis dentro do mesmo programa, mesmo entre escolas diferentes.',
    tips: ['Use o termo "Ator do Programa" — substitui o antigo "AAP/Formador".', 'O GPI (N4.2) gerencia atribuições de CPed (N4.1) que compartilham programa.'],
  },
  {
    icon: UserCheck,
    title: '10. Consultor / Gestor / Formador',
    description: 'Gestão de credenciais e vínculos para Consultores, Gestores e Formadores. O escopo é determinado pelos programas e entidades atribuídos. Cada perfil possui Segmento e Componente próprios (regras específicas para Consultores, Gestores e Formadores).',
    tips: ['O perfil define quais módulos aparecem no menu lateral.', 'O menu lateral é filtrado dinamicamente pelos programas do usuário — itens dependentes de ações não habilitadas para o programa ficam ocultos.'],
  },
  {
    icon: ClipboardList,
    title: '11. Instrumentos Pedagógicos (visão geral)',
    description: 'A plataforma possui instrumentos especializados, mapeados a programas via Configurar Formulário. As escalas variam: 1-5 (padrão), 1-4 (Visita Alfabetização e Observação GPA), 0-3 (Apoio Presencial) e 0-2 (REDES e Microciclos, onde 0 = "Não Implementado"). Médias excluem o "0" (N/A) — exceto no modelo REDES.',
    tips: ['Cada instrumento define seus próprios campos via instrument_fields.', 'Perguntas obrigatórias são pré-selecionadas no instrumento de Observação.'],
  },
  {
    icon: Eye,
    title: '12. Observação de Aula (GPA)',
    description: 'Formulário dedicado com 9 critérios em escala 1-4, campos de evidências e encaminhamentos. Disponível para todos os 3 programas (Escolas, Regionais, Redes). Inclui legenda e card de score para leitura rápida do resultado.',
    tips: ['Use o formulário individual por professor observado.', 'Evidências e encaminhamentos são obrigatórios para fechar o instrumento.'],
  },
  {
    icon: Eye,
    title: '13. Visita Técnica — Alfabetização',
    description: 'Instrumento com 8 critérios em escala 1-4. A Q4 oferece a opção "Não se aplica à rede". Apresenta legenda e card de score consolidado. Disponível para os 3 programas.',
    tips: ['Para a variante REDES, alguns campos genéricos são ignorados (IAB/TaRL).', 'A versão Microciclos / TaRL segue a mesma mecânica de critérios, com campos específicos do projeto.'],
  },
  {
    icon: Sparkles,
    title: '14. Encontro de Microciclos de Recomposição',
    description: 'Ação independente para os 3 programas, com escala 0-2. Ao finalizar um encontro, o sistema agenda automaticamente o próximo encontro do ciclo.',
    tips: ['Diferente da "Formação", não gera lista de presença por escola.'],
  },
  {
    icon: ClipboardList,
    title: '15. Encontros REDES (ETEG e Professor) e Reunião de Acompanhamento da Alfabetização',
    description: 'Fluxos legados específicos para o programa REDES, com formulários dedicados (REDES Forms Config). A Reunião de Acompanhamento da Alfabetização possui 44 colunas próprias e instrumento detalhado.',
    tips: ['Encontros REDES sincronizam com a "Turma de Formação" via sub-entidades.', 'Para REDES, a escala 0-2 considera 0 como "Não Implementado" no cálculo de médias.'],
  },
  {
    icon: ClipboardList,
    title: '16. Monitoramento de Ações Formativas e Monitoramento de Gestão (Regionais)',
    description: 'Instrumentos do programa Regionais. Ocultam campos genéricos para focar em metas e indicadores específicos. Servem de base para o Relatório de Monitoramento Regionais.',
    tips: ['Disponíveis somente quando o programa Regionais está habilitado para o usuário.', 'Use o Rel. Regionais para visão consolidada.'],
  },
  {
    icon: ClipboardList,
    title: '17. Registro de Apoio Presencial',
    description: 'Instrumento com até 3 focos de observação condicionais, rubrica 0-3, permissões específicas para Consultoria. Gera registros consolidados em "Visualização Apoio Presencial".',
    tips: ['Apenas perfis com a ação registro_apoio_presencial habilitada acessam o módulo.', 'A escala 0-3 segue a mesma lógica de exclusão de N/A nas médias.'],
  },
  {
    icon: ClipboardList,
    title: '18. Consultoria Pedagógica e Visualizações',
    description: 'O Registro da Consultoria Pedagógica alimenta dois módulos: "Rel. Consultoria Pedagógica" (relatório consolidado com filtros e exportação por e-mail) e "Visualização Consultoria" (leitura individual). Os menus aparecem apenas para programas com a ação registro_consultoria_pedagogica habilitada.',
    tips: ['Filtros interdependentes por programa, ator, entidade e período aparecem no PDF gerado.', 'Apoio Presencial e Consultoria têm fluxos de visualização separados.'],
  },
  {
    icon: Calendar,
    title: '19. Formação, Lista de Presença e Histórico de Presença',
    description: 'A "Formação" e tipos correlatos (acompanhamento_formacoes, participa_formacoes, encontros REDES e Microciclos) geram presença por escola e instrumento de 8 campos. A Lista de Presença A4 traz dupla marca (Parceiros + Bússola). O Histórico de Presença consolida frequência por professor/escola/período (inclui REDES).',
    tips: ['Acompanhamento estritamente vinculado à Formação original com Ator diferente.', 'Horas de formação são calculadas entre início e fim, apenas para professores ativos.'],
  },
  {
    icon: AlertTriangle,
    title: '20. Pendências e SLA de 7 dias',
    description: 'Listagem de ações com pendências (programação sem registro, registros incompletos, instrumentos não preenchidos). O SLA é de 7 dias após a data prevista. Após o prazo, o Coordenador (N3) recebe e-mail automático de alerta. Reagendar a ação reinicia o prazo.',
    tips: ['Use o filtro por escola e período para priorizar a regularização.', 'A contagem aparece como badge vermelho no menu lateral.'],
  },
  {
    icon: Bell,
    title: '21. Notificações de Atraso',
    description: 'O sistema envia e-mails automáticos de ações atrasadas (7 dias) para os Coordenadores N3, usando o subdomínio notify.acompanhamento-aaps.org e o worker de fila de e-mails. Templates institucionais incluem dupla marca Parceiros + Bússola.',
    tips: ['Usuários podem optar por descadastrar via link de unsubscribe.', 'Falhas e supressões são monitoradas em logs específicos.'],
  },
  {
    icon: TrendingUp,
    title: '22. Evolução do Professor (Desabilitada)',
    description: 'Módulo de acompanhamento longitudinal por professor (heatmap e dimensões agrupadas em HSL). Atualmente DESABILITADO no menu — em revisão para nova versão.',
    tips: ['Indicador "Desabilitada" aparece ao lado do item no menu.'],
  },
  {
    icon: Eye,
    title: '23. Pontos Observados (Desabilitada)',
    description: 'Relatório consolidado de pontos observados em sala, com filtros interdependentes N1-N4.2. Atualmente DESABILITADO no menu para todos os perfis exceto Administrador (apenas para inspeção).',
    tips: ['Indicador "Desabilitada" aparece ao lado do item no menu Admin.'],
  },
  {
    icon: BarChart3,
    title: '24. Relatórios Gerais',
    description: 'Relatórios consolidados com gráficos de Previsto x Realizado, distribuição por tipo de ação, presença e instrumentos. Filtros por programa, escola, período e tipo. Exportação em PDF com dupla marca.',
    tips: ['Os indicadores são atualizados em tempo real.', 'Use o filtro "Programa" para isolar visão por escolas, regionais ou redes.'],
  },
  {
    icon: FileSpreadsheet,
    title: '25. Relatório de Instrumentos',
    description: 'Visão tabular dos instrumentos pedagógicos respondidos, com filtros por programa, período e instrumento. Útil para auditoria e análises agregadas.',
    tips: ['Disponível apenas para programas com algum instrumento habilitado.'],
  },
  {
    icon: Sparkles,
    title: '26. Relatórios Narrativos (com IA)',
    description: 'Gera narrativas executivas a partir dos dados filtrados usando IA (Gemini 2.5 Flash). O PDF gerado traz no cabeçalho os filtros aplicados (ator, entidade, status, período). Disponível para programas com instrumentos habilitados.',
    tips: ['Use filtros estreitos para narrativas mais focadas e econômicas.', 'O conteúdo é gerado dinamicamente — revise antes de publicar.'],
  },
  {
    icon: DollarSign,
    title: '27. Custo de Relatórios Narrativos (USD)',
    description: 'Gráfico em "Relatório de Acessos" consolida o custo mensal por programa dos Relatórios Narrativos. Baseado em tokens reais (input + output) retornados pela IA, com preço de Gemini 2.5 Flash ($0.30/M input + $2.50/M output). Visível apenas para N1, N2 e N3.',
    tips: ['Valores em USD com até 4 casas decimais.', 'Cada geração registra os tokens e o custo na base.'],
  },
  {
    icon: Eye,
    title: '28. Pontos Observados / Visualizações Específicas',
    description: 'Além das visualizações Consultoria e Apoio Presencial, o sistema oferece relatórios contextuais por programa (Rel. Regionais para Monitoramento; Matriz de Ações para visão cruzada por escola e período).',
    tips: ['A Matriz de Ações cruza ações realizadas por escola e período.', 'Use os filtros A-Z padronizados em todas as visualizações.'],
  },
  {
    icon: BarChart3,
    title: '29. Relatório de Acessos',
    description: 'Monitora acessos por mês e programa (log de user_access_log). Inclui o gráfico de Custo de Relatórios Narrativos para N1/N2/N3. N4-N5 têm acesso restrito a indicadores próprios.',
    tips: ['Útil para acompanhar adoção da plataforma.', 'Filtros por período afetam apenas o gráfico de acessos; o de custo é histórico.'],
  },
  {
    icon: History,
    title: '30. Histórico de Alterações',
    description: 'Auditoria das alterações relevantes (registros_alteracoes). Mostra autor, ação, data e detalhes do registro alterado. Útil para investigar inconsistências.',
    tips: ['Use os filtros por usuário e período para auditorias específicas.'],
  },
  {
    icon: SlidersHorizontal,
    title: '31. Configurar Formulário',
    description: 'Módulo do Administrador (N1) para configurar campos obrigatórios/opcionais de cada instrumento e perfil, e mapear instrumentos aos programas (form_config_settings). Define quais formulários aparecem para cada programa.',
    tips: ['Inativar uma ação aqui a remove do menu lateral dos usuários daquele programa.', 'O mapeamento é a fonte de verdade para dashboards e relatórios.'],
  },
  {
    icon: Filter,
    title: '32. Filtragem Dinâmica por Programa',
    description: 'Em todos os formulários, ao selecionar um Programa, as Entidades vinculadas são automaticamente filtradas. O menu lateral também é filtrado: itens dependentes de ação só aparecem se o programa do usuário tiver a ação habilitada.',
    tips: ['Admin não é filtrado — vê todos os itens.', 'Se o usuário tem mais de um programa, basta um deles habilitar a ação para o item aparecer.'],
  },
  {
    icon: Grid3X3,
    title: '33. Matriz de Ações',
    description: 'Visão cruzada de ações realizadas por escola e período. Permite identificar lacunas de atendimento e priorizar visitas.',
    tips: ['Use em conjunto com Pendências para planejamento.'],
  },
  {
    icon: Link2,
    title: '34. Integração Notion',
    description: 'Sincronização bidirecional de tarefas com o Notion. "Escolas relevantes" no Notion alimenta user_entidades. Tags de ações são categorizadas de forma consistente entre as duas plataformas.',
    tips: ['Configurações de sincronização ficam em notion_sync_config.', 'Logs detalhados aparecem em notion_sync_log.'],
  },
  {
    icon: FileDown,
    title: '35. Importações em Lote (Excel)',
    description: 'Diversos módulos aceitam upload de planilha Excel: Escolas, Programação, Entidades Filho e Usuários. O upload faz validação prévia e exibe erros antes da gravação. Exclusões podem ser em cascata recursiva quando aplicável.',
    tips: ['Sempre baixe o modelo da planilha disponibilizado no próprio dialog.', 'Operações em lote registram histórico em registros_alteracoes.'],
  },
  {
    icon: UserCog,
    title: '36. Gestão de Usuários',
    description: 'Módulo exclusivo do Administrador (N1). Cadastra usuários, atribui papéis (N1-N8), vincula programas e entidades. Permite redefinir senhas (com senha temporária e troca obrigatória no próximo login) e desativar contas. Cadastro em lote por upload disponível.',
    tips: ['Resets de senha respeitam hierarquia: somente perfis superiores resetam inferiores.', 'Senhas devem ter no mínimo 9 caracteres com complexidade obrigatória.'],
  },
  {
    icon: KeyRound,
    title: '37. Política de Senhas',
    description: 'Mínimo de 9 caracteres, com maiúscula, minúscula, número e caractere especial. Resets só podem ser feitos por perfil superior. Senha temporária deve ser trocada no primeiro login.',
    tips: ['Troque a senha periodicamente para maior segurança.', 'Em caso de bloqueio, contate o Coordenador (N3) ou Admin.'],
  },
  {
    icon: User,
    title: '38. Perfil do Usuário',
    description: 'Acesse e edite suas informações pessoais (nome, telefone, senha). O perfil exibe o papel, programas e entidades vinculados. Para Consultores/Gestores/Formadores, há extensões de Segmento e Componente que afetam a coleta de instrumentos.',
    tips: ['Mantenha telefone e e-mail atualizados para receber notificações de pendências.'],
  },
  {
    icon: BookOpen,
    title: '39. Suporte e Glossário',
    description: 'Plataforma "Bússola", parceira da Parceiros da Educação. Termos-chave: Entidade (Escola/Regional/Rede), Ator do Programa (substitui AAP/Formador), Instrumento (formulário pedagógico), Formação (ação que gera presença), Pendência (ação fora do SLA de 7 dias).',
    tips: ['Em caso de dúvida sobre permissões, consulte o Administrador.', 'O Manual completo pode ser exportado em PDF pelo botão no topo desta página.'],
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

      pdf.save('Manual_do_Usuario_Bussola.pdf');
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
            <p className="text-sm text-muted-foreground">Guia completo de uso da plataforma Bússola</p>
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
            <img src="/logo-bussola-vertical-branco.png" alt="Bússola" className="h-14 w-auto" />
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Manual do Usuário</h2>
              <p className="text-sm opacity-80" style={{ color: '#ffffffcc' }}>Bússola — Plataforma de Acompanhamento Pedagógico • Parceiros da Educação</p>
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