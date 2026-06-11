import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import ConsultoriaPedagogicaForm from "@/components/formularios/ConsultoriaPedagogicaForm";
import MonitoramentoRegionaisManageDialog from "@/components/formularios/MonitoramentoRegionaisManageDialog";
import MonitoramentoGestaoForm from "@/components/formularios/MonitoramentoGestaoForm";
import VisitaTecnicaMicrociclosForm from "@/components/formularios/VisitaTecnicaMicrociclosForm";
import VisitaTecnicaAlfabetizacaoRedesForm from "@/components/formularios/VisitaTecnicaAlfabetizacaoRedesForm";
import VisitaTecnicaTarlForm from "@/components/formularios/VisitaTecnicaTarlForm";
import VisitaTecnicaAlfabetizacaoForm from "@/components/formularios/VisitaTecnicaAlfabetizacaoForm";
import ObservacaoAulaGpaForm from "@/components/formularios/ObservacaoAulaGpaForm";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarPlus,
  Edit,
  Loader2,
  Upload,
  Trash2,
  Star,
  User,
  GraduationCap,
  Eye,
  ClipboardList,
  Printer,
} from "lucide-react";
import { AcaoPrintDialog } from "@/components/print/AcaoPrintDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { segmentoLabels, componenteLabels, anoSerieOptions, tipoAcaoLabels, cargoLabels } from "@/data/mockData";
import { StatusAcao, Segmento, ComponenteCurricular } from "@/types";
import {
  getCreatableAcoes,
  canUserCreateAcao,
  canUserEditAcao,
  ACAO_TYPE_INFO,
  AcaoTipo,
  getAcaoLabel,
  normalizeAcaoTipo,
  ACAO_FORM_CONFIG,
  ROLE_LABELS,
  ACAO_PERMISSION_MATRIX,
} from "@/config/acaoPermissions";
import { useAcoesByPrograma } from "@/hooks/useAcoesByPrograma";
import { getRoleLevel } from "@/config/roleConfig";
import { InstrumentForm } from "@/components/instruments/InstrumentForm";
import { INSTRUMENT_FORM_TYPES, useInstrumentFields } from "@/hooks/useInstrumentFields";
import { useFormFieldConfig } from "@/hooks/useFormFieldConfig";
import { QuestionSelectionStep, QuestionItem } from "@/components/acompanhamento/QuestionSelectionStep";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, isValidDateInRange } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { checkSimulatedPermission, SimulationOperation } from "@/lib/simulationGuard";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProgramacaoUploadDialog, ParsedProgramacao } from "@/components/forms/ProgramacaoUploadDialog";

type ProgramaType = "escolas" | "regionais" | "redes_municipais";

const programaLabels: Record<ProgramaType, string> = {
  escolas: "Escolas",
  regionais: "Regionais",
  redes_municipais: "Redes Mun.",
};

// Mapeamento de papel AAP para segmento e componente
const getAAPSegmentoComponente = (role: string | undefined) => {
  switch (role) {
    case "aap_inicial":
      return { segmentos: ["anos_iniciais"], componentes: ["polivalente"] };
    case "aap_portugues":
      return { segmentos: ["anos_finais", "ensino_medio"], componentes: ["lingua_portuguesa"] };
    case "aap_matematica":
      return { segmentos: ["anos_finais", "ensino_medio"], componentes: ["matematica"] };
    default:
      return { segmentos: Object.keys(segmentoLabels), componentes: Object.keys(componenteLabels) };
  }
};

interface Escola {
  id: string;
  nome: string;
  codesc?: string;
  programa?: string[] | null;
}

interface AAPFormador {
  id: string;
  nome: string;
  role: string;
  roles: string[];
  programas: ProgramaType[];
  escolasIds: string[];
}

interface EntidadeFilho {
  id: string;
  nome: string;
}

interface ProgramacaoDB {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  status: string;
  motivo_cancelamento: string | null;
  programa: string[] | null;
  tags: string[] | null;
  formacao_origem_id: string | null;
  tipo_ator_presenca: string | null;
  turma_formacao: string | null;
  entidade_filho_id: string | null;
  projeto: string | null;
  componente_formacao_redes?: string | null;
  projeto_notion?: string | null;
  local?: string | null;
  publico_formacao?: string | null;
  created_by?: string | null;
  frente_trabalho?: string | null;
  publico_encontro?: string[] | null;
  local_encontro?: string | null;
  local_escolas?: string[] | null;
  local_outro?: string | null;
  fechamento?: string | null;
  encaminhamentos?: string | null;
  apoio_componente?: string | null;
  apoio_etapa?: string | null;
  apoio_escola_voar?: boolean | null;
  apoio_turma_voar?: string | null;
  apoio_professor_id?: string | null;
  apoio_participantes?: string[] | null;
  apoio_participantes_outros?: string | null;
  apoio_obs_planejada?: boolean | null;
  apoio_focos?: string[] | null;
  apoio_devolutiva?: string | null;
  created_at: string;
}

interface ProfessorDB {
  id: string;
  nome: string;
  escola_id: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  cargo: string;
}

export default function ProgramacaoPage() {
  const { user, isAdminOrGestor, isAdmin, isGestor, isAAP, isManager, profile, isSimulating, simulatedRole, simulatedPrograma, effectiveProgramas } =
    useAuth();
  const queryClient = useQueryClient();
  const { formConfigSettings } = useAcoesByPrograma();

  // Apenas estes tipos podem ser cadastrados sob o programa Regionais.
  // Os demais instrumentos vinculados a Regionais são preenchidos como
  // rubricas durante o gerenciamento da ação Monitoramento de Ações Formativas.
  const REGIONAIS_CADASTRABLE_TIPOS = new Set<string>([
    "monitoramento_acoes_formativas",
    "monitoramento_gestao",
    "visita_tecnica_alfabetizacao_redes",
    "visita_tecnica_tarl",
    "visita_tecnica_alfabetizacao",
    "reuniao_acomp_alfabetizacao",
  ]);

  const getProgramasForTipo = (tipo: string): ProgramaType[] => {
    const config = formConfigSettings.find((f) => f.form_key === tipo);
    const base = config ? ((config.programas as ProgramaType[]) || []) : (["escolas", "regionais", "redes_municipais"] as ProgramaType[]);
    if (REGIONAIS_CADASTRABLE_TIPOS.has(tipo)) return base;
    return base.filter((p) => p !== "regionais");
  };
  const [programacoes, setProgramacoes] = useState<ProgramacaoDB[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const handledEditParamRef = useRef<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgramacao, setEditingProgramacao] = useState<ProgramacaoDB | null>(null);
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | "todos">("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [entidadeFilter, setEntidadeFilter] = useState<string>("todos");
  const [entidadeFilhoFilter, setEntidadeFilhoFilter] = useState<string>("todos");
  const [allEntidadesFilho, setAllEntidadesFilho] = useState<Array<{ id: string; nome: string; escola_id: string }>>([]);
  const [formadorFilter, setFormadorFilter] = useState<string>("todos");
  const [consultorFilter, setConsultorFilter] = useState<string>("todos");
  const [gpiFilter, setGpiFilter] = useState<string>("todos");

  // Estados para dados do banco
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [aaps, setAaps] = useState<AAPFormador[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Programas do gestor ou AAP (se for gestor ou AAP)
  const [gestorProgramas, setGestorProgramas] = useState<ProgramaType[]>([]);
  const [aapProgramas, setAapProgramas] = useState<ProgramaType[]>([]);
  const [aapEscolasIds, setAapEscolasIds] = useState<string[]>([]);

  // Estado para gerenciamento de ação
  const [selectedProgramacao, setSelectedProgramacao] = useState<ProgramacaoDB | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [acaoRealizada, setAcaoRealizada] = useState<boolean | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [reagendar, setReagendar] = useState(false);
  const [novaData, setNovaData] = useState("");
  const [novoHorarioInicio, setNovoHorarioInicio] = useState("");
  const [novoHorarioFim, setNovoHorarioFim] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEditRealizada, setPendingEditRealizada] = useState(false);

  // Estados para exclusão
  const [programacaoToDelete, setProgramacaoToDelete] = useState<ProgramacaoDB | null>(null);
  const [printProgramacaoId, setPrintProgramacaoId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para exclusão em lote
  const [selectedProgramacaoIds, setSelectedProgramacaoIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [distinctTurmasFormacao, setDistinctTurmasFormacao] = useState<string[]>([]);

  // Estados para avaliação de acompanhamento de aula (instrument-based)
  const [isAvaliacaoDialogOpen, setIsAvaliacaoDialogOpen] = useState(false);
  const [professoresAvaliacao, setProfessoresAvaliacao] = useState<ProfessorDB[]>([]);
  const [selectedProfessorAvaliacao, setSelectedProfessorAvaliacao] = useState<string | null>(null);
  const [turma, setTurma] = useState("");
  const [observacoesAcompanhamento, setObservacoesAcompanhamento] = useState("");
  const [perProfessorResponses, setPerProfessorResponses] = useState<Record<string, Record<string, any>>>({});
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);
  const [selectedQuestionKeys, setSelectedQuestionKeys] = useState<string[]>([]);
  const [questionSelectionDone, setQuestionSelectionDone] = useState(false);

  // Hooks for instrument-based observation
  const { isFieldEnabled, isFieldRequired, minOptionalQuestions } = useFormFieldConfig("observacao_aula");
  const { fields: obsAulaFields } = useInstrumentFields("observacao_aula");
  const [isLoadingProfessores, setIsLoadingProfessores] = useState(false);

  // Estados para presença de formação
  const [isPresencaDialogOpen, setIsPresencaDialogOpen] = useState(false);
  const [professoresPresenca, setProfessoresPresenca] = useState<ProfessorDB[]>([]);
  const [presencaList, setPresencaList] = useState<{ professorId: string; presente: boolean }[]>([]);
  const [observacoesFormacao, setObservacoesFormacao] = useState("");
  const [avancosFormacao, setAvancosFormacao] = useState("");
  const [dificuldadesFormacao, setDificuldadesFormacao] = useState("");

  // Estados para instrumento pedagógico (tipos sem presença nem avaliação por professor)
  const [isInstrumentDialogOpen, setIsInstrumentDialogOpen] = useState(false);
  const [instrumentResponses, setInstrumentResponses] = useState<Record<string, any>>({});
  // Indica se já existia uma resposta salva (para decidir se ao fechar sem salvar devemos reverter para 'prevista')
  const [instrumentHadSavedResponse, setInstrumentHadSavedResponse] = useState(false);
  const [isConfirmRevertOpen, setIsConfirmRevertOpen] = useState(false);
  const [isConsultoriaDialogOpen, setIsConsultoriaDialogOpen] = useState(false);
  const [consultoriaRegistroId, setConsultoriaRegistroId] = useState<string | null>(null);
  const [isMonitRegionaisManaging, setIsMonitRegionaisManaging] = useState(false);
  const [monitRegionaisRegistroId, setMonitRegionaisRegistroId] = useState<string | null>(null);
  const [isMonitGestaoManaging, setIsMonitGestaoManaging] = useState(false);
  const [monitGestaoRegistroId, setMonitGestaoRegistroId] = useState<string | null>(null);
  const [monitGestaoInitial, setMonitGestaoInitial] = useState<Record<string, any> | null>(null);
  const [isRedesManaging, setIsRedesManaging] = useState(false);
  const [redesRegistroId, setRedesRegistroId] = useState<string | null>(null);
  const [isAlfabManaging, setIsAlfabManaging] = useState(false);
  const [alfabRegistroId, setAlfabRegistroId] = useState<string | null>(null);
  const [isTarlManaging, setIsTarlManaging] = useState(false);
  const [tarlRegistroId, setTarlRegistroId] = useState<string | null>(null);
  const [isVtAlfabManaging, setIsVtAlfabManaging] = useState(false);
  const [vtAlfabRegistroId, setVtAlfabRegistroId] = useState<string | null>(null);
  const [isGpaManaging, setIsGpaManaging] = useState(false);
  const [gpaRegistroId, setGpaRegistroId] = useState<string | null>(null);

  // Estados para Observação de Aula REDES - Escola (entidade filho) e Turma
  const [entidadesFilho, setEntidadesFilho] = useState<EntidadeFilho[]>([]);
  const [formEscolaFilhoId, setFormEscolaFilhoId] = useState("");
  const [formTurmaRedes, setFormTurmaRedes] = useState("");
  const [formAnoSerieRedes, setFormAnoSerieRedes] = useState("");
  const [formModalidadeTarl, setFormModalidadeTarl] = useState("");
  // Estados para Monitoramento de Ações Formativas
  const [formFrenteTrabalho, setFormFrenteTrabalho] = useState("");
  const [formPublicoEncontro, setFormPublicoEncontro] = useState<string[]>([]);
  const [formLocalEncontro, setFormLocalEncontro] = useState("");
  const [formLocalEscolas, setFormLocalEscolas] = useState<string[]>([]);
  const [formLocalOutro, setFormLocalOutro] = useState("");
  const [formFechamento, setFormFechamento] = useState("");
  const [formEncaminhamentos, setFormEncaminhamentos] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [formAvancos, setFormAvancos] = useState("");
  const [formDificuldades, setFormDificuldades] = useState("");
  // Estados para Registro de Apoio Presencial — campos (C)
  const [formApoioComponente, setFormApoioComponente] = useState("");
  const [formApoioEtapa, setFormApoioEtapa] = useState("");
  const [formApoioEscolaVoar, setFormApoioEscolaVoar] = useState<"sim" | "nao" | "">("");
  const [formApoioTurmaVoar, setFormApoioTurmaVoar] = useState("");
  const [formApoioProfessorId, setFormApoioProfessorId] = useState("");
  const [formApoioParticipantes, setFormApoioParticipantes] = useState<string[]>([]);
  const [formApoioParticipantesOutros, setFormApoioParticipantesOutros] = useState("");
  const [formApoioObsPlanejada, setFormApoioObsPlanejada] = useState<"sim" | "nao" | "">("");
  const [formApoioFocos, setFormApoioFocos] = useState<string[]>([]);
  const [formApoioDevolutiva, setFormApoioDevolutiva] = useState("");
  const [formApoioProfessores, setFormApoioProfessores] = useState<
    { id: string; nome: string; ano_serie: string; componente: string }[]
  >([]);
  const APOIO_COMPONENTE_OPTIONS = ["LP", "Mat", "OE MAT", "OE LP", "Tutoria MAT", "Tutoria LP", "Polivalente", "Não se Aplica"];
  const APOIO_ETAPA_OPTIONS = [
    "1º Ano",
    "2º Ano",
    "3º Ano",
    "4º Ano",
    "5º Ano",
    "6º Ano",
    "7º Ano",
    "8º Ano",
    "9º Ano",
    "1ª Série",
    "2ª Série",
    "3ª Série",
    "Não se Aplica",
  ];
  const APOIO_PARTICIPANTES_OPTIONS = ["Consultor", "Coordenador", "Diretor", "Vice-Diretor", "Outros"];
  const APOIO_DEVOLUTIVA_OPTIONS = [
    "No mesmo dia da observação",
    "Em até 3 dias após a observação",
    "Entre 4 e 7 dias após a observação",
    "Mais de 7 dias após a observação",
    "Não foi possível agendar ainda",
  ];
  const APOIO_FOCO_OPTIONS = [
    { value: "planejamento", label: "Planejamento e domínio de conteúdo e recursos didáticos" },
    { value: "estrategias", label: "Estratégias de aprendizagem" },
    { value: "gestao", label: "Gestão de sala de aula" },
  ];
  const MONIT_PUBLICO_OPTIONS = [
    "CEC",
    "PEC – Anos Iniciais",
    "PEC – Língua Portuguesa",
    "PEC – Matemática",
    "PEC – Qualidade de Aula",
    "PEC – Multiplica",
    "CGP / CGPG / PAAC",
    "Supervisor(a)",
    "Diretor(a)",
    "Vice-Diretor(a)",
    "Professores(as)",
  ];
  const MONIT_FRENTE_OPTIONS = [
    "APF – PEC Qualidade de Aula",
    "Jornada PEI",
    "Professor Tutor",
    "VOAR",
    "Multiplica Presencial",
  ];
  const MONIT_LOCAL_OPTIONS = [
    { value: "online", label: "Online" },
    { value: "regional", label: "Regional de Ensino" },
    { value: "efape", label: "EFAPE" },
    { value: "escolas", label: "Escola(s)" },
    { value: "outro", label: "Outro" },
  ];
  const MONIT_FECHAMENTO_OPTIONS = ["Sim", "Parcialmente", "Não"];

  const creatableAcoes = useMemo(() => {
    const role = profile?.role as import("@/contexts/AuthContext").AppRole | undefined;
    return getCreatableAcoes(role);
  }, [profile?.role]);

  // Estados para agendar acompanhamento de formação no manage dialog
  const [agendarAcompanhamento, setAgendarAcompanhamento] = useState(false);
  const [acompanhamentoData, setAcompanhamentoData] = useState("");
  const [acompanhamentoHorarioInicio, setAcompanhamentoHorarioInicio] = useState("");
  const [acompanhamentoHorarioFim, setAcompanhamentoHorarioFim] = useState("");
  const [acompanhamentoAapId, setAcompanhamentoAapId] = useState("");
  const [atoresElegiveis, setAtoresElegiveis] = useState<{ id: string; nome: string; role: string }[]>([]);
  const [isLoadingAtores, setIsLoadingAtores] = useState(false);

  const [formData, setFormData] = useState<{
    tipo: string;
    titulo: string;
    descricao: string;
    data: string;
    horarioInicio: string;
    horarioFim: string;
    escolaId: string;
    aapId: string;
    segmento: Segmento | "todos";
    componente: ComponenteCurricular;
    anoSerie: string;
    programa: ProgramaType[];
    tags: string;
    tipoAtorPresenca: string;
    projetoNotion: string;
    local: string;
    turmaFormacao: string;
    publicoFormacao: string;
    projeto: string;
    componenteFormacaoRedes: string;
    nucleoDepartamento: string;
    observadorNome: string;
  }>({
    tipo: creatableAcoes.filter((t) => t !== "acompanhamento_formacoes")[0] || "observacao_aula",
    titulo: "",
    descricao: "",
    data: "",
    horarioInicio: "",
    horarioFim: "",
    escolaId: "",
    aapId: "",
    segmento: "anos_iniciais",
    componente: "polivalente",
    anoSerie: "",
    programa: [] as ProgramaType[],
    tags: "",
    tipoAtorPresenca: "todos",
    projetoNotion: "",
    local: "",
    turmaFormacao: "",
    publicoFormacao: "",
    projeto: "",
    componenteFormacaoRedes: "",
    nucleoDepartamento: "",
    observadorNome: "",
  });

  // Auto-fill programa baseado no programa do usuário logado
  useEffect(() => {
    const userPrograma =
      gestorProgramas.length > 0
        ? gestorProgramas
        : aapProgramas.length > 0
          ? aapProgramas
          : ["escolas" as ProgramaType];
    setFormData((prev) => {
      // Only auto-fill if programa is empty (initial state)
      if (prev.programa.length === 0) {
        return { ...prev, programa: userPrograma };
      }
      return prev;
    });
  }, [gestorProgramas, aapProgramas]);

  // Fetch turmas de formação distintas dos atores da entidade selecionada
  useEffect(() => {
    const tiposComTurma = ["encontro_professor_redes", "encontro_eteg_redes", "encontro_microciclos_recomposicao"];
    if (!formData.escolaId || !tiposComTurma.includes(formData.tipo)) {
      setDistinctTurmasFormacao([]);
      return;
    }
    const fetchTurmas = async () => {
      const { data } = await supabase
        .from("professores")
        .select("turma_formacao")
        .eq("escola_id", formData.escolaId)
        .eq("ativo", true)
        .not("turma_formacao", "is", null);
      if (data) {
        const unique = [...new Set(data.map((d) => (d as any).turma_formacao as string).filter(Boolean))].sort();
        setDistinctTurmasFormacao(unique);
      }
    };
    fetchTurmas();
    // Reset turma quando muda entidade para evitar valor órfão
    if (!editingProgramacao) setFormData((prev) => ({ ...prev, turmaFormacao: "" }));
  }, [formData.escolaId, formData.tipo, editingProgramacao]);

  // Load professores for "Registro de Apoio Presencial" (C)
  useEffect(() => {
    if (formData.tipo !== "registro_apoio_presencial" || !formData.escolaId) {
      setFormApoioProfessores([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("professores")
        .select("id, nome, ano_serie, componente")
        .eq("escola_id", formData.escolaId)
        .eq("ativo", true)
        .order("nome");
      setFormApoioProfessores((data as any) || []);
    })();
  }, [formData.tipo, formData.escolaId]);

  // Fetch entidades_filho when escola (rede) changes for observacao_aula_redes, monitoramento_acoes_formativas, or formacao+regionais
  const needsEntidadeFilho =
    ["observacao_aula_redes", "monitoramento_acoes_formativas", "visita_tecnica_alfabetizacao_redes", "visita_tecnica_tarl", "visita_tecnica_microciclos", "visita_tecnica_alfabetizacao", "reuniao_acomp_alfabetizacao"].includes(formData.tipo) ||
    (formData.tipo === "formacao" && formData.programa?.includes("regionais"));
  useEffect(() => {
    if (!needsEntidadeFilho || !formData.escolaId) {
      setEntidadesFilho([]);
      setFormEscolaFilhoId("");
      return;
    }
    const fetchFilhos = async () => {
      const { data } = await supabase
        .from("entidades_filho")
        .select("id, nome")
        .eq("escola_id", formData.escolaId)
        .eq("ativa", true)
        .order("nome");
      setEntidadesFilho(data || []);
      if (!editingProgramacao) setFormEscolaFilhoId("");
    };
    fetchFilhos();
  }, [formData.escolaId, formData.tipo, needsEntidadeFilho, editingProgramacao]);

  // Load all entidades_filho once for global filter
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("entidades_filho")
        .select("id, nome, escola_id")
        .eq("ativa", true)
        .order("nome");
      setAllEntidadesFilho(data || []);
    })();
  }, []);


  const guardOperation = (
    operation: SimulationOperation,
    context: {
      recordProgramas?: string[];
      recordEscolaId?: string;
      recordAapId?: string;
      acaoTipo?: string;
    },
  ): boolean => {
    const result = checkSimulatedPermission({
      effectiveRole: (isSimulating ? simulatedRole : profile?.role) as any,
      isSimulating,
      operation,
      userId: user?.id || "",
      userProgramas: (isSimulating ? (effectiveProgramas || []) : (profile?.programas || [])) as any,
      userEntidadeIds: profile?.entidadeIds || [],
      context,
    });
    if (!result.allowed) {
      toast.error("Permissão negada (simulação)", { description: result.reason });
      return false;
    }
    return true;
  };

  const fetchProgramacoes = async () => {
    setIsLoading(true);
    try {
      const PAGE = 1000;
      let all: any[] = [];
      let from = 0;
      // Pagina para superar o limite default de 1000 linhas do PostgREST
      // (garante que admins vejam todas as ações no calendário, inclusive datas futuras).
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase
          .from("programacoes")
          .select("*")
          .order("data", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const batch = data || [];
        all = all.concat(batch);
        if (batch.length < PAGE) break;
        from += PAGE;
      }
      setProgramacoes(all);
    } catch (error) {
      console.error("Error fetching programacoes:", error);
      toast.error("Erro ao carregar programações");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar escolas e AAPs/Formadores do banco
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch gestor programas if user is gestor
      let userGestorProgramas: ProgramaType[] = [];
      let userAapProgramas: ProgramaType[] = [];
      let userAapEscolasIds: string[] = [];

      if ((isGestor || isManager) && user) {
        const { data: gestorProgramasData } = await supabase
          .from("user_programas")
          .select("programa")
          .eq("user_id", user.id);

        userGestorProgramas = (gestorProgramasData || []).map((gp) => gp.programa as ProgramaType);
        setGestorProgramas(userGestorProgramas);

        // Set default programa for form if gestor has only one programa
        if (userGestorProgramas.length === 1) {
          setFormData((prev) => ({ ...prev, programa: [userGestorProgramas[0]] }));
          setProgramaFilter(userGestorProgramas[0]);
        } else if (userGestorProgramas.length > 1) {
          // Se tiver mais de um programa, ainda assim filtra pelo primeiro por padrão
          setProgramaFilter(userGestorProgramas[0]);
        }
      }

      // Fetch AAP programas and escolas if user is AAP
      if (isAAP && user) {
        const [aapProgramasRes, aapEscolasRes] = await Promise.all([
          supabase.from("user_programas").select("programa").eq("user_id", user.id),
          supabase.from("user_entidades").select("escola_id").eq("user_id", user.id),
        ]);

        userAapProgramas = (aapProgramasRes.data || []).map((ap) => ap.programa as ProgramaType);
        userAapEscolasIds = (aapEscolasRes.data || []).map((ae) => ae.escola_id);
        setAapProgramas(userAapProgramas);
        setAapEscolasIds(userAapEscolasIds);

        // Set default filter based on AAP programas
        if (userAapProgramas.length === 1) {
          setProgramaFilter(userAapProgramas[0]);
        } else if (userAapProgramas.length > 1) {
          // Se tiver mais de um programa, filtra pelo primeiro por padrão
          setProgramaFilter(userAapProgramas[0]);
        }

        // Set default values based on AAP role
        const aapConfig = getAAPSegmentoComponente(profile?.role);
        const defaultSegmento = aapConfig.segmentos[0] as Segmento;
        const defaultComponente = aapConfig.componentes[0] as ComponenteCurricular;

        setFormData((prev) => ({
          ...prev,
          programa: userAapProgramas.length === 1 ? [userAapProgramas[0]] : prev.programa,
          aapId: user.id,
          segmento: defaultSegmento,
          componente: defaultComponente,
        }));
      }

      // Fetch escolas - filter by gestor's programa if applicable
      const { data: escolasData } = await supabase
        .from("escolas")
        .select("id, nome, codesc, programa")
        .eq("ativa", true)
        .order("nome");

      // Filter escolas by manager programa if user is manager, or by AAP escolas if user is AAP
      let filteredEscolas = escolasData || [];
      if ((isGestor || isManager) && !isAdmin && userGestorProgramas.length > 0) {
        filteredEscolas = filteredEscolas.filter(
          (e) => e.programa && e.programa.some((p: string) => userGestorProgramas.includes(p as ProgramaType)),
        );
      } else if (isAAP && userAapEscolasIds.length > 0) {
        filteredEscolas = filteredEscolas.filter((e) => userAapEscolasIds.includes(e.id));
      }

      setEscolas(filteredEscolas);

      // Fetch ALL users with roles, programas and entidades
      const [profilesRes, rolesRes, aapProgramasRes, aapEscolasRes, userProgramasRes, userEntidadesRes, gestorProgramasRes] =
        await Promise.all([
          supabase.from("profiles_directory").select("id, nome").order("nome"),
          supabase.from("user_roles").select("user_id, role"),
          supabase.from("aap_programas").select("aap_user_id, programa"),
          supabase.from("aap_escolas").select("aap_user_id, escola_id"),
          supabase.from("user_programas").select("user_id, programa"),
          supabase.from("user_entidades").select("user_id, escola_id"),
          supabase.from("gestor_programas").select("gestor_user_id, programa"),
        ]);

      // Build ALL users with roles
      const allRolesData = rolesRes.data || [];
      const uniqueUserIds = [...new Set(allRolesData.map((r) => r.user_id))];

      let allUsersList: AAPFormador[] = uniqueUserIds.map((userId) => {
        const prof = profilesRes.data?.find((p) => p.id === userId);
        const userRoles = allRolesData.filter((r) => r.user_id === userId).map((r) => r.role);

        // Merge programas from both tables
        const aapProgs = (aapProgramasRes.data || [])
          .filter((p) => p.aap_user_id === userId)
          .map((p) => p.programa as ProgramaType);
        const userProgs = (userProgramasRes.data || [])
          .filter((p) => p.user_id === userId)
          .map((p) => p.programa as ProgramaType);
        const gestorProgs = (gestorProgramasRes.data || [])
          .filter((p) => p.gestor_user_id === userId)
          .map((p) => p.programa as ProgramaType);
        const allProgs = [...new Set([...aapProgs, ...userProgs, ...gestorProgs])];

        // Merge entidades from both tables
        const aapEntidades = (aapEscolasRes.data || [])
          .filter((ae) => ae.aap_user_id === userId)
          .map((ae) => ae.escola_id);
        const userEntidades = (userEntidadesRes.data || [])
          .filter((ue) => ue.user_id === userId)
          .map((ue) => ue.escola_id);
        const allEntidades = [...new Set([...aapEntidades, ...userEntidades])];

        return {
          id: userId,
          nome: prof?.nome || "Sem nome",
          role: userRoles[0] || "",
          roles: userRoles,
          programas: allProgs,
          escolasIds: allEntidades,
        };
      });

      // Filter by manager's programa if applicable
      if ((isGestor || isManager) && !isAdmin && userGestorProgramas.length > 0) {
        allUsersList = allUsersList.filter(
          (u) =>
            u.programas.some((p) => userGestorProgramas.includes(p)) ||
            u.roles.some((r) => ["admin", "gestor", "n3_coordenador_programa"].includes(r)),
        );
      }

      setAaps(allUsersList);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchProgramacoes();
    fetchData();
  }, [isGestor, isManager, isAAP, user]);

  // Limpar seleção e filtros dependentes quando filtros principais mudam
  useEffect(() => {
    setSelectedProgramacaoIds(new Set());
    setEntidadeFilter("todos");
    setFormadorFilter("todos");
    setConsultorFilter("todos");
    setGpiFilter("todos");
  }, [programaFilter, tipoFilter, currentMonth]);

  // Fetch eligible actors when acompanhamento checkbox is toggled
  useEffect(() => {
    if (!agendarAcompanhamento || !selectedProgramacao) {
      setAtoresElegiveis([]);
      setAcompanhamentoAapId("");
      return;
    }

    const fetchAtoresElegiveis = async () => {
      setIsLoadingAtores(true);
      try {
        const escolaId = selectedProgramacao.escola_id;
        const programas = selectedProgramacao.programa || [];
        const originalAapId = selectedProgramacao.aap_id;

        // Eligible roles: N1-N5
        const eligibleRoles: Array<
          | "admin"
          | "gestor"
          | "n3_coordenador_programa"
          | "n4_1_cped"
          | "n4_2_gpi"
          | "n5_formador"
          | "aap_inicial"
          | "aap_portugues"
          | "aap_matematica"
        > = [
          "admin",
          "gestor",
          "n3_coordenador_programa",
          "n4_1_cped",
          "n4_2_gpi",
          "n5_formador",
          "aap_inicial",
          "aap_portugues",
          "aap_matematica",
        ];

        // Get all users with eligible roles
        const { data: rolesData } = await supabase.from("user_roles").select("user_id, role").in("role", eligibleRoles);

        if (!rolesData || rolesData.length === 0) {
          setAtoresElegiveis([]);
          return;
        }

        const userIds = [...new Set(rolesData.map((r) => r.user_id))].filter((id) => id !== originalAapId);

        if (userIds.length === 0) {
          setAtoresElegiveis([]);
          return;
        }

        // Get user_programas, aap_programas, user_entidades, aap_escolas, and profiles in parallel
        const [userProgramasRes, aapProgramasRes, userEntidadesRes, aapEscolasRes, profilesRes] = await Promise.all([
          supabase.from("user_programas").select("user_id, programa").in("user_id", userIds),
          supabase.from("aap_programas").select("aap_user_id, programa").in("aap_user_id", userIds),
          supabase.from("user_entidades").select("user_id, escola_id").in("user_id", userIds),
          supabase.from("aap_escolas").select("aap_user_id, escola_id").in("aap_user_id", userIds),
          supabase.from("profiles_directory").select("id, nome").in("id", userIds),
        ]);

        const eligible: { id: string; nome: string; role: string }[] = [];

        for (const userId of userIds) {
          // Check programa match
          const userProgs = (userProgramasRes.data || [])
            .filter((up) => up.user_id === userId)
            .map((up) => up.programa);
          const aapProgs = (aapProgramasRes.data || [])
            .filter((ap) => ap.aap_user_id === userId)
            .map((ap) => ap.programa);
          const allProgs = [...userProgs, ...aapProgs];
          const hasPrograma = programas.length === 0 || allProgs.some((p) => programas.includes(p));

          // Check entidade match
          const userEntidades = (userEntidadesRes.data || [])
            .filter((ue) => ue.user_id === userId)
            .map((ue) => ue.escola_id);
          const aapEntidades = (aapEscolasRes.data || [])
            .filter((ae) => ae.aap_user_id === userId)
            .map((ae) => ae.escola_id);
          const allEntidades = [...userEntidades, ...aapEntidades];

          // N1 (admin) and N2 (gestor) don't need entidade match - they have broad access
          const userRole = rolesData.find((r) => r.user_id === userId)?.role || "";
          const isManagerRole = ["admin", "gestor", "n3_coordenador_programa"].includes(userRole);
          const hasEntidade = isManagerRole || allEntidades.includes(escolaId);

          if (hasPrograma && hasEntidade) {
            const profile = profilesRes.data?.find((p) => p.id === userId);
            eligible.push({
              id: userId,
              nome: profile?.nome || "Sem nome",
              role: userRole,
            });
          }
        }

        eligible.sort((a, b) => a.nome.localeCompare(b.nome));
        setAtoresElegiveis(eligible);
      } catch (error) {
        console.error("Error fetching eligible actors:", error);
        toast.error("Erro ao carregar atores elegíveis");
      } finally {
        setIsLoadingAtores(false);
      }
    };

    fetchAtoresElegiveis();
  }, [agendarAcompanhamento, selectedProgramacao]);

  // Filter users based on selected action type config
  const filteredAaps = useMemo(() => {
    const formConfig = ACAO_FORM_CONFIG[formData.tipo as AcaoTipo];

    if (formConfig?.useResponsavelSelector) {
      // New Responsável selector: filter by eligible roles
      const eligibleRoles = formConfig.eligibleResponsavelRoles;
      let filtered = aaps.filter((u) => u.roles.some((r) => eligibleRoles.includes(r as any)));

      // Filter by programa (admin bypassa; N2/N3 só aparecem se vinculados ao programa da ação)
      if (formData.programa.length > 0) {
        filtered = filtered.filter((u) => {
          const isAdminUser = u.roles.includes("admin");
          return isAdminUser || u.programas.some((p) => formData.programa.includes(p));
        });
      }

      // Filter by entidade if selected
      if (formConfig.requiresEntidade && formData.escolaId) {
        filtered = filtered.filter((u) => {
          const isManager = u.roles.some((r) => ["admin", "gestor", "n3_coordenador_programa"].includes(r));
          return isManager || u.escolasIds.includes(formData.escolaId);
        });
      }

      return [...filtered].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR", { sensitivity: "base" }));
    } else {
      // Legacy AAP selector: filter by AAP/operational roles and escola
      const operationalUsers = aaps.filter((u) =>
        u.roles.some((r) => r.startsWith("aap_") || ["n4_1_cped", "n4_2_gpi", "n5_formador"].includes(r)),
      );
      const scoped = !formData.escolaId
        ? operationalUsers
        : operationalUsers.filter((u) => u.escolasIds.includes(formData.escolaId));
      return [...scoped].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR", { sensitivity: "base" }));
    }
  }, [aaps, formData.tipo, formData.escolaId, formData.programa]);

  // Filter programacoes based on filters and user permissions
  const filteredProgramacoes = useMemo(() => {
    return programacoes.filter((p) => {
      // Simulação: aplicar filtros de escopo conforme papel simulado
      if (isSimulating && simulatedRole) {
        const acaoTipo = normalizeAcaoTipo(p.tipo);
        const perm = ACAO_PERMISSION_MATRIX[acaoTipo]?.[simulatedRole];

        // Se não tem permissão de visualização, ocultar
        if (!perm?.canView) return false;

        // Filtrar por escopo
        if (perm.viewScope === "programa" && profile?.programas && profile.programas.length > 0) {
          if (!p.programa || !p.programa.some((prog) => profile.programas!.includes(prog as ProgramaType))) {
            return false;
          }
        }
        if (perm.viewScope === "entidade" && profile?.entidadeIds && profile.entidadeIds.length > 0) {
          if (!profile.entidadeIds.includes(p.escola_id)) {
            return false;
          }
        }
        if (perm.viewScope === "proprio") {
          if (p.aap_id !== user?.id) return false;
        }
      } else {
        // N4-N8: ver somente as próprias ações (onde é o responsável)
        if (!isAdmin && !isGestor && !isManager) {
          if (!user || p.aap_id !== user.id) return false;
        }
        // N2/N3 (Gestor / Coordenador de Programa): filtrar por programas atribuídos
        if ((isGestor || isManager) && !isAdmin && gestorProgramas.length > 0) {
          if (!p.programa || !p.programa.some((prog) => gestorProgramas.includes(prog as ProgramaType))) {
            return false;
          }
        }
      }

      // Aplicar filtro de programa selecionado
      if (programaFilter !== "todos") {
        if (!p.programa || !p.programa.includes(programaFilter)) return false;
      }
      if (tipoFilter !== "todos" && p.tipo !== tipoFilter) return false;
      if (entidadeFilter !== "todos" && p.escola_id !== entidadeFilter) return false;
      if (entidadeFilhoFilter !== "todos" && (p as any).entidade_filho_id !== entidadeFilhoFilter) return false;
      if (formadorFilter !== "todos" && p.aap_id !== formadorFilter) return false;
      if (consultorFilter !== "todos" && p.aap_id !== consultorFilter) return false;
      if (gpiFilter !== "todos" && p.aap_id !== gpiFilter) return false;
      return true;
    });
  }, [
    programacoes,
    programaFilter,
    tipoFilter,
    entidadeFilter,
    entidadeFilhoFilter,
    formadorFilter,
    consultorFilter,
    gpiFilter,
    isAAP,
    isGestor,
    isManager,
    aapProgramas,
    gestorProgramas,
    isSimulating,
    simulatedRole,
    profile,
    user,
  ]);

  // ===== Cascading filter options =====
  // Programações já no escopo de hierarquia (sem aplicar os filtros de UI), para derivar opções dos selects.
  const scopedProgramacoes = useMemo(() => {
    return programacoes.filter((p) => {
      if (isSimulating && simulatedRole) {
        const acaoTipo = normalizeAcaoTipo(p.tipo);
        const perm = ACAO_PERMISSION_MATRIX[acaoTipo]?.[simulatedRole];
        if (!perm?.canView) return false;
        if (perm.viewScope === "programa" && profile?.programas && profile.programas.length > 0) {
          if (!p.programa || !p.programa.some((prog) => profile.programas!.includes(prog as ProgramaType))) return false;
        }
        if (perm.viewScope === "entidade" && profile?.entidadeIds && profile.entidadeIds.length > 0) {
          if (!profile.entidadeIds.includes(p.escola_id)) return false;
        }
        if (perm.viewScope === "proprio") {
          if (p.aap_id !== user?.id) return false;
        }
      } else {
        if (!isAdmin && !isGestor && !isManager) {
          if (!user || p.aap_id !== user.id) return false;
        }
        if ((isGestor || isManager) && !isAdmin && gestorProgramas.length > 0) {
          if (!p.programa || !p.programa.some((prog) => gestorProgramas.includes(prog as ProgramaType))) return false;
        }
      }
      return true;
    });
  }, [programacoes, isAdmin, isGestor, isManager, gestorProgramas, isSimulating, simulatedRole, profile, user]);

  // Aplica os filtros de UI atuais a uma programação, exceto os listados em `except`.
  const passesUiFilters = useCallback(
    (p: ProgramacaoDB, except: Set<string> = new Set()) => {
      if (!except.has("programa") && programaFilter !== "todos") {
        if (!p.programa || !p.programa.includes(programaFilter)) return false;
      }
      if (!except.has("tipo") && tipoFilter !== "todos" && p.tipo !== tipoFilter) return false;
      if (!except.has("entidade") && entidadeFilter !== "todos" && p.escola_id !== entidadeFilter) return false;
      if (!except.has("entidadeFilho") && entidadeFilhoFilter !== "todos" && (p as any).entidade_filho_id !== entidadeFilhoFilter) return false;
      if (!except.has("formador") && formadorFilter !== "todos" && p.aap_id !== formadorFilter) return false;
      if (!except.has("consultor") && consultorFilter !== "todos" && p.aap_id !== consultorFilter) return false;
      if (!except.has("gpi") && gpiFilter !== "todos" && p.aap_id !== gpiFilter) return false;
      return true;
    },
    [programaFilter, tipoFilter, entidadeFilter, entidadeFilhoFilter, formadorFilter, consultorFilter, gpiFilter]
  );

  // Tipos disponíveis: presentes no scope após cruzar com os demais filtros.
  const availableTipoIds = useMemo(() => {
    const set = new Set<string>();
    scopedProgramacoes.forEach((p) => {
      if (passesUiFilters(p, new Set(["tipo"]))) set.add(p.tipo);
    });
    return set;
  }, [scopedProgramacoes, passesUiFilters]);

  // Entidades disponíveis (cruzando com os demais filtros).
  const availableEntidadeIds = useMemo(() => {
    const set = new Set<string>();
    scopedProgramacoes.forEach((p) => {
      if (passesUiFilters(p, new Set(["entidade", "entidadeFilho"]))) set.add(p.escola_id);
    });
    return set;
  }, [scopedProgramacoes, passesUiFilters]);

  // Entidades-filho disponíveis (cruzando com os demais filtros).
  const availableEntidadeFilhoIds = useMemo(() => {
    const set = new Set<string>();
    scopedProgramacoes.forEach((p) => {
      const ef = (p as any).entidade_filho_id;
      if (!ef) return;
      if (passesUiFilters(p, new Set(["entidadeFilho"]))) set.add(ef);
    });
    return set;
  }, [scopedProgramacoes, passesUiFilters]);

  // Helper: aap_ids elegíveis para um filtro de papel específico (formador/consultor/gpi).
  const aapIdsForRoleFilter = useCallback(
    (filterKey: "formador" | "consultor" | "gpi") => {
      const set = new Set<string>();
      scopedProgramacoes.forEach((p) => {
        if (!p.aap_id) return;
        if (passesUiFilters(p, new Set([filterKey]))) set.add(p.aap_id);
      });
      return set;
    },
    [scopedProgramacoes, passesUiFilters]
  );

  const availableFormadorIds = useMemo(() => aapIdsForRoleFilter("formador"), [aapIdsForRoleFilter]);
  const availableConsultorIds = useMemo(() => aapIdsForRoleFilter("consultor"), [aapIdsForRoleFilter]);
  const availableGpiIds = useMemo(() => aapIdsForRoleFilter("gpi"), [aapIdsForRoleFilter]);

  // Reset filtros que ficaram inválidos após cascata
  useEffect(() => {
    if (tipoFilter !== "todos" && !availableTipoIds.has(tipoFilter)) setTipoFilter("todos");
  }, [tipoFilter, availableTipoIds]);
  useEffect(() => {
    if (entidadeFilter !== "todos" && !availableEntidadeIds.has(entidadeFilter)) setEntidadeFilter("todos");
  }, [entidadeFilter, availableEntidadeIds]);
  useEffect(() => {
    if (entidadeFilhoFilter !== "todos" && !availableEntidadeFilhoIds.has(entidadeFilhoFilter)) setEntidadeFilhoFilter("todos");
  }, [entidadeFilhoFilter, availableEntidadeFilhoIds]);
  useEffect(() => {
    if (formadorFilter !== "todos" && !availableFormadorIds.has(formadorFilter)) setFormadorFilter("todos");
  }, [formadorFilter, availableFormadorIds]);
  useEffect(() => {
    if (consultorFilter !== "todos" && !availableConsultorIds.has(consultorFilter)) setConsultorFilter("todos");
  }, [consultorFilter, availableConsultorIds]);
  useEffect(() => {
    if (gpiFilter !== "todos" && !availableGpiIds.has(gpiFilter)) setGpiFilter("todos");
  }, [gpiFilter, availableGpiIds]);


  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return filteredProgramacoes.filter((p) => isSameDay(parseISO(p.data), date));
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const resetProgramacaoForm = () => {
    setEditingProgramacao(null);
    setFormData({
      tipo: creatableAcoes.filter((t) => t !== "acompanhamento_formacoes")[0] || "observacao_aula",
      titulo: "",
      descricao: "",
      data: "",
      horarioInicio: "",
      horarioFim: "",
      escolaId: "",
      aapId: "",
      segmento: "anos_iniciais",
      componente: "polivalente",
      anoSerie: "",
      programa:
        gestorProgramas.length > 0
          ? gestorProgramas
          : aapProgramas.length > 0
            ? aapProgramas
            : ["escolas" as ProgramaType],
      tags: "",
      tipoAtorPresenca: "todos",
      projetoNotion: "",
      local: "",
      turmaFormacao: "",
      publicoFormacao: "",
      projeto: "",
      componenteFormacaoRedes: "",
      nucleoDepartamento: "",
      observadorNome: "",
    });
    setFormEscolaFilhoId("");
    setFormTurmaRedes("");
    setFormAnoSerieRedes("");
    setFormModalidadeTarl("");
    setFormFrenteTrabalho("");
    setFormPublicoEncontro([]);
    setFormLocalEncontro("");
    setFormLocalEscolas([]);
    setFormLocalOutro("");
    setFormFechamento("");
    setFormEncaminhamentos("");
    setFormObservacoes("");
    setFormAvancos("");
    setFormDificuldades("");
    setFormApoioComponente("");
    setFormApoioEtapa("");
    setFormApoioEscolaVoar("");
    setFormApoioTurmaVoar("");
    setFormApoioProfessorId("");
    setFormApoioParticipantes([]);
    setFormApoioParticipantesOutros("");
    setFormApoioObsPlanejada("");
    setFormApoioFocos([]);
    setFormApoioDevolutiva("");
  };

  const canEditProgramacao = (prog: ProgramacaoDB) => {
    const role = profile?.role as import("@/contexts/AuthContext").AppRole | undefined;
    if (canUserEditAcao(role, prog.tipo)) return true;
    return !!user && (prog.aap_id === user.id || prog.created_by === user.id);
  };

  const handleOpenEditProgramacao = async (prog: ProgramacaoDB) => {
    setEditingProgramacao(prog);
    setFormData({
      tipo: prog.tipo,
      titulo: prog.titulo || "",
      descricao: prog.descricao || "",
      data: prog.data,
      horarioInicio: prog.horario_inicio,
      horarioFim: prog.horario_fim,
      escolaId: prog.escola_id,
      aapId: prog.aap_id,
      segmento: (prog.segmento as Segmento) || "anos_iniciais",
      componente: (prog.componente as ComponenteCurricular) || "polivalente",
      anoSerie: prog.ano_serie || "",
      programa: (prog.programa as ProgramaType[]) || [],
      tags: prog.tags?.join(", ") || "",
      tipoAtorPresenca: prog.tipo_ator_presenca || "todos",
      projetoNotion: prog.projeto_notion || "",
      local: prog.local || "",
      turmaFormacao: prog.turma_formacao || "",
      publicoFormacao: prog.publico_formacao || "",
      projeto: prog.projeto || "",
      componenteFormacaoRedes: (prog as any).componente_formacao_redes || "",
      nucleoDepartamento: (prog as any).nucleo_departamento || "",
      observadorNome: (prog as any).observador_nome || "",
    });
    setFormEscolaFilhoId(prog.entidade_filho_id || "");
    setFormAnoSerieRedes(
      prog.tipo === "observacao_aula_redes" ||
        prog.tipo === "visita_tecnica_alfabetizacao_redes" ||
        prog.tipo === "visita_tecnica_tarl"
        ? prog.ano_serie || ""
        : "",
    );
    setFormTurmaRedes("");
    setFormModalidadeTarl(prog.tipo === "visita_tecnica_tarl" ? ((prog as any).modalidade || "") : "");
    if (prog.tipo === "observacao_aula_redes") {
      const { data } = await supabase
        .from("registros_acao")
        .select("turma")
        .eq("programacao_id", prog.id)
        .limit(1)
        .maybeSingle();
      setFormTurmaRedes(data?.turma || "");
    } else if (
      prog.tipo === "visita_tecnica_alfabetizacao_redes" ||
      prog.tipo === "visita_tecnica_tarl"
    ) {
      setFormTurmaRedes(prog.turma_formacao || "");
    }
    // Carregar observacoes/avancos/dificuldades do registro vinculado, se existir
    {
      const { data: regData } = await supabase
        .from("registros_acao")
        .select("observacoes, avancos, dificuldades")
        .eq("programacao_id", prog.id)
        .limit(1)
        .maybeSingle();
      setFormObservacoes(regData?.observacoes || "");
      setFormAvancos(regData?.avancos || "");
      setFormDificuldades(regData?.dificuldades || "");
    }
    setFormFrenteTrabalho(prog.frente_trabalho || "");
    setFormPublicoEncontro(prog.publico_encontro || []);
    setFormLocalEncontro(prog.local_encontro || "");
    setFormLocalEscolas(prog.local_escolas || []);
    setFormLocalOutro(prog.local_outro || "");
    setFormFechamento(prog.fechamento || "");
    setFormEncaminhamentos(prog.encaminhamentos || "");
    setFormApoioComponente(prog.apoio_componente || "");
    setFormApoioEtapa(prog.apoio_etapa || "");
    setFormApoioEscolaVoar(prog.apoio_escola_voar === null || prog.apoio_escola_voar === undefined ? "" : prog.apoio_escola_voar ? "sim" : "nao");
    setFormApoioTurmaVoar(prog.apoio_turma_voar || "");
    setFormApoioProfessorId(prog.apoio_professor_id || "");
    setFormApoioParticipantes(prog.apoio_participantes || []);
    setFormApoioParticipantesOutros(prog.apoio_participantes_outros || "");
    setFormApoioObsPlanejada(prog.apoio_obs_planejada === null || prog.apoio_obs_planejada === undefined ? "" : prog.apoio_obs_planejada ? "sim" : "nao");
    setFormApoioFocos(prog.apoio_focos || []);
    setFormApoioDevolutiva(prog.apoio_devolutiva || "");
    setIsDialogOpen(true);
  };

  // Deep-link: abrir o cadastro de uma programação via ?editProgramacao={id}
  useEffect(() => {
    const editId = searchParams.get("editProgramacao");
    if (!editId || handledEditParamRef.current === editId || programacoes.length === 0) return;
    const prog = programacoes.find((p) => p.id === editId);
    if (!prog) return;
    handledEditParamRef.current = editId;
    handleOpenEditProgramacao(prog);
    const next = new URLSearchParams(searchParams);
    next.delete("editProgramacao");
    setSearchParams(next, { replace: true });
  }, [searchParams, programacoes, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(editingProgramacao ? "Você precisa estar logado para editar uma programação" : "Você precisa estar logado para criar uma programação");
      return;
    }

    // Validação de simulação
    if (
      !guardOperation(editingProgramacao ? "manage_programacao" : "create_programacao", {
        acaoTipo: formData.tipo,
        recordProgramas: formData.programa,
        recordEscolaId: formData.escolaId,
        recordAapId: editingProgramacao?.aap_id,
      })
    )
      return;

    if (editingProgramacao) {
      if (!canEditProgramacao(editingProgramacao)) {
        toast.error("Você não tem permissão para editar esta programação");
        return;
      }
    } else {
      const canCreate = canUserCreateAcao(profile?.role as import("@/contexts/AuthContext").AppRole, formData.tipo);
      if (!canCreate) {
        toast.error("Você não tem permissão para criar programações");
        return;
      }
      const programasDisponiveis = getProgramasForTipo(formData.tipo);
      if (!programasDisponiveis.length || !programasDisponiveis.includes(formData.programa[0])) {
        toast.error("Este formulário está inativo ou indisponível para o programa selecionado");
        return;
      }
    }

    if (!formData.data) {
      toast.error("Informe a data da ação");
      return;
    }

    if (!isValidDateInRange(formData.data)) {
      toast.error("Data inválida. Informe uma data entre 2000 e 2100.");
      return;
    }


    setIsSubmitting(true);

    try {
      // Use ACAO_FORM_CONFIG for field visibility
      const formConfig = ACAO_FORM_CONFIG[formData.tipo as AcaoTipo];
      const isFormacao = ["formacao", "acompanhamento_formacoes", "lista_presenca", "participa_formacoes"].includes(
        formData.tipo,
      );
      const showSegmento = formConfig?.showSegmento ?? false;
      const showComponente = formConfig?.showComponente ?? false;
      const showAnoSerie = formConfig?.showAnoSerie ?? false;
      const segmentoValue = showSegmento ? formData.segmento : "todos";
      const componenteValue = showComponente ? formData.componente : "todos";
      const anoSerieValue =
        formData.tipo === "observacao_aula_redes" ||
        formData.tipo === "visita_tecnica_alfabetizacao_redes" ||
        formData.tipo === "visita_tecnica_tarl"
          ? formAnoSerieRedes
          : showAnoSerie
            ? formData.anoSerie || (isFormacao ? "todos" : "")
            : "todos";

      if (formData.tipo === "observacao_aula_redes" && !formAnoSerieRedes) {
        toast.error("Selecione o Ano/Série");
        setIsSubmitting(false);
        return;
      }

      if (formData.tipo === "visita_tecnica_microciclos" && !formEscolaFilhoId) {
        toast.error("Selecione a Escola");
        setIsSubmitting(false);
        return;
      }

      if (formData.tipo === "reuniao_acomp_alfabetizacao" && !formEscolaFilhoId) {
        toast.error("Selecione a Escola");
        setIsSubmitting(false);
        return;
      }

      if (formData.tipo === "visita_tecnica_alfabetizacao" && !formEscolaFilhoId) {
        toast.error("Selecione a Escola");
        setIsSubmitting(false);
        return;
      }


      if (formData.tipo === "visita_tecnica_alfabetizacao_redes") {
        if (!formEscolaFilhoId) {
          toast.error("Selecione a Escola");
          setIsSubmitting(false);
          return;
        }
        if (!formAnoSerieRedes) {
          toast.error("Selecione o Ano");
          setIsSubmitting(false);
          return;
        }
        if (!formTurmaRedes) {
          toast.error("Selecione a Turma");
          setIsSubmitting(false);
          return;
        }
      }

      if (formData.tipo === "visita_tecnica_tarl") {
        if (!formEscolaFilhoId) {
          toast.error("Selecione a Escola");
          setIsSubmitting(false);
          return;
        }
        if (!formAnoSerieRedes) {
          toast.error("Selecione o Ano/Série");
          setIsSubmitting(false);
          return;
        }
        if (!formTurmaRedes) {
          toast.error("Selecione a Turma");
          setIsSubmitting(false);
          return;
        }
        if (!formModalidadeTarl) {
          toast.error("Selecione a Modalidade");
          setIsSubmitting(false);
          return;
        }
      }

      // Inserir programação e obter o ID
      const isMonitAcoes = formData.tipo === "monitoramento_acoes_formativas";
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const tituloFinal = formData.titulo;

      // Validação específica para monitoramento_acoes_formativas
      if (isMonitAcoes) {
        if (!formFrenteTrabalho) {
          toast.error("Selecione a frente de trabalho");
          setIsSubmitting(false);
          return;
        }
        if (formPublicoEncontro.length === 0) {
          toast.error("Selecione ao menos um público");
          setIsSubmitting(false);
          return;
        }
        if (!formLocalEncontro) {
          toast.error("Selecione o local do encontro");
          setIsSubmitting(false);
          return;
        }
        if (formLocalEncontro === "escolas" && formLocalEscolas.length === 0) {
          toast.error("Selecione ao menos uma escola");
          setIsSubmitting(false);
          return;
        }
      }

      // Validação específica para registro_apoio_presencial
      const isApoio = formData.tipo === "registro_apoio_presencial";
      if (isApoio) {
        if (!formApoioComponente) {
          toast.error("Selecione o componente da aula");
          setIsSubmitting(false);
          return;
        }
        if (!formApoioEtapa) {
          toast.error("Selecione a etapa de ensino");
          setIsSubmitting(false);
          return;
        }
        if (formApoioEscolaVoar === "") {
          toast.error("Informe se a escola é VOAR");
          setIsSubmitting(false);
          return;
        }
        if (formApoioEscolaVoar === "sim" && !formApoioTurmaVoar) {
          toast.error("Selecione a turma observada (VOAR)");
          setIsSubmitting(false);
          return;
        }
        if (formApoioObsPlanejada === "") {
          toast.error("Informe se a observação foi planejada");
          setIsSubmitting(false);
          return;
        }
        if (formApoioFocos.length === 0) {
          toast.error("Selecione ao menos um foco de observação");
          setIsSubmitting(false);
          return;
        }
        if (!formApoioDevolutiva) {
          toast.error("Selecione quando ocorrerá a devolutiva");
          setIsSubmitting(false);
          return;
        }
      }

      const insertData: any = {
        tipo: formData.tipo,
        titulo: tituloFinal,
        descricao: formData.descricao || null,
        data: formData.data,
        horario_inicio: formData.horarioInicio,
        horario_fim: formData.horarioFim,
        escola_id: formData.escolaId || null,
        aap_id: formData.aapId,
        segmento: segmentoValue,
        componente: componenteValue,
        ano_serie: anoSerieValue,
        status: "prevista",
        programa: formData.programa,
        tags: tagsArray.length > 0 ? tagsArray : null,
        created_by: user.id,
        tipo_ator_presenca: formData.tipo === "formacao" ? formData.tipoAtorPresenca || "todos" : null,
        projeto_notion: formData.tipo === "formacao" ? formData.projetoNotion || null : null,
        local:
          formData.tipo === "formacao" ||
          formData.tipo === "encontro_eteg_redes" ||
          formData.tipo === "encontro_professor_redes" ||
          formData.tipo === "encontro_microciclos_recomposicao"
            ? formData.local || null
            : null,
        turma_formacao:
          formData.tipo === "encontro_professor_redes" ||
          formData.tipo === "encontro_eteg_redes" ||
          formData.tipo === "encontro_microciclos_recomposicao"
            ? formData.turmaFormacao || null
            : formData.tipo === "visita_tecnica_alfabetizacao_redes" ||
              formData.tipo === "visita_tecnica_tarl"
              ? formTurmaRedes || null
              : null,
        publico_formacao: formData.tipo === "encontro_eteg_redes" ? formData.publicoFormacao || null : null,
        projeto:
          formData.tipo === "encontro_professor_redes" || formData.tipo === "encontro_eteg_redes"
            ? formData.projeto || null
            : null,
        componente_formacao_redes:
          formData.tipo === "encontro_professor_redes"
            ? formData.componenteFormacaoRedes || null
            : null,
        nucleo_departamento:
          formData.tipo === "visita_tecnica_secretaria_sme"
            ? formData.nucleoDepartamento || null
            : null,
        observador_nome:
          formData.tipo === "visita_tecnica_secretaria_sme"
            ? formData.observadorNome || null
            : null,
        modalidade: formData.tipo === "visita_tecnica_tarl" ? formModalidadeTarl || null : null,
        entidade_filho_id:
          (formData.tipo === "observacao_aula_redes" ||
            formData.tipo === "visita_tecnica_alfabetizacao_redes" ||
            formData.tipo === "visita_tecnica_tarl" ||
            formData.tipo === "visita_tecnica_microciclos" ||
            formData.tipo === "visita_tecnica_alfabetizacao" ||
            formData.tipo === "reuniao_acomp_alfabetizacao" ||
            (formData.tipo === "formacao" && formData.programa?.includes("regionais"))) &&
          formEscolaFilhoId
            ? formEscolaFilhoId
            : null,
        // Fechamento e encaminhamentos - não aplicáveis ao Monitoramento (são preenchidos no gerenciamento)
        fechamento: isMonitAcoes ? null : formFechamento || null,
        encaminhamentos: isMonitAcoes ? null : formEncaminhamentos || null,
        // Campos do Monitoramento de Ações Formativas
        ...(isMonitAcoes && {
          frente_trabalho: formFrenteTrabalho,
          publico_encontro: formPublicoEncontro,
          local_encontro: formLocalEncontro,
          local_escolas: formLocalEncontro === "escolas" ? formLocalEscolas : null,
          local_outro: formLocalEncontro === "outro" ? formLocalOutro : null,
        }),
        // Campos do Registro de Apoio Presencial — (C)
        ...(isApoio && {
          apoio_componente: formApoioComponente || null,
          apoio_etapa: formApoioEtapa || null,
          apoio_turma_voar: formApoioEscolaVoar === "sim" ? formApoioTurmaVoar || null : null,
          apoio_escola_voar: formApoioEscolaVoar === "" ? null : formApoioEscolaVoar === "sim",
          apoio_professor_id: formApoioProfessorId || null,
          apoio_participantes: formApoioParticipantes.length > 0 ? formApoioParticipantes : null,
          apoio_participantes_outros: formApoioParticipantes.includes("Outros")
            ? formApoioParticipantesOutros || null
            : null,
          apoio_obs_planejada: formApoioObsPlanejada === "" ? null : formApoioObsPlanejada === "sim",
          apoio_focos: formApoioFocos.length > 0 ? formApoioFocos : null,
          apoio_devolutiva: formApoioDevolutiva || null,
        }),
      } as any;

      // For observacao_aula_redes, store turma in the registro_acao turma field
      const turmaRedesValue = formData.tipo === "observacao_aula_redes" ? formTurmaRedes : null;

      if (editingProgramacao) {
        const updateData = { ...insertData, status: editingProgramacao.status };
        delete updateData.created_by;
        const { error: updateError } = await supabase
          .from("programacoes")
          .update(updateData)
          .eq("id", editingProgramacao.id);
        if (updateError) throw updateError;

        const registroPayload = {
          aap_id: formData.aapId,
          ano_serie: anoSerieValue,
          componente: componenteValue,
          data: formData.data,
          escola_id: formData.escolaId || null,
          programa: formData.programa,
          tags: tagsArray.length > 0 ? tagsArray : null,
          segmento: segmentoValue,
          tipo: formData.tipo,
          turma: turmaRedesValue || null,
          projeto:
            formData.tipo === "encontro_professor_redes" || formData.tipo === "encontro_eteg_redes"
              ? formData.projeto || null
              : null,
          componente_formacao_redes:
            formData.tipo === "encontro_professor_redes"
              ? formData.componenteFormacaoRedes || null
              : null,
          observacoes: isMonitAcoes ? null : formObservacoes || null,
          avancos: isMonitAcoes ? null : formAvancos || null,
          dificuldades: isMonitAcoes ? null : formDificuldades || null,
        };

        const { data: existingRegistro, error: registroLookupError } = await supabase
          .from("registros_acao")
          .select("id")
          .eq("programacao_id", editingProgramacao.id)
          .limit(1)
          .maybeSingle();
        if (registroLookupError) throw registroLookupError;

        if (existingRegistro) {
          const { error: registroUpdateError } = await supabase
            .from("registros_acao")
            .update(registroPayload)
            .eq("id", existingRegistro.id);
          if (registroUpdateError) throw registroUpdateError;
        } else {
          const { error: registroInsertError } = await supabase.from("registros_acao").insert({
            ...registroPayload,
            programacao_id: editingProgramacao.id,
            status: editingProgramacao.status === "prevista" ? "agendada" : editingProgramacao.status,
          });
          if (registroInsertError) throw registroInsertError;
        }

        toast.success("Ação atualizada com sucesso!");
        setIsDialogOpen(false);
        resetProgramacaoForm();
        fetchProgramacoes();
        return;
      }

      const { data: newProgramacao, error } = await supabase.from("programacoes").insert(insertData).select().single();

      if (error) throw error;

      // Criar registro_acao correspondente com status 'agendada'
      const { error: registroError } = await supabase.from("registros_acao").insert({
        aap_id: formData.aapId,
        ano_serie: anoSerieValue,
        componente: componenteValue,
        data: formData.data,
        escola_id: formData.escolaId || null,
        programa: formData.programa,
        tags: tagsArray.length > 0 ? tagsArray : null,
        programacao_id: newProgramacao.id,
        segmento: segmentoValue,
        tipo: formData.tipo,
        status: "agendada",
        turma: turmaRedesValue || null,
        projeto:
          formData.tipo === "encontro_professor_redes" || formData.tipo === "encontro_eteg_redes"
            ? formData.projeto || null
            : null,
        componente_formacao_redes:
          formData.tipo === "encontro_professor_redes"
            ? formData.componenteFormacaoRedes || null
            : null,
      });

      if (registroError) {
        console.error("Error creating registro_acao:", registroError);
      }

      toast.success("Ação programada com sucesso!");
      setIsDialogOpen(false);
      resetProgramacaoForm();
      fetchProgramacoes();
    } catch (error: any) {
      console.error(editingProgramacao ? "Error updating programacao:" : "Error creating programacao:", error);
      const detail = error?.message || error?.error_description || error?.details;
      toast.error(detail ? `Erro ao ${editingProgramacao ? "editar" : "criar"} programação: ${detail}` : `Erro ao ${editingProgramacao ? "editar" : "criar"} programação`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenManageDialog = (prog: ProgramacaoDB) => {
    setSelectedProgramacao(prog);
    setAcaoRealizada(null);
    setMotivoCancelamento("");
    setReagendar(false);
    setNovaData("");
    setNovoHorarioInicio("");
    setNovoHorarioFim("");
    setAgendarAcompanhamento(false);
    setAcompanhamentoData("");
    setAcompanhamentoHorarioInicio("");
    setAcompanhamentoHorarioFim("");
    setAcompanhamentoAapId("");
    setAtoresElegiveis([]);
    setIsManageDialogOpen(true);
  };

  const handleOpenAcompanhamentoDialog = (prog: ProgramacaoDB) => {
    setSelectedProgramacao(prog);
    setAcaoRealizada(true);
    setMotivoCancelamento("");
    setReagendar(false);
    setNovaData("");
    setNovoHorarioInicio("");
    setNovoHorarioFim("");
    setAgendarAcompanhamento(true);
    setAcompanhamentoData(prog.data);
    setAcompanhamentoHorarioInicio(prog.horario_inicio);
    setAcompanhamentoHorarioFim(prog.horario_fim);
    setAcompanhamentoAapId("");
    setAtoresElegiveis([]);
    setIsManageDialogOpen(true);
  };

  // Reabrir o formulário de uma ação já realizada para edição.
  // Configura o estado como "Sim, aconteceu" e pula o passo de pergunta,
  // delegando o roteamento de tipo ao handleManageSubmit (que pré-carrega os dados existentes).
  const handleOpenEditRealizada = (prog: ProgramacaoDB) => {
    setSelectedProgramacao(prog);
    setAcaoRealizada(true);
    setMotivoCancelamento("");
    setReagendar(false);
    setNovaData("");
    setNovoHorarioInicio("");
    setNovoHorarioFim("");
    setAgendarAcompanhamento(false);
    setAcompanhamentoData("");
    setAcompanhamentoHorarioInicio("");
    setAcompanhamentoHorarioFim("");
    setAcompanhamentoAapId("");
    setAtoresElegiveis([]);
    setPendingEditRealizada(true);
  };

  // Roteador unificado: o botão "Editar" abre o formulário próprio da ação,
  // pré-preenchido para realizadas; pergunta "aconteceu?" para previstas;
  // e cai no diálogo de metadados apenas para canceladas.
  const handleEditAcaoClick = (prog: ProgramacaoDB) => {
    if (prog.status === "realizada") return handleOpenEditRealizada(prog);
    if (prog.status === "prevista") return handleOpenManageDialog(prog);
    return handleOpenEditProgramacao(prog);
  };

  // Quando handleOpenEditRealizada finalizar a configuração de estado, dispara o submit
  // que executa o roteamento por tipo (presença, instrumento, consultoria, monitoramento, etc.).
  useEffect(() => {
    if (pendingEditRealizada && selectedProgramacao && acaoRealizada === true) {
      setPendingEditRealizada(false);
      void handleManageSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEditRealizada, selectedProgramacao, acaoRealizada]);

  const handleManageSubmit = async () => {
    if (!selectedProgramacao || acaoRealizada === null) return;

    // Validação de simulação
    if (
      !guardOperation("manage_programacao", {
        acaoTipo: selectedProgramacao.tipo,
        recordProgramas: selectedProgramacao.programa || [],
        recordEscolaId: selectedProgramacao.escola_id,
        recordAapId: selectedProgramacao.aap_id,
      })
    )
      return;

    if (!acaoRealizada && !motivoCancelamento.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    if (reagendar && (!novaData || !novoHorarioInicio || !novoHorarioFim)) {
      toast.error("Preencha os dados do reagendamento");
      return;
    }

    // Validação de acompanhamento movida para depois dos redirects de tipo específico

    // Se for observação de aula e a ação foi realizada, abrir seleção de questões e depois formulário por professor
    if (
      (selectedProgramacao.tipo === "acompanhamento_aula" || selectedProgramacao.tipo === "observacao_aula") &&
      acaoRealizada
    ) {
      setIsLoadingProfessores(true);
      try {
        // Buscar professores da mesma escola, segmento, ano/série e componente
        const { data: profs, error } = await supabase
          .from("professores")
          .select("id, nome, escola_id, segmento, componente, ano_serie, cargo")
          .eq("escola_id", selectedProgramacao.escola_id)
          .eq("segmento", selectedProgramacao.segmento)
          .eq("ano_serie", selectedProgramacao.ano_serie)
          .eq("componente", selectedProgramacao.componente)
          .eq("ativo", true)
          .order("nome");

        if (error) throw error;

        setProfessoresAvaliacao(profs || []);

        // Pré-carregar respostas existentes por professor + questões selecionadas (edição de realizada)
        const initialResponses: Record<string, Record<string, any>> = {};
        (profs || []).forEach((p) => {
          initialResponses[p.id] = {};
        });

        let preloadedQuestionKeys: string[] | null = null;
        try {
          const { data: existingReg } = await supabase
            .from("registros_acao")
            .select("id")
            .eq("programacao_id", selectedProgramacao.id)
            .limit(1)
            .maybeSingle();
          if (existingReg?.id) {
            const { data: existingResponses } = await supabase
              .from("instrument_responses")
              .select("professor_id, responses, questoes_selecionadas")
              .eq("registro_acao_id", existingReg.id)
              .eq("form_type", normalizeAcaoTipo(selectedProgramacao.tipo));
            (existingResponses || []).forEach((row: any) => {
              if (row.professor_id) {
                initialResponses[row.professor_id] = (row.responses as Record<string, any>) || {};
              }
              if (!preloadedQuestionKeys && Array.isArray(row.questoes_selecionadas)) {
                preloadedQuestionKeys = (row.questoes_selecionadas as any[])
                  .map((q) => (typeof q === "string" ? q : q?.field_key))
                  .filter(Boolean);
              }
            });
          }
        } catch (err) {
          console.error("Error preloading per-professor responses:", err);
        }

        setPerProfessorResponses(initialResponses);

        // Setup question selection - usar pré-carregadas se houver, senão obrigatórias
        const requiredKeys = obsAulaFields.filter((f) => f.is_required).map((f) => f.field_key);
        setSelectedQuestionKeys(preloadedQuestionKeys && preloadedQuestionKeys.length > 0 ? preloadedQuestionKeys : requiredKeys);
        setQuestionSelectionDone(false);

        setSelectedProfessorAvaliacao(null);
        setTurma("");
        setObservacoesAcompanhamento("");
        setIsManageDialogOpen(false);
        setShowQuestionSelection(true);
      } catch (error) {
        console.error("Error fetching professores:", error);
        toast.error("Erro ao carregar professores");
      } finally {
        setIsLoadingProfessores(false);
      }
      return;
    }

    // Se a formação JÁ está realizada e o usuário quer apenas agendar acompanhamento, processar direto
    if (
      selectedProgramacao.status === "realizada" &&
      selectedProgramacao.tipo === "formacao" &&
      agendarAcompanhamento &&
      acaoRealizada
    ) {
      setIsSubmitting(true);
      try {
        if (!acompanhamentoAapId) {
          toast.error("Selecione o ator responsável pelo acompanhamento");
          return;
        }
        const { error: acompProgError } = await supabase.from("programacoes").insert({
          tipo: "acompanhamento_formacoes",
          titulo: `Acompanhamento: ${selectedProgramacao.titulo}`,
          data: acompanhamentoData,
          horario_inicio: acompanhamentoHorarioInicio,
          horario_fim: acompanhamentoHorarioFim,
          escola_id: selectedProgramacao.escola_id,
          aap_id: acompanhamentoAapId,
          segmento: selectedProgramacao.segmento,
          componente: selectedProgramacao.componente,
          ano_serie: selectedProgramacao.ano_serie,
          programa: selectedProgramacao.programa,
          formacao_origem_id: selectedProgramacao.id,
          status: "prevista",
        });
        if (acompProgError) throw acompProgError;
        toast.success("Acompanhamento de Formação agendado com sucesso!");
        setIsManageDialogOpen(false);
        fetchProgramacoes();
      } catch (error) {
        console.error("Error scheduling acompanhamento:", error);
        toast.error("Erro ao agendar acompanhamento");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Se for formação e a ação foi realizada, abrir formulário de presença
    const TIPOS_COM_PRESENCA = [
      "formacao",
      "lista_presenca",
      "participa_formacoes",
      "encontro_eteg_redes",
      "encontro_professor_redes",
      "encontro_microciclos_recomposicao",
    ];
    if (TIPOS_COM_PRESENCA.includes(selectedProgramacao.tipo) && acaoRealizada) {
      setIsLoadingProfessores(true);
      try {
        const isRedesTipo = [
          "encontro_eteg_redes",
          "encontro_professor_redes",
          "encontro_microciclos_recomposicao",
        ].includes(selectedProgramacao.tipo);

        // Buscar professores da mesma escola, filtrando por componente/segmento/ano_serie apenas para professores
        const tipoAtor = selectedProgramacao.tipo_ator_presenca;
        const isCargoAdministrativo = tipoAtor && tipoAtor !== "todos" && tipoAtor !== "professor";

        let query = supabase
          .from("professores")
          .select("id, nome, escola_id, segmento, componente, ano_serie, cargo, turma_formacao")
          .eq("escola_id", selectedProgramacao.escola_id)
          .eq("ativo", true);

        // Para REDES, filtrar por turma_formacao se especificada na programação
        if (isRedesTipo && selectedProgramacao.turma_formacao) {
          // turma_formacao na programação é string com turmas separadas por vírgula
          const turmas = selectedProgramacao.turma_formacao.split(",").map((t: string) => t.trim());
          query = query.in("turma_formacao", turmas);
        } else if (!isCargoAdministrativo && !isRedesTipo) {
          // Filtros acadêmicos: apenas para tipos não-REDES
          query = query.eq("componente", selectedProgramacao.componente);

          if (selectedProgramacao.segmento !== "todos") {
            query = query.eq("segmento", selectedProgramacao.segmento);
          }

          if (selectedProgramacao.ano_serie !== "todos") {
            query = query.eq("ano_serie", selectedProgramacao.ano_serie);
          }
        }

        // Filtro por cargo quando tipo_ator_presenca for específico
        if (tipoAtor && tipoAtor !== "todos") {
          query = query.eq("cargo", tipoAtor);
        }

        const { data: profs, error } = await query.order("nome");

        if (error) throw error;

        setProfessoresPresenca(profs || []);

        // Buscar registro existente para pré-carregar campos quando a ação já foi realizada/preenchida
        const { data: existingRegistro } = await supabase
          .from("registros_acao")
          .select("id, observacoes, avancos, dificuldades")
          .eq("programacao_id", selectedProgramacao.id)
          .limit(1)
          .maybeSingle();

        // Carregar presenças existentes
        let existingPresencas: { professor_id: string; presente: boolean }[] = [];
        if (existingRegistro?.id) {
          const { data: presData } = await supabase
            .from("presencas")
            .select("professor_id, presente")
            .eq("registro_acao_id", existingRegistro.id);
          existingPresencas = presData || [];
        }
        const presencaMap = new Map(existingPresencas.map((p) => [p.professor_id, p.presente]));

        // Inicializar lista de presenças usando dados existentes (default: presente)
        setPresencaList(
          (profs || []).map((p) => ({
            professorId: p.id,
            presente: presencaMap.get(p.id) ?? true,
          })),
        );

        setObservacoesFormacao(existingRegistro?.observacoes || "");
        setAvancosFormacao(existingRegistro?.avancos || "");
        setDificuldadesFormacao(existingRegistro?.dificuldades || "");

        // Pré-carregar respostas do instrumento pedagógico (encontros REDES, formação etc.)
        let existingInstrumentResponses: Record<string, any> = {};
        if (existingRegistro?.id) {
          const { data: instData } = await supabase
            .from("instrument_responses")
            .select("responses")
            .eq("registro_acao_id", existingRegistro.id)
            .eq("form_type", normalizeAcaoTipo(selectedProgramacao.tipo))
            .maybeSingle();
          existingInstrumentResponses = (instData?.responses as Record<string, any>) || {};
        }
        setInstrumentResponses(existingInstrumentResponses);
        setIsManageDialogOpen(false);
        setIsPresencaDialogOpen(true);
      } catch (error) {
        console.error("Error fetching professores:", error);
        toast.error("Erro ao carregar professores");
      } finally {
        setIsLoadingProfessores(false);
      }
      return;
    }

    // Se for tipo de instrumento pedagógico (sem presença/avaliação por professor) e a ação foi realizada
    const INSTRUMENT_TYPE_SET = new Set<string>(INSTRUMENT_FORM_TYPES.map((t) => t.value));
    const PRESENCE_CHECK = new Set<string>([
      "formacao",
      "lista_presenca",
      "participa_formacoes",
      "encontro_eteg_redes",
      "encontro_professor_redes",
      "encontro_microciclos_recomposicao",
    ]);
    const AVALIACAO_CHECK = new Set<string>(["acompanhamento_aula", "observacao_aula"]);
    const normalizedTipo = normalizeAcaoTipo(selectedProgramacao.tipo);

    // Se for consultoria pedagógica e realizada, abrir formulário dedicado
    if (selectedProgramacao.tipo === "registro_consultoria_pedagogica" && acaoRealizada) {
      setIsSubmitting(true);
      try {
        const { data: existingReg } = await supabase
          .from("registros_acao")
          .select("id")
          .eq("programacao_id", selectedProgramacao.id)
          .limit(1)
          .maybeSingle();
        let regId: string;
        if (existingReg) {
          regId = existingReg.id;
        } else {
          const { data: newReg, error: regErr } = await supabase
            .from("registros_acao")
            .insert({
              aap_id: user.id,
              ano_serie: selectedProgramacao.ano_serie,
              componente: selectedProgramacao.componente,
              data: selectedProgramacao.data,
              escola_id: selectedProgramacao.escola_id,
              programa: selectedProgramacao.programa,
              programacao_id: selectedProgramacao.id,
              segmento: selectedProgramacao.segmento,
              tipo: selectedProgramacao.tipo,
              status: "prevista",
            })
            .select("id")
            .single();
          if (regErr) throw regErr;
          regId = newReg.id;
        }
        setConsultoriaRegistroId(regId);
        setIsManageDialogOpen(false);
        setIsConsultoriaDialogOpen(true);
      } catch (err) {
        console.error("Error preparing consultoria:", err);
        toast.error("Erro ao preparar formulário de consultoria");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Monitoramento de Ações Formativas (Regionais): fluxo dedicado (5 perguntas + rubrica)
    if (selectedProgramacao.tipo === "monitoramento_acoes_formativas" && acaoRealizada) {
      setIsSubmitting(true);
      try {
        const { data: existingReg } = await supabase
          .from("registros_acao")
          .select("id")
          .eq("programacao_id", selectedProgramacao.id)
          .limit(1)
          .maybeSingle();
        let regId: string;
        if (existingReg) {
          regId = existingReg.id;
        } else {
          const { data: newReg, error: regErr } = await supabase
            .from("registros_acao")
            .insert({
              aap_id: user.id,
              ano_serie: selectedProgramacao.ano_serie,
              componente: selectedProgramacao.componente,
              data: selectedProgramacao.data,
              escola_id: selectedProgramacao.escola_id,
              programa: selectedProgramacao.programa,
              programacao_id: selectedProgramacao.id,
              segmento: selectedProgramacao.segmento,
              tipo: selectedProgramacao.tipo,
              status: "prevista",
            })
            .select("id")
            .single();
          if (regErr) throw regErr;
          regId = newReg.id;
        }
        setMonitRegionaisRegistroId(regId);
        setIsManageDialogOpen(false);
        setIsMonitRegionaisManaging(true);
      } catch (err: any) {
        console.error("Error preparing monitoramento regionais:", err);
        toast.error(err?.message || "Erro ao preparar monitoramento");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Monitoramento e Gestão (Regionais) — formulário dedicado
    if (selectedProgramacao.tipo === "monitoramento_gestao" && acaoRealizada) {
      setIsSubmitting(true);
      try {
        const { data: existingReg } = await supabase
          .from("registros_acao")
          .select("id")
          .eq("programacao_id", selectedProgramacao.id)
          .limit(1)
          .maybeSingle();
        let regId: string;
        if (existingReg) {
          regId = existingReg.id;
        } else {
          const { data: newReg, error: regErr } = await supabase
            .from("registros_acao")
            .insert({
              aap_id: user.id,
              ano_serie: selectedProgramacao.ano_serie,
              componente: selectedProgramacao.componente,
              data: selectedProgramacao.data,
              escola_id: selectedProgramacao.escola_id,
              programa: selectedProgramacao.programa,
              programacao_id: selectedProgramacao.id,
              segmento: selectedProgramacao.segmento,
              tipo: selectedProgramacao.tipo,
              status: "prevista",
            })
            .select("id")
            .single();
          if (regErr) throw regErr;
          regId = newReg.id;
        }

        // Marcar a programação como realizada (será revertida se o usuário fechar sem salvar)
        await supabase.from("programacoes").update({ status: "realizada" }).eq("id", selectedProgramacao.id);

        // Pré-carregar respostas existentes (caso reabertura)
        let initial: Record<string, any> | null = null;
        let hadSavedResponse = false;
        const { data: existingResp } = await supabase
          .from("instrument_responses")
          .select("id, responses")
          .eq("registro_acao_id", regId)
          .eq("form_type", "monitoramento_gestao")
          .limit(1)
          .maybeSingle();
        if (existingResp?.id) {
          hadSavedResponse = true;
          initial = (existingResp.responses as Record<string, any>) || null;
        }

        setMonitGestaoRegistroId(regId);
        setMonitGestaoInitial(initial);
        setInstrumentHadSavedResponse(hadSavedResponse);
        setIsManageDialogOpen(false);
        setIsMonitGestaoManaging(true);
      } catch (err: any) {
        console.error("Error preparing monitoramento gestao:", err);
        toast.error(err?.message || "Erro ao preparar formulário");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Visitas Técnicas - Microciclos (observacao_aula_redes) — formulário dedicado
    if (selectedProgramacao.tipo === "observacao_aula_redes" && acaoRealizada) {
      setIsSubmitting(true);
      try {
        const { data: existingReg } = await supabase
          .from("registros_acao")
          .select("id")
          .eq("programacao_id", selectedProgramacao.id)
          .limit(1)
          .maybeSingle();
        let regId: string;
        if (existingReg) {
          regId = existingReg.id;
        } else {
          const { data: newReg, error: regErr } = await supabase
            .from("registros_acao")
            .insert({
              aap_id: user.id,
              ano_serie: selectedProgramacao.ano_serie,
              componente: selectedProgramacao.componente,
              data: selectedProgramacao.data,
              escola_id: selectedProgramacao.escola_id,
              programa: selectedProgramacao.programa,
              programacao_id: selectedProgramacao.id,
              segmento: selectedProgramacao.segmento,
              tipo: selectedProgramacao.tipo,
              status: "prevista",
            })
            .select("id")
            .single();
          if (regErr) throw regErr;
          regId = newReg.id;
        }
        setRedesRegistroId(regId);
        setIsManageDialogOpen(false);
        setIsRedesManaging(true);
      } catch (err: any) {
        console.error("Error preparing visita tecnica microciclos:", err);
        toast.error(err?.message || "Erro ao preparar formulário");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Visita Técnica — Alfabetização (REDES) — formulário dedicado
    if (selectedProgramacao.tipo === "visita_tecnica_alfabetizacao_redes" && acaoRealizada) {
      setIsSubmitting(true);
      try {
        const { data: existingReg } = await supabase
          .from("registros_acao")
          .select("id")
          .eq("programacao_id", selectedProgramacao.id)
          .limit(1)
          .maybeSingle();
        let regId: string;
        if (existingReg) {
          regId = existingReg.id;
        } else {
          const { data: newReg, error: regErr } = await supabase
            .from("registros_acao")
            .insert({
              aap_id: user.id,
              ano_serie: selectedProgramacao.ano_serie,
              componente: selectedProgramacao.componente,
              data: selectedProgramacao.data,
              escola_id: selectedProgramacao.escola_id,
              programa: selectedProgramacao.programa,
              programacao_id: selectedProgramacao.id,
              segmento: selectedProgramacao.segmento,
              tipo: selectedProgramacao.tipo,
              status: "prevista",
            })
            .select("id")
            .single();
          if (regErr) throw regErr;
          regId = newReg.id;
        }
        setAlfabRegistroId(regId);
        setIsManageDialogOpen(false);
        setIsAlfabManaging(true);
      } catch (err: any) {
        console.error("Error preparing visita tecnica alfabetizacao:", err);
        toast.error(err?.message || "Erro ao preparar formulário");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Visita Técnica — T@RL — formulário dedicado
    if (selectedProgramacao.tipo === "visita_tecnica_tarl" && acaoRealizada) {
      setIsSubmitting(true);
      try {
        const { data: existingReg } = await supabase
          .from("registros_acao")
          .select("id")
          .eq("programacao_id", selectedProgramacao.id)
          .limit(1)
          .maybeSingle();
        let regId: string;
        if (existingReg) {
          regId = existingReg.id;
        } else {
          const { data: newReg, error: regErr } = await supabase
            .from("registros_acao")
            .insert({
              aap_id: user.id,
              ano_serie: selectedProgramacao.ano_serie,
              componente: selectedProgramacao.componente,
              data: selectedProgramacao.data,
              escola_id: selectedProgramacao.escola_id,
              programa: selectedProgramacao.programa,
              programacao_id: selectedProgramacao.id,
              segmento: selectedProgramacao.segmento,
              tipo: selectedProgramacao.tipo,
              status: "prevista",
              turma: selectedProgramacao.turma_formacao,
              modalidade: (selectedProgramacao as any).modalidade,
            })
            .select("id")
            .single();
          if (regErr) throw regErr;
          regId = newReg.id;
        }
        setTarlRegistroId(regId);
        setIsManageDialogOpen(false);
        setIsTarlManaging(true);
      } catch (err: any) {
        console.error("Error preparing visita tecnica tarl:", err);
        toast.error(err?.message || "Erro ao preparar formulário");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }





    // Observação de Aula (GPA) — formulário dedicado
    if (selectedProgramacao.tipo === "observacao_aula_gpa" && acaoRealizada) {
      setIsSubmitting(true);
      try {
        const { data: existingReg } = await supabase
          .from("registros_acao")
          .select("id")
          .eq("programacao_id", selectedProgramacao.id)
          .limit(1)
          .maybeSingle();
        let regId: string;
        if (existingReg) {
          regId = existingReg.id;
        } else {
          const { data: newReg, error: regErr } = await supabase
            .from("registros_acao")
            .insert({
              aap_id: user.id,
              ano_serie: selectedProgramacao.ano_serie,
              componente: selectedProgramacao.componente,
              data: selectedProgramacao.data,
              escola_id: selectedProgramacao.escola_id,
              programa: selectedProgramacao.programa,
              programacao_id: selectedProgramacao.id,
              segmento: selectedProgramacao.segmento,
              tipo: selectedProgramacao.tipo,
              status: "prevista",
            })
            .select("id")
            .single();
          if (regErr) throw regErr;
          regId = newReg.id;
        }
        setGpaRegistroId(regId);
        setIsManageDialogOpen(false);
        setIsGpaManaging(true);
      } catch (err: any) {
        console.error("Error preparing observação de aula GPA:", err);
        toast.error(err?.message || "Erro ao preparar formulário");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (
      acaoRealizada &&
      INSTRUMENT_TYPE_SET.has(normalizedTipo) &&
      !PRESENCE_CHECK.has(selectedProgramacao.tipo) &&
      !AVALIACAO_CHECK.has(selectedProgramacao.tipo)
    ) {
      // Pré-carregar respostas do instrumento, se já houver registro/respostas existentes
      let preloaded: Record<string, any> = {};
      let hadSavedResponse = false;
      try {
        const { data: existingReg } = await supabase
          .from("registros_acao")
          .select("id")
          .eq("programacao_id", selectedProgramacao.id)
          .limit(1)
          .maybeSingle();
        if (existingReg?.id) {
          const { data: instData } = await supabase
            .from("instrument_responses")
            .select("id, responses")
            .eq("registro_acao_id", existingReg.id)
            .eq("form_type", normalizedTipo)
            .limit(1)
            .maybeSingle();
          if (instData?.id) {
            hadSavedResponse = true;
            preloaded = (instData.responses as Record<string, any>) || {};
          }
        }
      } catch (err) {
        console.error("Error preloading instrument responses:", err);
      }
      setInstrumentResponses(preloaded);
      setInstrumentHadSavedResponse(hadSavedResponse);
      setIsManageDialogOpen(false);
      setIsInstrumentDialogOpen(true);
      return;
    }

    // Validação de acompanhamento — roda apenas no fluxo genérico (após redirects de tipo específico)
    if (agendarAcompanhamento && (!acompanhamentoData || !acompanhamentoHorarioInicio || !acompanhamentoHorarioFim)) {
      toast.error("Preencha os dados do acompanhamento");
      return;
    }

    if (agendarAcompanhamento && !acompanhamentoAapId) {
      toast.error("Selecione o ator responsável pelo acompanhamento");
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine status
      const newStatus = acaoRealizada ? "realizada" : reagendar ? "reagendada" : "cancelada";

      // Update programacao status
      const { error: updateError } = await supabase
        .from("programacoes")
        .update({
          status: newStatus,
          motivo_cancelamento: acaoRealizada ? null : motivoCancelamento,
        })
        .eq("id", selectedProgramacao.id);

      if (updateError) throw updateError;

      // Update existing registro_acao (created when programacao was created) or create new one
      // First, check if a registro already exists for this programacao
      const { data: existingRegistro } = await supabase
        .from("registros_acao")
        .select("id")
        .eq("programacao_id", selectedProgramacao.id)
        .limit(1)
        .maybeSingle();

      if (existingRegistro) {
        // Update existing registro
        const { error: updateRegistroError } = await supabase
          .from("registros_acao")
          .update({
            status: newStatus,
            is_reagendada: reagendar,
            reagendada_para: reagendar ? novaData : null,
          })
          .eq("id", existingRegistro.id);

        if (updateRegistroError) {
          console.error("Error updating registro:", updateRegistroError);
        }
      } else {
        // Create new registro (for backwards compatibility with old programacoes)
        const { error: registroError } = await supabase.from("registros_acao").insert({
          aap_id: selectedProgramacao.aap_id,
          ano_serie: selectedProgramacao.ano_serie,
          componente: selectedProgramacao.componente,
          data: selectedProgramacao.data,
          escola_id: selectedProgramacao.escola_id,
          programa: selectedProgramacao.programa,
          programacao_id: selectedProgramacao.id,
          segmento: selectedProgramacao.segmento,
          tipo: selectedProgramacao.tipo,
          status: newStatus,
          is_reagendada: reagendar,
          reagendada_para: reagendar ? novaData : null,
        });

        if (registroError) {
          console.error("Error creating registro:", registroError);
        }
      }

      // If reagendar, create new programacao and corresponding registro_acao
      if (reagendar && !acaoRealizada) {
        const { data: newProg, error: insertError } = await supabase
          .from("programacoes")
          .insert({
            tipo: selectedProgramacao.tipo,
            titulo: selectedProgramacao.titulo,
            descricao: selectedProgramacao.descricao,
            data: novaData,
            horario_inicio: novoHorarioInicio,
            horario_fim: novoHorarioFim,
            escola_id: selectedProgramacao.escola_id,
            aap_id: selectedProgramacao.aap_id,
            segmento: selectedProgramacao.segmento,
            componente: selectedProgramacao.componente,
            ano_serie: selectedProgramacao.ano_serie,
            status: "prevista",
            programa: selectedProgramacao.programa,
            created_by: user?.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Create corresponding registro_acao for the new programacao
        if (newProg) {
          await supabase.from("registros_acao").insert({
            aap_id: selectedProgramacao.aap_id,
            ano_serie: selectedProgramacao.ano_serie,
            componente: selectedProgramacao.componente,
            data: novaData,
            escola_id: selectedProgramacao.escola_id,
            programa: selectedProgramacao.programa,
            programacao_id: newProg.id,
            segmento: selectedProgramacao.segmento,
            tipo: selectedProgramacao.tipo,
            status: "agendada",
          });
        }

        toast.success("Ação cancelada e reagendada com sucesso!", {
          description: `Nova data: ${format(new Date(novaData), "dd/MM/yyyy", { locale: ptBR })}`,
        });
      } else if (acaoRealizada) {
        // Criar acompanhamento de formação se solicitado
        if (agendarAcompanhamento && selectedProgramacao.tipo === "formacao") {
          const { data: acompProg, error: acompProgError } = await supabase
            .from("programacoes")
            .insert({
              tipo: "acompanhamento_formacoes",
              titulo: `Acompanhamento: ${selectedProgramacao.titulo}`,
              data: acompanhamentoData,
              horario_inicio: acompanhamentoHorarioInicio,
              horario_fim: acompanhamentoHorarioFim,
              escola_id: selectedProgramacao.escola_id,
              aap_id: acompanhamentoAapId,
              segmento: selectedProgramacao.segmento,
              componente: selectedProgramacao.componente,
              ano_serie: selectedProgramacao.ano_serie,
              status: "prevista",
              programa: selectedProgramacao.programa,
              formacao_origem_id: selectedProgramacao.id,
              created_by: user?.id,
            })
            .select()
            .single();

          if (acompProgError) throw acompProgError;

          if (acompProg) {
            await supabase.from("registros_acao").insert({
              aap_id: acompanhamentoAapId,
              ano_serie: selectedProgramacao.ano_serie,
              componente: selectedProgramacao.componente,
              data: acompanhamentoData,
              escola_id: selectedProgramacao.escola_id,
              programa: selectedProgramacao.programa,
              programacao_id: acompProg.id,
              segmento: selectedProgramacao.segmento,
              tipo: "acompanhamento_formacoes",
              status: "agendada",
              formacao_origem_id: selectedProgramacao.id,
            });
          }

          toast.success("Ação realizada e acompanhamento agendado!", {
            description: `Acompanhamento em ${format(new Date(acompanhamentoData), "dd/MM/yyyy", { locale: ptBR })}`,
          });
        } else {
          toast.success("Ação marcada como realizada!");
        }
      } else {
        toast.success("Ação marcada como cancelada");
      }

      setIsManageDialogOpen(false);
      setSelectedProgramacao(null);
      fetchProgramacoes();
    } catch (error) {
      console.error("Error updating programacao:", error);
      toast.error("Erro ao atualizar programação");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Question items for observation instrument - use instrument_fields.is_required
  const questionItems: QuestionItem[] = useMemo(
    () =>
      obsAulaFields.map((f) => ({
        key: f.field_key,
        label: f.label,
        type: f.field_type,
        required: f.is_required,
        enabled: true,
      })),
    [obsAulaFields],
  );

  const handleConfirmQuestionSelection = () => {
    setShowQuestionSelection(false);
    setQuestionSelectionDone(true);
    setIsAvaliacaoDialogOpen(true);
  };

  const handleProfessorResponseChange = (professorId: string, fieldKey: string, value: any) => {
    setPerProfessorResponses((prev) => ({
      ...prev,
      [professorId]: { ...(prev[professorId] || {}), [fieldKey]: value },
    }));
  };

  // Handler para salvar avaliações de acompanhamento de aula (instrument-based)
  const handleSaveAvaliacoes = async () => {
    if (!selectedProgramacao || !user) return;

    // Validação de simulação
    if (
      !guardOperation("save_avaliacoes", {
        acaoTipo: selectedProgramacao.tipo,
        recordProgramas: selectedProgramacao.programa || [],
        recordEscolaId: selectedProgramacao.escola_id,
        recordAapId: selectedProgramacao.aap_id,
      })
    )
      return;

    setIsSubmitting(true);

    try {
      // Atualizar status da programação
      const { error: updateProgError } = await supabase
        .from("programacoes")
        .update({ status: "realizada" })
        .eq("id", selectedProgramacao.id);

      if (updateProgError) throw updateProgError;

      // Verificar se existe registro_acao
      const { data: existingRegistro } = await supabase
        .from("registros_acao")
        .select("id")
        .eq("programacao_id", selectedProgramacao.id)
        .limit(1)
        .maybeSingle();

      let registroId: string;

      if (existingRegistro) {
        const { error: updateRegistroError } = await supabase
          .from("registros_acao")
          .update({
            status: "realizada",
            turma: turma || null,
            observacoes: observacoesAcompanhamento || null,
          })
          .eq("id", existingRegistro.id);

        if (updateRegistroError) throw updateRegistroError;
        registroId = existingRegistro.id;
      } else {
        const { data: newRegistro, error: insertRegistroError } = await supabase
          .from("registros_acao")
          .insert({
            aap_id: user.id,
            ano_serie: selectedProgramacao.ano_serie,
            componente: selectedProgramacao.componente,
            data: selectedProgramacao.data,
            escola_id: selectedProgramacao.escola_id,
            programa: selectedProgramacao.programa,
            programacao_id: selectedProgramacao.id,
            segmento: selectedProgramacao.segmento,
            tipo: selectedProgramacao.tipo,
            status: "realizada",
            turma: turma || null,
            observacoes: observacoesAcompanhamento || null,
          })
          .select("id")
          .single();

        if (insertRegistroError) throw insertRegistroError;
        registroId = newRegistro.id;
      }

      // Build questoes_selecionadas JSONB
      const questoesSelecionadas = selectedQuestionKeys.map((key) => ({
        field_key: key,
        obrigatoria: isFieldRequired(key),
      }));

      // Save to instrument_responses per professor
      const professorIds = Object.keys(perProfessorResponses);
      const responsesToInsert = professorIds.map((profId) => ({
        registro_acao_id: registroId,
        professor_id: profId,
        escola_id: selectedProgramacao.escola_id,
        aap_id: user.id,
        form_type: "observacao_aula",
        responses: perProfessorResponses[profId] || {},
        questoes_selecionadas: questoesSelecionadas,
      }));

      const { error: instrumentError } = await (supabase as any).from("instrument_responses").insert(responsesToInsert);

      if (instrumentError) throw instrumentError;

      toast.success("Avaliação de acompanhamento salva com sucesso!", {
        description: `${professorIds.length} professor(es) avaliado(s)`,
      });

      setIsAvaliacaoDialogOpen(false);
      setSelectedProgramacao(null);
      setPerProfessorResponses({});
      setProfessoresAvaliacao([]);
      setQuestionSelectionDone(false);

      // Invalidar queries para atualizar dados em outras páginas
      queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
      queryClient.invalidateQueries({ queryKey: ["instrument_responses"] });
      queryClient.invalidateQueries({ queryKey: ["programacoes"] });

      fetchProgramacoes();
    } catch (error) {
      console.error("Error saving avaliacoes:", error);
      toast.error("Erro ao salvar avaliações");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para toggle de presença
  const handleTogglePresenca = (professorId: string) => {
    setPresencaList((prev) =>
      prev.map((item) => (item.professorId === professorId ? { ...item, presente: !item.presente } : item)),
    );
  };

  // Handler para marcar todos presentes ou ausentes
  const handleMarcarTodosPresenca = (presente: boolean) => {
    setPresencaList((prev) => prev.map((item) => ({ ...item, presente })));
  };

  // Handler para salvar presenças de formação
  const handleSavePresencas = async () => {
    if (!selectedProgramacao || !user) return;

    // Validação de simulação
    if (
      !guardOperation("save_presencas", {
        acaoTipo: selectedProgramacao.tipo,
        recordProgramas: selectedProgramacao.programa || [],
        recordEscolaId: selectedProgramacao.escola_id,
        recordAapId: selectedProgramacao.aap_id,
      })
    )
      return;

    setIsSubmitting(true);

    try {
      // Atualizar status da programação
      const { error: updateProgError } = await supabase
        .from("programacoes")
        .update({ status: "realizada" })
        .eq("id", selectedProgramacao.id);

      if (updateProgError) throw updateProgError;

      // Verificar se existe registro_acao
      const { data: existingRegistro } = await supabase
        .from("registros_acao")
        .select("id")
        .eq("programacao_id", selectedProgramacao.id)
        .limit(1)
        .maybeSingle();

      let registroId: string;

      if (existingRegistro) {
        // Atualizar registro existente
        const { error: updateRegistroError } = await supabase
          .from("registros_acao")
          .update({
            status: "realizada",
            observacoes: observacoesFormacao || null,
            avancos: avancosFormacao || null,
            dificuldades: dificuldadesFormacao || null,
          })
          .eq("id", existingRegistro.id);

        if (updateRegistroError) throw updateRegistroError;
        registroId = existingRegistro.id;
      } else {
        // Criar novo registro — preserva titularidade da programação original
        const ownerAapId = selectedProgramacao.aap_id || user.id;
        const { data: newRegistro, error: insertRegistroError } = await supabase
          .from("registros_acao")
          .insert({
            aap_id: ownerAapId,
            ano_serie: selectedProgramacao.ano_serie,
            componente: selectedProgramacao.componente,
            data: selectedProgramacao.data,
            escola_id: selectedProgramacao.escola_id,
            programa: selectedProgramacao.programa,
            programacao_id: selectedProgramacao.id,
            segmento: selectedProgramacao.segmento,
            tipo: selectedProgramacao.tipo,
            status: "realizada",
            observacoes: observacoesFormacao || null,
            avancos: avancosFormacao || null,
            dificuldades: dificuldadesFormacao || null,
            projeto: selectedProgramacao.projeto || null,
            componente_formacao_redes: selectedProgramacao.componente_formacao_redes || null,
          })
          .select("id")
          .single();

        if (insertRegistroError) throw insertRegistroError;
        registroId = newRegistro.id;
      }

      // Inserir presenças
      const presencasToInsert = presencaList.map((p) => ({
        registro_acao_id: registroId,
        professor_id: p.professorId,
        presente: p.presente,
      }));

      const { error: presencasError } = await supabase.from("presencas").insert(presencasToInsert);

      if (presencasError) throw presencasError;

      // Salvar instrumento pedagógico se houver respostas (formação e REDES)
      const TIPOS_COM_INSTRUMENTO_PRESENCA = [
        "formacao",
        "encontro_eteg_redes",
        "encontro_professor_redes",
        "encontro_microciclos_recomposicao",
      ];
      const skipInstrument =
        (selectedProgramacao.tipo === "encontro_professor_redes" ||
          selectedProgramacao.tipo === "encontro_eteg_redes") &&
        selectedProgramacao.projeto &&
        selectedProgramacao.projeto !== "Gestão para aprendizagem";
      if (
        !skipInstrument &&
        TIPOS_COM_INSTRUMENTO_PRESENCA.includes(selectedProgramacao.tipo) &&
        Object.keys(instrumentResponses).length > 0
      ) {
        const normalizedFormType = normalizeAcaoTipo(selectedProgramacao.tipo);
        const { error: instrumentError } = await (supabase as any).from("instrument_responses").insert({
          registro_acao_id: registroId,
          professor_id: null,
          escola_id: selectedProgramacao.escola_id,
          aap_id: selectedProgramacao.aap_id || user.id,
          form_type: normalizedFormType,
          responses: instrumentResponses,
          questoes_selecionadas: null,
        });
        if (instrumentError) throw instrumentError;
      }

      const presentes = presencaList.filter((p) => p.presente).length;

      // Criar acompanhamento de formação se solicitado
      let acompanhamentoCriado = false;
      if (agendarAcompanhamento && selectedProgramacao.tipo === "formacao" && acompanhamentoAapId) {
        const { data: acompProg, error: acompProgError } = await supabase
          .from("programacoes")
          .insert({
            tipo: "acompanhamento_formacoes",
            titulo: `Acompanhamento: ${selectedProgramacao.titulo}`,
            data: acompanhamentoData,
            horario_inicio: acompanhamentoHorarioInicio,
            horario_fim: acompanhamentoHorarioFim,
            escola_id: selectedProgramacao.escola_id,
            aap_id: acompanhamentoAapId,
            segmento: selectedProgramacao.segmento,
            componente: selectedProgramacao.componente,
            ano_serie: selectedProgramacao.ano_serie,
            status: "prevista",
            programa: selectedProgramacao.programa,
            formacao_origem_id: selectedProgramacao.id,
            created_by: user?.id,
          })
          .select()
          .single();

        if (acompProgError) {
          console.error("Error creating acompanhamento:", acompProgError);
          toast.error("Presenças salvas, mas erro ao criar acompanhamento");
        } else if (acompProg) {
          await supabase.from("registros_acao").insert({
            aap_id: acompanhamentoAapId,
            ano_serie: selectedProgramacao.ano_serie,
            componente: selectedProgramacao.componente,
            data: acompanhamentoData,
            escola_id: selectedProgramacao.escola_id,
            programa: selectedProgramacao.programa,
            programacao_id: acompProg.id,
            segmento: selectedProgramacao.segmento,
            tipo: "acompanhamento_formacoes",
            status: "agendada",
            formacao_origem_id: selectedProgramacao.id,
          });
          acompanhamentoCriado = true;
        }
      }

      if (acompanhamentoCriado) {
        toast.success("Presenças registradas e acompanhamento agendado!", {
          description: `${presentes} presente(s). Acompanhamento em ${format(new Date(acompanhamentoData), "dd/MM/yyyy", { locale: ptBR })}`,
        });
      } else {
        toast.success("Presenças registradas com sucesso!", {
          description: `${presentes} de ${presencaList.length} professor(es) presente(s)`,
        });
      }

      // Resetar estados de acompanhamento
      setAgendarAcompanhamento(false);
      setAcompanhamentoAapId("");
      setAcompanhamentoData("");
      setAcompanhamentoHorarioInicio("");
      setAcompanhamentoHorarioFim("");
      setAtoresElegiveis([]);

      setIsPresencaDialogOpen(false);
      setSelectedProgramacao(null);
      setPresencaList([]);
      setProfessoresPresenca([]);

      // Invalidar queries para atualizar dados em outras páginas
      queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
      queryClient.invalidateQueries({ queryKey: ["presencas"] });
      queryClient.invalidateQueries({ queryKey: ["programacoes"] });

      fetchProgramacoes();
    } catch (error: any) {
      console.error("Error saving presencas:", error);
      toast.error(error?.message || error?.details || "Erro ao salvar presenças");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para salvar instrumento pedagógico
  const handleSaveInstrument = async () => {
    if (!selectedProgramacao || !user) return;

    // Validação de simulação
    if (
      !guardOperation("save_instrument", {
        acaoTipo: selectedProgramacao.tipo,
        recordProgramas: selectedProgramacao.programa || [],
        recordEscolaId: selectedProgramacao.escola_id,
        recordAapId: selectedProgramacao.aap_id,
      })
    )
      return;

    setIsSubmitting(true);

    try {
      // Atualizar status da programação
      const { error: updateProgError } = await supabase
        .from("programacoes")
        .update({ status: "realizada" })
        .eq("id", selectedProgramacao.id);

      if (updateProgError) throw updateProgError;

      // Verificar se existe registro_acao
      const { data: existingRegistro } = await supabase
        .from("registros_acao")
        .select("id")
        .eq("programacao_id", selectedProgramacao.id)
        .limit(1)
        .maybeSingle();

      let registroId: string;

      if (existingRegistro) {
        const { error: updateRegistroError } = await supabase
          .from("registros_acao")
          .update({ status: "realizada" })
          .eq("id", existingRegistro.id);
        if (updateRegistroError) throw updateRegistroError;
        registroId = existingRegistro.id;
      } else {
        const { data: newRegistro, error: insertError } = await supabase
          .from("registros_acao")
          .insert({
            aap_id: user.id,
            ano_serie: selectedProgramacao.ano_serie,
            componente: selectedProgramacao.componente,
            data: selectedProgramacao.data,
            escola_id: selectedProgramacao.escola_id,
            programa: selectedProgramacao.programa,
            programacao_id: selectedProgramacao.id,
            segmento: selectedProgramacao.segmento,
            tipo: selectedProgramacao.tipo,
            status: "realizada",
            formacao_origem_id: selectedProgramacao.formacao_origem_id,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;
        registroId = newRegistro.id;
      }

      // Salvar respostas do instrumento (upsert: atualiza se já existe, insere se não)
      const normalizedTipo = normalizeAcaoTipo(selectedProgramacao.tipo);
      const { data: existingInstrument } = await supabase
        .from("instrument_responses")
        .select("id")
        .eq("registro_acao_id", registroId)
        .eq("form_type", normalizedTipo)
        .is("professor_id", null)
        .limit(1)
        .maybeSingle();

      if (existingInstrument?.id) {
        const { error: updateInstrumentError } = await (supabase as any)
          .from("instrument_responses")
          .update({ responses: instrumentResponses })
          .eq("id", existingInstrument.id);
        if (updateInstrumentError) throw updateInstrumentError;
      } else {
        const { error: instrumentError } = await (supabase as any).from("instrument_responses").insert({
          registro_acao_id: registroId,
          professor_id: null,
          escola_id: selectedProgramacao.escola_id,
          aap_id: user.id,
          form_type: normalizedTipo,
          responses: instrumentResponses,
          questoes_selecionadas: null,
        });
        if (instrumentError) throw instrumentError;
      }

      toast.success("Instrumento pedagógico salvo com sucesso!");

      setInstrumentHadSavedResponse(true);
      setIsInstrumentDialogOpen(false);
      setSelectedProgramacao(null);
      setInstrumentResponses({});

      queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
      queryClient.invalidateQueries({ queryKey: ["programacoes"] });
      queryClient.invalidateQueries({ queryKey: ["instrument_responses"] });

      fetchProgramacoes();
    } catch (error) {
      console.error("Error saving instrument:", error);
      toast.error("Erro ao salvar instrumento pedagógico");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tentativa de fechar o diálogo do Instrumento Pedagógico.
  // Se a ação está marcada como 'realizada' mas o instrumento ainda não foi salvo,
  // pede confirmação para reverter o status para 'prevista' (regra de obrigatoriedade do formulário).
  const handleInstrumentDialogCloseRequest = () => {
    if (
      selectedProgramacao &&
      selectedProgramacao.status === "realizada" &&
      !instrumentHadSavedResponse
    ) {
      setIsConfirmRevertOpen(true);
      return;
    }
    setIsInstrumentDialogOpen(false);
    setInstrumentResponses({});
    setInstrumentHadSavedResponse(false);
  };

  const handleConfirmRevertToPrevista = async () => {
    if (!selectedProgramacao) {
      setIsConfirmRevertOpen(false);
      setIsInstrumentDialogOpen(false);
      return;
    }
    try {
      // Buscar e remover registro órfão
      const { data: existingReg } = await supabase
        .from("registros_acao")
        .select("id")
        .eq("programacao_id", selectedProgramacao.id)
        .limit(1)
        .maybeSingle();
      if (existingReg?.id) {
        await supabase.from("registros_acao").delete().eq("id", existingReg.id);
      }
      const { error: revertError } = await supabase
        .from("programacoes")
        .update({ status: "prevista" })
        .eq("id", selectedProgramacao.id);
      if (revertError) throw revertError;
      toast.success("Ação revertida para 'prevista' (formulário não preenchido)");
    } catch (err: any) {
      console.error("Error reverting programacao:", err);
      toast.error(err?.message || "Erro ao reverter status da ação");
    } finally {
      setIsConfirmRevertOpen(false);
      setIsInstrumentDialogOpen(false);
      setIsMonitGestaoManaging(false);
      setMonitGestaoRegistroId(null);
      setMonitGestaoInitial(null);
      setInstrumentResponses({});
      setInstrumentHadSavedResponse(false);
      setSelectedProgramacao(null);
      queryClient.invalidateQueries({ queryKey: ["programacoes"] });
      queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
      fetchProgramacoes();
    }
  };

  // Handle delete programacao
  const handleDeleteProgramacao = async () => {
    if (!programacaoToDelete) return;

    // Validação de simulação
    if (
      !guardOperation("delete_programacao", {
        acaoTipo: programacaoToDelete.tipo,
        recordProgramas: programacaoToDelete.programa || [],
        recordEscolaId: programacaoToDelete.escola_id,
        recordAapId: programacaoToDelete.aap_id,
      })
    )
      return;

    setIsDeleting(true);
    try {
      // Check if there's a registro_acao linked to this programacao
      const { data: registros, error: registroCheckError } = await supabase
        .from("registros_acao")
        .select("id")
        .eq("programacao_id", programacaoToDelete.id);

      if (registroCheckError) throw registroCheckError;

      if (registros && registros.length > 0) {
        // Delete linked registros first (if any)
        const { error: registroDeleteError } = await supabase
          .from("registros_acao")
          .delete()
          .eq("programacao_id", programacaoToDelete.id);

        if (registroDeleteError) throw registroDeleteError;
      }

      // Delete the programacao
      const { error } = await supabase.from("programacoes").delete().eq("id", programacaoToDelete.id);

      if (error) throw error;

      toast.success("Programação excluída com sucesso!");
      setIsDeleteDialogOpen(false);
      setProgramacaoToDelete(null);
      fetchProgramacoes();
    } catch (error) {
      console.error("Error deleting programacao:", error);
      toast.error("Erro ao excluir programação");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helpers para seleção em lote
  const allFilteredIds = filteredProgramacoes.map((p) => p.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedProgramacaoIds.has(id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedProgramacaoIds(new Set());
    } else {
      setSelectedProgramacaoIds(new Set(allFilteredIds));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProgramacaoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchDeleteProgramacoes = async () => {
    if (selectedProgramacaoIds.size === 0) return;
    setIsBatchDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedProgramacaoIds) {
      try {
        // Desvincular registros_acao (preservar histórico)
        await supabase.from("registros_acao").update({ programacao_id: null }).eq("programacao_id", id);
        const { error } = await supabase.from("programacoes").delete().eq("id", id);
        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Error deleting programacao ${id}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) toast.success(`${successCount} programação(ões) excluída(s) com sucesso!`);
    if (errorCount > 0) toast.error(`${errorCount} programação(ões) não puderam ser excluídas.`);

    setSelectedProgramacaoIds(new Set());
    setIsBatchDeleting(false);
    setIsBatchDeleteDialogOpen(false);
    fetchProgramacoes();
  };

  const handleBatchUpload = async (programacoesData: ParsedProgramacao[], updateExisting: boolean) => {
    if (!user) {
      toast.error("Você precisa estar logado para importar programações");
      return;
    }

    try {
      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const prog of programacoesData) {
        // Check if programacao with same date, escola_id, aap_id and tipo exists
        const { data: existingProg } = await supabase
          .from("programacoes")
          .select("id")
          .eq("data", prog.data)
          .eq("escola_id", prog.escola_id)
          .eq("aap_id", prog.aap_id)
          .eq("tipo", prog.tipo)
          .eq("horario_inicio", prog.horario_inicio)
          .maybeSingle();

        if (existingProg) {
          if (updateExisting) {
            // Update existing programacao
            const { error } = await supabase
              .from("programacoes")
              .update({
                titulo: prog.titulo,
                descricao: prog.descricao || null,
                horario_fim: prog.horario_fim,
                segmento: prog.segmento,
                componente: prog.componente,
                ano_serie: prog.ano_serie,
                programa: prog.programa,
              })
              .eq("id", existingProg.id);

            if (error) throw error;
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // Insert new programacao
          const { error } = await supabase.from("programacoes").insert({
            tipo: prog.tipo,
            titulo: prog.titulo,
            descricao: prog.descricao || null,
            data: prog.data,
            horario_inicio: prog.horario_inicio,
            horario_fim: prog.horario_fim,
            escola_id: prog.escola_id,
            aap_id: prog.aap_id,
            segmento: prog.segmento,
            componente: prog.componente,
            ano_serie: prog.ano_serie,
            programa: prog.programa,
            status: "prevista",
            created_by: user.id,
          });

          if (error) throw error;
          insertedCount++;
        }
      }

      const messages = [];
      if (insertedCount > 0) messages.push(`${insertedCount} inserida(s)`);
      if (updatedCount > 0) messages.push(`${updatedCount} atualizada(s)`);
      if (skippedCount > 0) messages.push(`${skippedCount} ignorada(s) (duplicadas)`);

      toast.success(`Importação concluída: ${messages.join(", ")}`);
      fetchProgramacoes();
    } catch (error) {
      console.error("Error uploading programacoes:", error);
      toast.error("Erro ao importar programações");
    }
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getEscolaNome = (escolaId: string) => escolas.find((e) => e.id === escolaId)?.nome || "-";
  const getAapNome = (aapId: string) => aaps.find((a) => a.id === aapId)?.nome || "-";
  const getAapProgramas = (aapId: string) => aaps.find((a) => a.id === aapId)?.programas || [];

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-tour="prog-header">
        <div>
          <h1 className="page-header">Programação</h1>
          <p className="page-subtitle">Agende visitas e formações</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden" data-tour="prog-view-toggle">
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                viewMode === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              Calendário
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              Lista
            </button>
          </div>

          <button
            onClick={() => setIsUploadDialogOpen(true)}
            className="btn-outline flex items-center gap-2"
            data-tour="prog-import-btn"
          >
            <Upload size={20} />
            Importar
          </button>

          {/* Type Selection Dialog (Step 1) */}
          <Dialog open={isTypeSelectionOpen} onOpenChange={setIsTypeSelectionOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2" data-tour="prog-new-btn">
                <Plus size={20} />
                Nova Ação
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto w-[95vw] sm:w-auto">
              <DialogHeader>
                <DialogTitle>Selecione o Tipo de Ação</DialogTitle>
                <DialogDescription>Escolha qual ação deseja programar</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {creatableAcoes
                  .filter((t) => ACAO_FORM_CONFIG[t]?.isCreatable !== false)
                  .filter((t) => {
                    const allowedForTipo = getProgramasForTipo(t);
                    if (allowedForTipo.length === 0) return false;
                    // Quando simulando programa, restringe aos tipos do programa simulado
                    if (isSimulating && simulatedPrograma) {
                      return allowedForTipo.includes(simulatedPrograma);
                    }
                    if (isAAP) return aapProgramas.some((p) => allowedForTipo.includes(p));
                    if ((isGestor || isManager) && !isAdmin) {
                      // Se gestorProgramas está vazio (ex.: simulação sem registro), não restringe
                      if (gestorProgramas.length === 0) return true;
                      return gestorProgramas.some((p) => allowedForTipo.includes(p));
                    }
                    return true;
                  })
                  .map((tipo) => {
                    const info = ACAO_TYPE_INFO[tipo];
                    const Icon = info.icon;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => {
                            const allowed = getProgramasForTipo(tipo);
                            return {
                              ...prev,
                              tipo,
                              ...(allowed.length === 1 ? { programa: [allowed[0]] as ProgramaType[] } : {}),
                            };
                          });
                          setIsTypeSelectionOpen(false);
                          setIsDialogOpen(true);
                        }}
                        className="flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-sm leading-tight">{info.label}</span>
                      </button>
                    );
                  })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Form Dialog (Step 2) */}
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetProgramacaoForm();
            }}
          >
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProgramacao ? "Editar" : "Programar"} {ACAO_TYPE_INFO[formData.tipo as AcaoTipo]?.label || "Ação"}
                </DialogTitle>
              </DialogHeader>
              {/* Selected type indicator + back button */}
              <div className="flex items-center gap-2 -mt-1 mb-2">
                {!editingProgramacao && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setIsTypeSelectionOpen(true);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Alterar tipo
                    </button>
                    <span className="text-xs text-muted-foreground">•</span>
                  </>
                )}
                {(() => {
                  const info = ACAO_TYPE_INFO[formData.tipo as AcaoTipo];
                  if (!info) return null;
                  const Icon = info.icon;
                  return (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <Icon className="w-3.5 h-3.5" />
                      {info.label}
                    </span>
                  );
                })()}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="form-label">Programa *</label>
                    <Select
                      value={formData.programa[0] || "escolas"}
                      onValueChange={(value) => setFormData({ ...formData, programa: [value as ProgramaType] })}
                      disabled={(() => {
                        const allowedForTipo = getProgramasForTipo(formData.tipo);
                        if (allowedForTipo.length <= 1) return true;
                        if ((isGestor || isManager) && !isAdmin && gestorProgramas.length === 1) return true;
                        if (isAAP && aapProgramas.length === 1) return true;
                        return false;
                      })()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const allowedForTipo = getProgramasForTipo(formData.tipo);
                          let userProgramas: ProgramaType[];
                          if (isAAP) {
                            userProgramas = aapProgramas;
                          } else if ((isGestor || isManager) && !isAdmin) {
                            userProgramas = gestorProgramas;
                          } else {
                            userProgramas = ["escolas", "regionais", "redes_municipais"];
                          }
                          const filtered = userProgramas.filter((p) => allowedForTipo.includes(p));
                          const options = filtered.length > 0 ? filtered : allowedForTipo;
                          return options.map((prog) => (
                            <SelectItem key={prog} value={prog}>
                              {programaLabels[prog]}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                    {(isGestor || isManager) && !isAdmin && gestorProgramas.length === 0 && (
                      <p className="text-xs text-warning mt-1">Você não possui nenhum programa atribuído</p>
                    )}
                    {isAAP && aapProgramas.length === 0 && (
                      <p className="text-xs text-warning mt-1">Você não possui nenhum programa atribuído</p>
                    )}
                  </div>

                  {(formData.tipo === "encontro_professor_redes" || formData.tipo === "encontro_eteg_redes") && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Projeto *</label>
                      <Select
                        value={formData.projeto}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, projeto: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o projeto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instituto Alfa e Beto">Instituto Alfa e Beto</SelectItem>
                          <SelectItem value="Teaching at The Right Level">Teaching at The Right Level</SelectItem>
                          <SelectItem value="Gestão para aprendizagem">Gestão para aprendizagem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.tipo === "encontro_professor_redes" && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Componente</label>
                      <Select
                        value={formData.componenteFormacaoRedes}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, componenteFormacaoRedes: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Não se aplica">Não se aplica</SelectItem>
                          <SelectItem value="Polivalente">Polivalente</SelectItem>
                          <SelectItem value="Língua Portuguesa">Língua Portuguesa</SelectItem>
                          <SelectItem value="Matemática">Matemática</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}


                  {formData.tipo === "encontro_eteg_redes" && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Público da Formação *</label>
                      <select
                        value={formData.publicoFormacao}
                        onChange={(e) => setFormData((prev) => ({ ...prev, publicoFormacao: e.target.value }))}
                        className="input-field"
                        required
                      >
                        <option value="">Selecione o público</option>
                        <option value="Equipe Técnica">Equipe Técnica</option>
                        <option value="Equipe Gestora">Equipe Gestora</option>
                        <option value="Equipe Técnica + Equipe Gestora">Equipe Técnica + Equipe Gestora</option>
                      </select>
                    </div>
                  )}

                  {formData.tipo === "visita_tecnica_secretaria_sme" && (
                    <>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium mb-1">Núcleo/Departamento</label>
                        <input
                          type="text"
                          value={formData.nucleoDepartamento}
                          onChange={(e) => setFormData((prev) => ({ ...prev, nucleoDepartamento: e.target.value }))}
                          className="input-field"
                          placeholder="Ex: Núcleo Pedagógico"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium mb-1">Observador(a)</label>
                        <input
                          type="text"
                          value={formData.observadorNome}
                          onChange={(e) => setFormData((prev) => ({ ...prev, observadorNome: e.target.value }))}
                          className="input-field"
                          placeholder="Nome do(a) observador(a)"
                        />
                      </div>
                    </>
                  )}


                  {(
                    <>
                      <div className="col-span-2">
                        <label className="form-label">Título *</label>
                        <input
                          type="text"
                          value={formData.titulo}
                          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                          className="input-field"
                          placeholder="Ex: Formação em Alfabetização"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="form-label">Descrição</label>
                        <textarea
                          value={formData.descricao}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          className="input-field min-h-[80px]"
                          placeholder="Descreva a ação..."
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="form-label">Tags</label>
                        <input
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          className="input-field"
                          placeholder="Separe as tags por vírgula (ex: leitura, escrita)"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Sincronizado com "Tag do Projeto" no Notion
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="form-label">Data *</label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="input-field"
                      min="2000-01-01"
                      max="2100-12-31"
                      required
                    />

                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="form-label">Início *</label>
                      <input
                        type="time"
                        value={formData.horarioInicio}
                        onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Fim *</label>
                      <input
                        type="time"
                        value={formData.horarioFim}
                        onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  {(() => {
                    const formConfig = ACAO_FORM_CONFIG[formData.tipo as AcaoTipo];
                    const entidadeRequired = formConfig?.requiresEntidade !== false;
                    return (
                      <div>
                        <label className="form-label">
                          {formData.tipo === "observacao_aula_redes"
                            ? "Rede"
                            : formData.tipo === "formacao" && formData.programa?.includes("regionais")
                              ? "Regional"
                              : "Entidade"}
                          {entidadeRequired ? " *" : ""}
                        </label>
                        <select
                          value={formData.escolaId}
                          onChange={(e) =>
                            setFormData({ ...formData, escolaId: e.target.value, aapId: isAAP ? user?.id || "" : "" })
                          }
                          className="input-field"
                          required={entidadeRequired}
                        >
                          <option value="">Selecione{entidadeRequired ? "" : " (opcional)"}</option>
                          {escolas
                            .filter((escola) => {
                              if (!formData.programa || formData.programa.length === 0) return true;
                              return formData.programa.some((p) => escola.programa?.includes(p));
                            })
                            .map((escola) => (
                              <option key={escola.id} value={escola.id}>
                                {escola.nome}
                              </option>
                            ))}
                        </select>
                      </div>
                    );
                  })()}

                  {/* Escola (entidade filho) */}
                  {(formData.tipo === "observacao_aula_redes" ||
                    formData.tipo === "visita_tecnica_alfabetizacao_redes" ||
                    formData.tipo === "visita_tecnica_tarl" ||
                    formData.tipo === "visita_tecnica_microciclos" ||
                    formData.tipo === "visita_tecnica_alfabetizacao" ||
                    formData.tipo === "reuniao_acomp_alfabetizacao" ||
                    (formData.tipo === "formacao" && formData.programa?.includes("regionais"))) && (
                    <div>
                      <label className="form-label">
                        Escola{(formData.tipo === "visita_tecnica_alfabetizacao_redes" || formData.tipo === "visita_tecnica_tarl" || formData.tipo === "visita_tecnica_microciclos" || formData.tipo === "visita_tecnica_alfabetizacao" || formData.tipo === "reuniao_acomp_alfabetizacao") ? " *" : ""}
                      </label>
                      <select
                        value={formEscolaFilhoId}
                        onChange={(e) => setFormEscolaFilhoId(e.target.value)}
                        className="input-field"
                        disabled={!formData.escolaId}
                        required={formData.tipo === "visita_tecnica_alfabetizacao_redes" || formData.tipo === "visita_tecnica_tarl" || formData.tipo === "visita_tecnica_microciclos" || formData.tipo === "visita_tecnica_alfabetizacao" || formData.tipo === "reuniao_acomp_alfabetizacao"}
                      >
                        <option value="">
                          {!formData.escolaId ? "Selecione uma regional primeiro" : "Selecione a escola"}
                        </option>
                        {entidadesFilho.map((ef) => (
                          <option key={ef.id} value={ef.id}>
                            {ef.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Ano/Série e Turma - observacao_aula_redes */}
                  {formData.tipo === "observacao_aula_redes" && (
                    <>
                      <div>
                        <label className="form-label">Ano/Série *</label>
                        <select
                          value={formAnoSerieRedes}
                          onChange={(e) => setFormAnoSerieRedes(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          {["Não se aplica", "1º ano", "2º ano", "3º ano", "4º ano", "5º ano", "6º ano", "7º ano", "8º ano", "9º ano"].map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Turma *</label>
                        <select
                          value={formTurmaRedes}
                          onChange={(e) => setFormTurmaRedes(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          {["Não se aplica", "A", "B", "C", "D", "E", "F", "G", "H"].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Ano e Turma - visita_tecnica_alfabetizacao_redes (1º/2º ano, A-H) */}
                  {formData.tipo === "visita_tecnica_alfabetizacao_redes" && (
                    <>
                      <div>
                        <label className="form-label">Ano *</label>
                        <select
                          value={formAnoSerieRedes}
                          onChange={(e) => setFormAnoSerieRedes(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          {["1º ano", "2º ano"].map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Turma *</label>
                        <select
                          value={formTurmaRedes}
                          onChange={(e) => setFormTurmaRedes(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          {["A", "B", "C", "D", "E", "F", "G", "H"].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Ano/Série, Turma e Modalidade - visita_tecnica_tarl */}
                  {formData.tipo === "visita_tecnica_tarl" && (
                    <>
                      <div>
                        <label className="form-label">Ano/Série *</label>
                        <select
                          value={formAnoSerieRedes}
                          onChange={(e) => setFormAnoSerieRedes(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          {["1º ano","2º ano","3º ano","4º ano","5º ano","6º ano","7º ano","9º ano","1ª série","2ª série","3ª série"].map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Turma *</label>
                        <select
                          value={formTurmaRedes}
                          onChange={(e) => setFormTurmaRedes(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          {["A","B","C","D","E","F","G","H"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="form-label">Modalidade *</label>
                        <div className="flex flex-wrap gap-6 mt-1">
                          {[
                            { value: "estudante_em_foco", label: "Estudante em Foco" },
                            { value: "recrie", label: "Recrie" },
                          ].map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="modalidade_tarl"
                                value={opt.value}
                                checked={formModalidadeTarl === opt.value}
                                onChange={() => setFormModalidadeTarl(opt.value)}
                                required
                              />
                              <span className="text-sm">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Campos específicos do Monitoramento de Ações Formativas */}
                  {formData.tipo === "monitoramento_acoes_formativas" && (
                    <>
                      {/* Frente de Trabalho */}
                      <div className="col-span-2">
                        <label className="form-label">Frente de Trabalho/Projeto *</label>
                        <select
                          value={formFrenteTrabalho}
                          onChange={(e) => setFormFrenteTrabalho(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione a frente de trabalho</option>
                          {MONIT_FRENTE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Público do Encontro */}
                      <div className="col-span-2">
                        <label className="form-label">Público do Encontro *</label>
                        <div className="space-y-2 mt-1 max-h-[200px] overflow-y-auto border border-border rounded-md p-3">
                          {MONIT_PUBLICO_OPTIONS.map((option) => {
                            const checked = formPublicoEncontro.includes(option);
                            return (
                              <label
                                key={option}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded p-1 transition-colors"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(state) =>
                                    setFormPublicoEncontro((prev) =>
                                      state ? [...prev, option] : prev.filter((p) => p !== option),
                                    )
                                  }
                                />
                                <span>{option}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Local do Encontro */}
                      <div className="col-span-2">
                        <label className="form-label">Local do Encontro *</label>
                        <select
                          value={formLocalEncontro}
                          onChange={(e) => {
                            setFormLocalEncontro(e.target.value);
                            setFormLocalEscolas([]);
                            setFormLocalOutro("");
                          }}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione o local</option>
                          {MONIT_LOCAL_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Escola(s) - condicional */}
                      {formLocalEncontro === "escolas" && (
                        <div className="col-span-2">
                          <label className="form-label">Selecione a(s) escola(s) *</label>
                          <div className="space-y-2 mt-1 max-h-[200px] overflow-y-auto border border-border rounded-md p-3">
                            {entidadesFilho.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Nenhuma escola vinculada à entidade selecionada.
                              </p>
                            ) : (
                              entidadesFilho.map((ef) => {
                                const checked = formLocalEscolas.includes(ef.id);
                                return (
                                  <label
                                    key={ef.id}
                                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded p-1 transition-colors"
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(state) =>
                                        setFormLocalEscolas((prev) =>
                                          state ? [...prev, ef.id] : prev.filter((id) => id !== ef.id),
                                        )
                                      }
                                    />
                                    <span>{ef.nome}</span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Outro (local) - condicional */}
                      {formLocalEncontro === "outro" && (
                        <div className="col-span-2">
                          <label className="form-label">Especifique o local</label>
                          <input
                            type="text"
                            value={formLocalOutro}
                            onChange={(e) => setFormLocalOutro(e.target.value)}
                            className="input-field"
                            placeholder="Informe o local do encontro"
                          />
                        </div>
                      )}

                    </>
                  )}

                  {/* Campos genéricos (Fechamento/Encaminhamentos/Observações/Avanços/Dificuldades)
                      removidos do cadastro de todas as ações. Estados mantidos para compatibilidade. */}

                  {/* Campos (C) — Registro de Apoio Presencial */}
                  {formData.tipo === "registro_apoio_presencial" && (
                    <>
                      <div className="col-span-2">
                        <label className="form-label">A escola faz parte do Projeto VOAR? *</label>
                        <select
                          value={formApoioEscolaVoar}
                          onChange={(e) => {
                            setFormApoioEscolaVoar(e.target.value as any);
                            if (e.target.value !== "sim") setFormApoioTurmaVoar("");
                          }}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Componente da aula *</label>
                        <select
                          value={formApoioComponente}
                          onChange={(e) => setFormApoioComponente(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          {APOIO_COMPONENTE_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Etapa de ensino *</label>
                        <select
                          value={formApoioEtapa}
                          onChange={(e) => setFormApoioEtapa(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          {APOIO_ETAPA_OPTIONS.map((e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formApoioEscolaVoar === "sim" && (
                        <div className="col-span-2">
                          <label className="form-label">Turma observada (VOAR) *</label>
                          <select
                            value={formApoioTurmaVoar}
                            onChange={(e) => setFormApoioTurmaVoar(e.target.value)}
                            className="input-field"
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="Padrão">Padrão</option>
                            <option value="Adaptada">Adaptada</option>
                          </select>
                        </div>
                      )}

                      <div className="col-span-2">
                        <label className="form-label">Professor</label>
                        <select
                          value={formApoioProfessorId}
                          onChange={(e) => setFormApoioProfessorId(e.target.value)}
                          className="input-field"
                          disabled={!formData.escolaId}
                        >
                          <option value="">
                            {formData.escolaId ? "Selecione" : "Selecione uma entidade primeiro"}
                          </option>
                          {formApoioProfessores.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="form-label">Quem participou da observação?</label>
                        <div className="space-y-2 mt-1 border border-border rounded-md p-3">
                          {APOIO_PARTICIPANTES_OPTIONS.map((opt) => {
                            const checked = formApoioParticipantes.includes(opt);
                            return (
                              <label
                                key={opt}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded p-1 transition-colors"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(s) =>
                                    setFormApoioParticipantes((prev) =>
                                      s ? [...prev, opt] : prev.filter((x) => x !== opt),
                                    )
                                  }
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                          {formApoioParticipantes.includes("Outros") && (
                            <input
                              type="text"
                              className="input-field mt-2"
                              placeholder="Especifique..."
                              value={formApoioParticipantesOutros}
                              onChange={(e) => setFormApoioParticipantesOutros(e.target.value)}
                            />
                          )}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="form-label">A observação foi previamente planejada com o professor? *</label>
                        <select
                          value={formApoioObsPlanejada}
                          onChange={(e) => setFormApoioObsPlanejada(e.target.value as any)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="form-label">Foco(s) escolhido(s) para nortear a observação *</label>
                        <div className="space-y-2 mt-1 border border-border rounded-md p-3">
                          {APOIO_FOCO_OPTIONS.map((f) => {
                            const checked = formApoioFocos.includes(f.value);
                            return (
                              <label
                                key={f.value}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded p-1 transition-colors"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(s) =>
                                    setFormApoioFocos((prev) =>
                                      s ? [...prev, f.value] : prev.filter((x) => x !== f.value),
                                    )
                                  }
                                />
                                <span>{f.label}</span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Os focos selecionados definem quais grupos de rubricas serão preenchidos no momento do
                          gerenciamento.
                        </p>
                      </div>

                      <div className="col-span-2">
                        <label className="form-label">Quando ocorrerá a devolutiva? *</label>
                        <select
                          value={formApoioDevolutiva}
                          onChange={(e) => setFormApoioDevolutiva(e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Selecione</option>
                          {APOIO_DEVOLUTIVA_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Responsável / AAP selector */}
                  {(() => {
                    const formConfig = ACAO_FORM_CONFIG[formData.tipo as AcaoTipo];
                    const label = formConfig?.responsavelLabel || "Responsável";
                    const useResponsavel = formConfig?.useResponsavelSelector;

                    return (
                      <div className="col-span-2">
                        <label className="form-label">{label} *</label>
                        <select
                          value={formData.aapId}
                          onChange={(e) => setFormData({ ...formData, aapId: e.target.value })}
                          className="input-field"
                          required
                          disabled={formConfig?.requiresEntidade !== false && !formData.escolaId}
                        >
                          <option value="">
                            {formConfig?.requiresEntidade !== false && !formData.escolaId
                              ? "Selecione uma entidade primeiro"
                              : "Selecione"}
                          </option>
                          {filteredAaps.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nome}{" "}
                              {useResponsavel
                                ? `(${ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role})`
                                : u.programas.length > 0
                                  ? `(${u.programas.map((p) => programaLabels[p]).join(", ")})`
                                  : ""}
                            </option>
                          ))}
                        </select>
                        {formConfig?.requiresEntidade !== false && formData.escolaId && filteredAaps.length === 0 && (
                          <p className="text-xs text-warning mt-1">Nenhum responsável encontrado para esta entidade</p>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const formConfig = ACAO_FORM_CONFIG[formData.tipo as AcaoTipo];
                    const isFormacaoType = [
                      "formacao",
                      "acompanhamento_formacoes",
                      "lista_presenca",
                      "participa_formacoes",
                    ].includes(formData.tipo);
                    const showSegmento = formConfig?.showSegmento ?? false;
                    const showComponente = formConfig?.showComponente ?? false;
                    const showAnoSerie = formConfig?.showAnoSerie ?? false;
                    return (
                      <>
                        {showSegmento && (
                          <div>
                            <label className="form-label">Segmento *</label>
                            <select
                              value={formData.segmento}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  segmento: e.target.value as Segmento,
                                  anoSerie: isFormacaoType ? formData.anoSerie : "",
                                })
                              }
                              className="input-field"
                              required={!isFormacaoType}
                              disabled={isAAP && getAAPSegmentoComponente(profile?.role).segmentos.length === 1}
                            >
                              {isFormacaoType && <option value="todos">Todos os Segmentos</option>}
                              {(() => {
                                const allowedSegmentos = isAAP
                                  ? getAAPSegmentoComponente(profile?.role).segmentos
                                  : Object.keys(segmentoLabels);
                                return allowedSegmentos.map((value) => (
                                  <option key={value} value={value}>
                                    {segmentoLabels[value as Segmento]}
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>
                        )}

                        {showComponente && (
                          <div>
                            <label className="form-label">Componente *</label>
                            <select
                              value={formData.componente}
                              onChange={(e) =>
                                setFormData({ ...formData, componente: e.target.value as ComponenteCurricular })
                              }
                              className="input-field"
                              required
                              disabled={isAAP && getAAPSegmentoComponente(profile?.role).componentes.length === 1}
                            >
                              {(() => {
                                const allowedComponentes = isAAP
                                  ? getAAPSegmentoComponente(profile?.role).componentes
                                  : Object.keys(componenteLabels);
                                return allowedComponentes.map((value) => (
                                  <option key={value} value={value}>
                                    {componenteLabels[value as ComponenteCurricular]}
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>
                        )}

                        {showAnoSerie && (
                          <div className="col-span-2">
                            <label className="form-label">Ano/Série *</label>
                            <select
                              value={formData.anoSerie}
                              onChange={(e) => setFormData({ ...formData, anoSerie: e.target.value })}
                              className="input-field"
                              required={!isFormacaoType}
                            >
                              <option value="">Selecione</option>
                              {isFormacaoType && <option value="todos">Todos os Anos/Séries</option>}
                              {formData.segmento !== "todos" &&
                                anoSerieOptions[formData.segmento]?.map((ano) => (
                                  <option key={ano} value={ano}>
                                    {ano}
                                  </option>
                                ))}
                              {formData.segmento === "todos" &&
                                isFormacaoType &&
                                Object.values(anoSerieOptions)
                                  .flat()
                                  .filter((v, i, arr) => arr.indexOf(v) === i)
                                  .map((ano) => (
                                    <option key={ano} value={ano}>
                                      {ano}
                                    </option>
                                  ))}
                            </select>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Tipo de Ator Participante - somente para Formação */}
                  {formData.tipo === "formacao" && (
                    <div className="col-span-2">
                      <label className="form-label">Tipo de Ator Participante</label>
                      <select
                        value={formData.tipoAtorPresenca}
                        onChange={(e) => setFormData({ ...formData, tipoAtorPresenca: e.target.value })}
                        className="input-field"
                      >
                        <option value="todos">Todos</option>
                        <option value="professor">Professor</option>
                        <option value="coordenador">Coordenador</option>
                        <option value="diretor">Diretor</option>
                        <option value="vice_diretor">Vice-Diretor</option>
                        <option value="pec">PEC</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Filtra quais atores aparecem na lista de presença
                      </p>
                    </div>
                  )}

                  {/* Turma de Formação - para Encontro Professor REDES, ET/EG REDES e Microciclos */}
                  {(formData.tipo === "encontro_professor_redes" ||
                    formData.tipo === "encontro_eteg_redes" ||
                    formData.tipo === "encontro_microciclos_recomposicao") && (
                    <div className="col-span-2">
                      <label className="form-label">
                        {formData.tipo === "encontro_microciclos_recomposicao" ? "Turma" : "Turma de Formação"}
                      </label>
                      <select
                        value={formData.turmaFormacao}
                        onChange={(e) => setFormData((prev) => ({ ...prev, turmaFormacao: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Todas</option>
                        {distinctTurmasFormacao.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.tipo === "encontro_microciclos_recomposicao"
                          ? "Filtra participantes pela turma na lista de presença"
                          : "Filtra participantes pela turma de formação na lista de presença"}
                      </p>
                    </div>
                  )}

                  {formData.tipo === "formacao" && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Projeto (Notion)</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.projetoNotion}
                        onChange={(e) => setFormData((prev) => ({ ...prev, projetoNotion: e.target.value }))}
                        placeholder="Nome do projeto no Notion"
                      />
                    </div>
                  )}

                  {(formData.tipo === "formacao" ||
                    formData.tipo === "encontro_eteg_redes" ||
                    formData.tipo === "encontro_professor_redes" ||
                    formData.tipo === "encontro_microciclos_recomposicao") && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Local</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.local}
                        onChange={(e) => setFormData((prev) => ({ ...prev, local: e.target.value }))}
                        placeholder="Local da formação"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsDialogOpen(false)} className="btn-outline flex-1">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : editingProgramacao ? "Salvar" : "Programar"}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2" data-tour="prog-filters">
        <span className="text-sm font-medium text-muted-foreground">Filtros</span>
        <div className="flex flex-wrap gap-3">
          <Select
            value={programaFilter}
            onValueChange={(value) => setProgramaFilter(value as ProgramaType | "todos")}
            disabled={
              (isAAP && aapProgramas.length <= 1) ||
              ((isGestor || isManager) && !isAdmin && gestorProgramas.length <= 1)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Programa" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin ? (
                <>
                  <SelectItem value="todos">Programa</SelectItem>
                  <SelectItem value="escolas">Programa de Escolas</SelectItem>
                  <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                  <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
                </>
              ) : (isGestor || isManager) && !isAdmin ? (
                <>
                  {gestorProgramas.length > 1 && <SelectItem value="todos">Todos os Programas</SelectItem>}
                  {gestorProgramas.map((prog) => (
                    <SelectItem key={prog} value={prog}>
                      {programaLabels[prog]}
                    </SelectItem>
                  ))}
                </>
              ) : isAAP ? (
                <>
                  {aapProgramas.length > 1 && <SelectItem value="todos">Todos os Programas</SelectItem>}
                  {aapProgramas.map((prog) => (
                    <SelectItem key={prog} value={prog}>
                      {programaLabels[prog]}
                    </SelectItem>
                  ))}
                </>
              ) : (
                <>
                  <SelectItem value="todos">Programa</SelectItem>
                  <SelectItem value="escolas">Programa de Escolas</SelectItem>
                  <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                  <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              {creatableAcoes
                .filter((tipo) => availableTipoIds.has(tipo))
                .map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {ACAO_TYPE_INFO[tipo].label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Filtro Entidade - visível para todos os níveis */}
          <Select value={entidadeFilter} onValueChange={setEntidadeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Entidades</SelectItem>
              {escolas
                .filter((e) => availableEntidadeIds.has(e.id))
                .map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.codesc ? `${e.codesc} - ${e.nome}` : e.nome}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Filtro Entidade Filho - visível quando há entidades filho disponíveis */}
          {(() => {
            const opts = (entidadeFilter !== "todos"
              ? allEntidadesFilho.filter((ef) => ef.escola_id === entidadeFilter)
              : allEntidadesFilho
            ).filter((ef) => availableEntidadeFilhoIds.has(ef.id));
            if (opts.length === 0) return null;
            return (
              <Select value={entidadeFilhoFilter} onValueChange={setEntidadeFilhoFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Entidade Filho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Entidades Filho</SelectItem>
                  {opts.map((ef) => (
                    <SelectItem key={ef.id} value={ef.id}>{ef.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}

          {profile && getRoleLevel(profile.role ?? null) <= 5 && (() => {
            const userProgs = gestorProgramas.length > 0 ? gestorProgramas : aapProgramas;
            const baseList = aaps
              .filter((u) => {
                if (!u.roles.includes("n5_formador")) return false;
                if (isAdmin) return true;
                if (userProgs.length === 0) return true;
                return u.programas.some((p) => userProgs.includes(p));
              });
            const hasOtherFilters = programaFilter !== "todos" || tipoFilter !== "todos" || entidadeFilter !== "todos" || entidadeFilhoFilter !== "todos" || consultorFilter !== "todos" || gpiFilter !== "todos";
            const filteredList = hasOtherFilters
              ? baseList.filter((u) => availableFormadorIds.has(u.id))
              : baseList;
            return (
              <Select value={formadorFilter} onValueChange={setFormadorFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Formador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Formadores</SelectItem>
                  {filteredList
                    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }))
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            );
          })()}

          {/* Filtro Consultor (N4.1) - visível para N1, N2, N3 (level <= 3) */}
          {getRoleLevel(profile?.role ?? null) <= 3 && (() => {
            const baseList = aaps.filter((u) => u.roles.includes("n4_1_cped"));
            const hasOtherFilters = programaFilter !== "todos" || tipoFilter !== "todos" || entidadeFilter !== "todos" || entidadeFilhoFilter !== "todos" || formadorFilter !== "todos" || gpiFilter !== "todos";
            const filteredList = hasOtherFilters
              ? baseList.filter((u) => availableConsultorIds.has(u.id))
              : baseList;
            return (
              <Select value={consultorFilter} onValueChange={setConsultorFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Consultor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Consultores</SelectItem>
                  {filteredList
                    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }))
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            );
          })()}

          {/* Filtro Gestor de Parceria (N4.2) - visível para N1, N2, N3 (level <= 3) */}
          {getRoleLevel(profile?.role ?? null) <= 3 && (() => {
            const baseList = aaps.filter((u) => u.roles.includes("n4_2_gpi"));
            const hasOtherFilters = programaFilter !== "todos" || tipoFilter !== "todos" || entidadeFilter !== "todos" || entidadeFilhoFilter !== "todos" || formadorFilter !== "todos" || consultorFilter !== "todos";
            const filteredList = hasOtherFilters
              ? baseList.filter((u) => availableGpiIds.has(u.id))
              : baseList;
            return (
              <Select value={gpiFilter} onValueChange={setGpiFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Gestor de Parceria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os GPIs</SelectItem>
                  {filteredList
                    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }))
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            );
          })()}
        </div>
      </div>

      {/* Barra de ação em lote */}
      {isAdmin && selectedProgramacaoIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium">{selectedProgramacaoIds.size} programação(ões) selecionada(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedProgramacaoIds(new Set())}>
              Limpar seleção
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBatchDeleteDialogOpen(true)}
              disabled={isBatchDeleting}
            >
              <Trash2 size={14} className="mr-1" />
              Excluir selecionadas
            </Button>
          </div>
        </div>
      )}

      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6" data-tour="prog-calendar">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6" data-tour="prog-navigation">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-semibold capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const events = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => {
                      setSelectedDate(day);
                      setFormData((prev) => ({ ...prev, data: format(day, "yyyy-MM-dd") }));
                      setIsTypeSelectionOpen(true);
                    }}
                    className={cn(
                      "min-h-[80px] p-2 rounded-lg border transition-all text-left",
                      !isCurrentMonth && "opacity-30",
                      isSelected && "border-primary bg-primary/5",
                      !isSelected && "border-transparent hover:bg-muted",
                      isToday && "ring-2 ring-accent ring-offset-2",
                    )}
                  >
                    <span className={cn("text-sm font-medium", isSelected && "text-primary")}>{format(day, "d")}</span>
                    <div className="mt-1 space-y-1">
                      {events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={cn("text-xs px-1.5 py-0.5 rounded truncate bg-primary/20 text-primary")}
                        >
                          {event.titulo}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-muted-foreground">+{events.length - 2} mais</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day events */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-4 flex items-center gap-2">
              <CalendarIcon size={20} className="text-primary" />
              {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}
            </h3>

            {selectedDate ? (
              <div className="space-y-3">
                {selectedDayEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma ação programada</p>
                ) : (
                  selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-4 rounded-lg bg-muted/50 space-y-2",
                        isAdmin && selectedProgramacaoIds.has(event.id) && "ring-2 ring-primary/40",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <Checkbox
                              checked={selectedProgramacaoIds.has(event.id)}
                              onCheckedChange={() => handleToggleSelect(event.id)}
                              aria-label={`Selecionar ${event.titulo}`}
                            />
                          )}
                          <h4 className="font-medium text-foreground">{event.titulo}</h4>
                        </div>
                        <StatusBadge variant="primary">{getAcaoLabel(event.tipo)}</StatusBadge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Clock size={14} />
                          {event.horario_inicio} - {event.horario_fim}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={14} />
                          {getEscolaNome(event.escola_id)}
                        </p>
                        <div>
                          <span>Responsável: {getAapNome(event.aap_id)}</span>
                        </div>
                        <p>
                          {segmentoLabels[event.segmento as Segmento]} • {event.ano_serie}
                        </p>
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {event.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <StatusBadge
                          variant={
                            event.status === "realizada" ? "success" : event.status === "prevista" ? "warning" : "error"
                          }
                        >
                          {event.status === "realizada"
                            ? "Realizada"
                            : event.status === "prevista"
                              ? "Prevista"
                              : "Cancelada"}
                        </StatusBadge>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPrintProgramacaoId(event.id)}
                            title="Imprimir formulário"
                          >
                            <Printer size={14} />
                          </Button>
                          {canEditProgramacao(event) && (
                            <Button variant="ghost" size="sm" onClick={() => handleEditAcaoClick(event)} title={event.status === "realizada" ? "Editar formulário do instrumento" : "Informar o acontecimento da ação"}>
                              <Edit size={14} className="mr-1" />
                              Gerenciar
                            </Button>
                          )}
                          {canEditProgramacao(event) && (
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEditProgramacao(event)} title="Editar o cadastro da ação">
                              <Edit size={14} className="mr-1" />
                              Editar Agendamento
                            </Button>
                          )}
                          {event.status === "realizada" && event.tipo === "formacao" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAcompanhamentoDialog(event)}
                              className="text-primary border-primary/30 hover:bg-primary/10"
                            >
                              <CalendarPlus size={14} className="mr-1" />
                              Acompanhamento
                            </Button>
                          )}
                          {(isAdmin || isManager || (user && event.aap_id === user.id)) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setProgramacaoToDelete(event);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                      {event.motivo_cancelamento && (
                        <div className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                          <span className="font-medium">Motivo:</span> {event.motivo_cancelamento}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Clique em um dia para ver as ações</p>
            )}
          </div>
        </div>
      ) : (
        // List View
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {isAdmin && (
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Título</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Escola</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Responsável</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProgramacoes.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma programação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredProgramacoes.map((prog) => (
                    <tr
                      key={prog.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isAdmin && selectedProgramacaoIds.has(prog.id) && "bg-primary/5",
                      )}
                    >
                      {isAdmin && (
                        <td className="px-4 py-3 w-10">
                          <Checkbox
                            checked={selectedProgramacaoIds.has(prog.id)}
                            onCheckedChange={() => handleToggleSelect(prog.id)}
                            aria-label={`Selecionar ${prog.titulo}`}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm">
                        {format(parseISO(prog.data), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant="primary">{getAcaoLabel(prog.tipo)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{prog.titulo}</td>
                      <td className="px-4 py-3 text-sm">{getEscolaNome(prog.escola_id)}</td>
                      <td className="px-4 py-3 text-sm">{getAapNome(prog.aap_id)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          variant={
                            prog.status === "realizada" ? "success" : prog.status === "prevista" ? "warning" : "error"
                          }
                        >
                          {prog.status === "realizada"
                            ? "Realizada"
                            : prog.status === "prevista"
                              ? "Prevista"
                              : "Cancelada"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPrintProgramacaoId(prog.id)}
                            title="Imprimir formulário"
                          >
                            <Printer size={14} />
                          </Button>
                          {canEditProgramacao(prog) && (
                            <Button variant="ghost" size="sm" onClick={() => handleEditAcaoClick(prog)} title={prog.status === "realizada" ? "Editar formulário do instrumento" : "Informar o acontecimento da ação"}>
                              <Edit size={14} className="mr-1" />
                              Gerenciar
                            </Button>
                          )}
                          {canEditProgramacao(prog) && (
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEditProgramacao(prog)} title="Editar o cadastro da ação">
                              <Edit size={14} className="mr-1" />
                              Editar Agendamento
                            </Button>
                          )}
                          {prog.status === "realizada" && prog.tipo === "formacao" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenManageDialog(prog)}
                              className="text-primary border-primary/30 hover:bg-primary/10"
                            >
                              <CalendarPlus size={14} className="mr-1" />
                              Acompanhamento
                            </Button>
                          )}
                          {(isAdmin || isManager || (user && prog.aap_id === user.id)) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setProgramacaoToDelete(prog);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manage Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Ação</DialogTitle>
          </DialogHeader>

          {selectedProgramacao && (
            <div className="space-y-6 mt-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="primary">{getAcaoLabel(selectedProgramacao.tipo)}</StatusBadge>
                  <span className="font-medium">{selectedProgramacao.titulo}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{format(parseISO(selectedProgramacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  <span>•</span>
                  <span>{getEscolaNome(selectedProgramacao.escola_id)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">A ação foi realizada? *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAcaoRealizada(true);
                      setMotivoCancelamento("");
                      setReagendar(false);
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2",
                      acaoRealizada === true
                        ? "border-success bg-success/10 text-success"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <CheckCircle2 size={18} />
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcaoRealizada(false)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2",
                      acaoRealizada === false
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <XCircle size={18} />
                    Não
                  </button>
                </div>
              </div>

              {acaoRealizada === false && (
                <div className="space-y-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertCircle size={16} className="text-destructive" />
                      Motivo / Justificativa *
                    </label>
                    <Textarea
                      value={motivoCancelamento}
                      onChange={(e) => setMotivoCancelamento(e.target.value)}
                      placeholder="Informe o motivo..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="reagendar"
                      checked={reagendar}
                      onCheckedChange={(checked) => setReagendar(checked as boolean)}
                    />
                    <label htmlFor="reagendar" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <CalendarPlus size={16} className="text-primary" />
                      Reagendar esta ação
                    </label>
                  </div>

                  {reagendar && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">Nova Data *</label>
                        <input
                          type="date"
                          value={novaData}
                          onChange={(e) => setNovaData(e.target.value)}
                          className="input-field text-sm"
                          min={format(new Date(), "yyyy-MM-dd")}
                          max="2100-12-31"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Início *</label>
                        <input
                          type="time"
                          value={novoHorarioInicio}
                          onChange={(e) => setNovoHorarioInicio(e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Fim *</label>
                        <input
                          type="time"
                          value={novoHorarioFim}
                          onChange={(e) => setNovoHorarioFim(e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Agendar acompanhamento de formação */}
              {selectedProgramacao.tipo === "formacao" && acaoRealizada === true && (
                <div className="space-y-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="agendarAcompanhamento"
                      checked={agendarAcompanhamento}
                      onCheckedChange={(checked) => {
                        setAgendarAcompanhamento(checked as boolean);
                        if (checked && selectedProgramacao) {
                          setAcompanhamentoData(selectedProgramacao.data);
                          setAcompanhamentoHorarioInicio(selectedProgramacao.horario_inicio || "");
                          setAcompanhamentoHorarioFim(selectedProgramacao.horario_fim || "");
                        }
                      }}
                    />
                    <label
                      htmlFor="agendarAcompanhamento"
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      <CalendarPlus size={16} className="text-primary" />
                      Agendar Acompanhamento de Formação
                    </label>
                  </div>

                  {agendarAcompanhamento && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">Ator Responsável *</label>
                        {isLoadingAtores ? (
                          <div className="flex items-center gap-2 py-2">
                            <Loader2 className="animate-spin" size={14} />
                            <span className="text-xs text-muted-foreground">Carregando atores...</span>
                          </div>
                        ) : atoresElegiveis.length === 0 ? (
                          <p className="text-xs text-warning py-1">
                            Nenhum ator elegível encontrado para esta entidade e programa.
                          </p>
                        ) : (
                          <Select value={acompanhamentoAapId} onValueChange={setAcompanhamentoAapId}>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Selecione o ator" />
                            </SelectTrigger>
                            <SelectContent>
                              {atoresElegiveis.map((ator) => (
                                <SelectItem key={ator.id} value={ator.id}>
                                  {ator.nome} ({cargoLabels[ator.role as keyof typeof cargoLabels] || ator.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Data *</label>
                          <input
                            type="date"
                            value={acompanhamentoData}
                            onChange={(e) => setAcompanhamentoData(e.target.value)}
                            className="input-field text-sm"
                            min={format(new Date(), "yyyy-MM-dd")}
                            max="2100-12-31"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Início *</label>
                          <input
                            type="time"
                            value={acompanhamentoHorarioInicio}
                            onChange={(e) => setAcompanhamentoHorarioInicio(e.target.value)}
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Fim *</label>
                          <input
                            type="time"
                            value={acompanhamentoHorarioFim}
                            onChange={(e) => setAcompanhamentoHorarioFim(e.target.value)}
                            className="input-field text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsManageDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleManageSubmit} disabled={acaoRealizada === null || isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Confirmar"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <ProgramacaoUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        escolas={escolas}
        aaps={aaps}
        onUpload={handleBatchUpload}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta programação?
              {programacaoToDelete && (
                <div className="mt-2 p-3 rounded-lg bg-muted text-foreground">
                  <p className="font-medium">{programacaoToDelete.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(programacaoToDelete.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {" - "}
                    {getEscolaNome(programacaoToDelete.escola_id)}
                  </p>
                </div>
              )}
              <p className="mt-2 text-sm text-destructive">
                Esta ação não pode ser desfeita. Os registros de ação vinculados também serão excluídos.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProgramacao}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Tem certeza que deseja excluir <strong>{selectedProgramacaoIds.size}</strong> programação(ões)?
                </p>
                <p className="mt-2 text-destructive">
                  Esta ação não pode ser desfeita. Os registros de ações vinculados serão desvinculados mas não
                  excluídos.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDeleteProgramacoes}
              disabled={isBatchDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBatchDeleting ? (
                <>
                  <Loader2 size={14} className="mr-1 animate-spin" />
                  Excluindo...
                </>
              ) : (
                `Excluir ${selectedProgramacaoIds.size} programação(ões)`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Seleção de Questões Dialog */}
      <QuestionSelectionStep
        open={showQuestionSelection}
        onOpenChange={setShowQuestionSelection}
        questions={questionItems}
        selectedKeys={selectedQuestionKeys}
        onSelectedKeysChange={setSelectedQuestionKeys}
        minOptionalQuestions={minOptionalQuestions}
        onConfirm={handleConfirmQuestionSelection}
      />

      {/* Avaliação de Acompanhamento de Aula Dialog (Instrument-based) */}
      <Dialog open={isAvaliacaoDialogOpen} onOpenChange={setIsAvaliacaoDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="text-warning" size={20} />
              Acompanhamento de Aula
            </DialogTitle>
            <DialogDescription>
              {selectedProgramacao && (
                <span>
                  {selectedProgramacao.titulo} -{" "}
                  {format(parseISO(selectedProgramacao.data), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {professoresAvaliacao.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">
                Nenhum professor encontrado para esta escola, segmento e ano/série.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setIsAvaliacaoDialogOpen(false);
                  setIsManageDialogOpen(true);
                }}
              >
                Voltar
              </Button>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Campos gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Turma</label>
                  <input
                    type="text"
                    value={turma}
                    onChange={(e) => setTurma(e.target.value)}
                    className="input-field"
                    placeholder="Ex: 5º A"
                  />
                </div>
                <div>
                  <label className="form-label">Observações Gerais</label>
                  <input
                    type="text"
                    value={observacoesAcompanhamento}
                    onChange={(e) => setObservacoesAcompanhamento(e.target.value)}
                    className="input-field"
                    placeholder="Observações sobre a visita..."
                  />
                </div>
              </div>

              {/* Lista de professores para avaliar */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <User size={16} />
                  Professores para Avaliar ({professoresAvaliacao.length})
                </h4>

                <div className="grid gap-3">
                  {professoresAvaliacao.map((prof) => {
                    const isExpanded = selectedProfessorAvaliacao === prof.id;
                    const profResponses = perProfessorResponses[prof.id] || {};
                    const filledCount = Object.keys(profResponses).filter(
                      (k) => profResponses[k] !== undefined && profResponses[k] !== "" && profResponses[k] !== null,
                    ).length;

                    return (
                      <div
                        key={prof.id}
                        className={cn(
                          "border rounded-xl transition-all",
                          isExpanded ? "border-primary bg-primary/5" : "border-border",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedProfessorAvaliacao(isExpanded ? null : prof.id)}
                          className="w-full p-4 flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User size={18} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{prof.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {cargoLabels[prof.cargo as keyof typeof cargoLabels] || prof.cargo} •{" "}
                                {segmentoLabels[prof.segmento as Segmento] || prof.segmento}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {filledCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {filledCount}/{selectedQuestionKeys.length}
                              </span>
                            )}
                            <ChevronRight
                              size={18}
                              className={cn("text-muted-foreground transition-transform", isExpanded && "rotate-90")}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <InstrumentForm
                              formType="observacao_aula"
                              responses={profResponses}
                              onResponseChange={(fieldKey, value) =>
                                handleProfessorResponseChange(prof.id, fieldKey, value)
                              }
                              selectedKeys={selectedQuestionKeys}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAvaliacaoDialogOpen(false);
                    setIsManageDialogOpen(true);
                  }}
                >
                  Voltar
                </Button>
                <Button onClick={handleSaveAvaliacoes} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Salvar Avaliações"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Presença de Formação Dialog */}
      <Dialog open={isPresencaDialogOpen} onOpenChange={setIsPresencaDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-success" size={20} />
              Registro de Presença - Formação
            </DialogTitle>
            <DialogDescription>
              {selectedProgramacao && (
                <span>
                  {selectedProgramacao.titulo} -{" "}
                  {format(parseISO(selectedProgramacao.data), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoadingProfessores ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : professoresPresenca.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">
                Nenhum professor encontrado para esta escola com os filtros selecionados.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setIsPresencaDialogOpen(false);
                  setIsManageDialogOpen(true);
                }}
              >
                Voltar
              </Button>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Instrumento Pedagógico de Formação / REDES */}
              {selectedProgramacao &&
                [
                  "formacao",
                  "encontro_eteg_redes",
                  "encontro_professor_redes",
                  "encontro_microciclos_recomposicao",
                ].includes(selectedProgramacao.tipo) &&
                !(
                  (selectedProgramacao.tipo === "encontro_professor_redes" ||
                    selectedProgramacao.tipo === "encontro_eteg_redes") &&
                  selectedProgramacao.projeto &&
                  selectedProgramacao.projeto !== "Gestão para aprendizagem"
                ) && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <ClipboardList className="text-primary" size={18} />
                      {getAcaoLabel(selectedProgramacao.tipo)}
                    </h4>
                    <InstrumentForm
                      formType={normalizeAcaoTipo(selectedProgramacao.tipo)}
                      responses={instrumentResponses}
                      onResponseChange={(fieldKey, value) =>
                        setInstrumentResponses((prev) => ({ ...prev, [fieldKey]: value }))
                      }
                    />
                  </div>
                )}

              {/* Ações em massa */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm font-medium">
                  Professores: {presencaList.filter((p) => p.presente).length} de {presencaList.length} presentes
                </span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleMarcarTodosPresenca(true)}>
                    <CheckCircle2 size={14} className="mr-1 text-success" />
                    Todos Presentes
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleMarcarTodosPresenca(false)}>
                    <XCircle size={14} className="mr-1 text-destructive" />
                    Todos Ausentes
                  </Button>
                </div>
              </div>

              {/* Lista de professores */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {professoresPresenca.map((prof) => {
                  const presencaItem = presencaList.find((p) => p.professorId === prof.id);
                  const isPresente = presencaItem?.presente ?? false;

                  return (
                    <div
                      key={prof.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                        isPresente ? "border-success/50 bg-success/5" : "border-border hover:border-muted-foreground",
                      )}
                      onClick={() => handleTogglePresenca(prof.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isPresente} onCheckedChange={() => handleTogglePresenca(prof.id)} />
                        <div>
                          <p className="font-medium">{prof.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {segmentoLabels[prof.segmento as Segmento] || prof.segmento} • {prof.ano_serie}
                          </p>
                        </div>
                      </div>
                      {isPresente ? (
                        <CheckCircle2 size={18} className="text-success" />
                      ) : (
                        <XCircle size={18} className="text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPresencaDialogOpen(false);
                    setIsManageDialogOpen(true);
                  }}
                >
                  Voltar
                </Button>
                <Button onClick={handleSavePresencas} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Salvar Presenças"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Instrumento Pedagógico Dialog */}
      <Dialog
        open={isInstrumentDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleInstrumentDialogCloseRequest();
          } else {
            setIsInstrumentDialogOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="text-primary" size={20} />
              {selectedProgramacao ? getAcaoLabel(selectedProgramacao.tipo) : "Instrumento Pedagógico"}
            </DialogTitle>
            <DialogDescription>
              {selectedProgramacao && (
                <span>
                  {selectedProgramacao.titulo} -{" "}
                  {format(parseISO(selectedProgramacao.data), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedProgramacao && (
            <div className="space-y-6 mt-4">
              <InstrumentForm
                formType={normalizeAcaoTipo(selectedProgramacao.tipo)}
                responses={instrumentResponses}
                onResponseChange={(fieldKey, value) =>
                  setInstrumentResponses((prev) => ({ ...prev, [fieldKey]: value }))
                }
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleInstrumentDialogCloseRequest}
                >
                  Voltar
                </Button>
                <Button onClick={handleSaveInstrument} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Salvar Instrumento"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação ao fechar instrumento sem salvar (regra: ação volta para 'prevista') */}
      <AlertDialog open={isConfirmRevertOpen} onOpenChange={setIsConfirmRevertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Formulário não preenchido</AlertDialogTitle>
            <AlertDialogDescription>
              O instrumento pedagógico desta ação ainda não foi preenchido. Se você sair agora,
              a ação voltará para o status <strong>"Prevista"</strong> e precisará ser confirmada
              novamente quando o formulário for preenchido. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar preenchendo</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRevertToPrevista}>
              Sim, voltar para Prevista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Consultoria Pedagógica Dialog */}
      <Dialog open={isConsultoriaDialogOpen} onOpenChange={setIsConsultoriaDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-auto sm:max-w-4xl rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="text-primary" size={20} />
              Registro da Consultoria Pedagógica
            </DialogTitle>
            <DialogDescription>
              {selectedProgramacao && (
                <span>
                  {selectedProgramacao.titulo} -{" "}
                  {format(parseISO(selectedProgramacao.data), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {consultoriaRegistroId && selectedProgramacao && (
            <ConsultoriaPedagogicaForm
              registroAcaoId={consultoriaRegistroId}
              escolaId={selectedProgramacao.escola_id}
              aapId={user?.id || ""}
              onSuccess={async () => {
                await supabase.from("programacoes").update({ status: "realizada" }).eq("id", selectedProgramacao.id);
                setIsConsultoriaDialogOpen(false);
                setSelectedProgramacao(null);
                setConsultoriaRegistroId(null);
                queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
                queryClient.invalidateQueries({ queryKey: ["programacoes"] });
                fetchProgramacoes();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Monitoramento de Ações Formativas (Regionais) — fluxo dedicado */}
      {selectedProgramacao && user && isMonitRegionaisManaging && monitRegionaisRegistroId && (
        <MonitoramentoRegionaisManageDialog
          open={isMonitRegionaisManaging}
          registroAcaoId={monitRegionaisRegistroId}
          escolaId={selectedProgramacao.escola_id}
          escolaNome={getEscolaNome(selectedProgramacao.escola_id)}
          userId={user.id}
          registroStatus="prevista"
          programacaoId={selectedProgramacao.id}
          onClose={() => {
            setIsMonitRegionaisManaging(false);
            setMonitRegionaisRegistroId(null);
            setSelectedProgramacao(null);
          }}
          onSuccess={() => {
            setIsMonitRegionaisManaging(false);
            setMonitRegionaisRegistroId(null);
            setSelectedProgramacao(null);
            queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
            queryClient.invalidateQueries({ queryKey: ["programacoes"] });
            fetchProgramacoes();
          }}
        />
      )}

      {/* Monitoramento e Gestão (Regionais) — formulário dedicado */}
      {selectedProgramacao && user && isMonitGestaoManaging && monitGestaoRegistroId && (
        <Dialog
          open={isMonitGestaoManaging}
          onOpenChange={(open) => {
            if (open) return;
            if (
              selectedProgramacao.status === "realizada" &&
              !instrumentHadSavedResponse
            ) {
              setIsConfirmRevertOpen(true);
              return;
            }
            setIsMonitGestaoManaging(false);
            setMonitGestaoRegistroId(null);
            setMonitGestaoInitial(null);
            setSelectedProgramacao(null);
          }}
        >
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="text-primary" size={20} />
                Monitoramento e Gestão
              </DialogTitle>
              <DialogDescription>
                <span>
                  {selectedProgramacao.titulo} -{" "}
                  {format(parseISO(selectedProgramacao.data), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </DialogDescription>
            </DialogHeader>
            <MonitoramentoGestaoForm
              registroAcaoId={monitGestaoRegistroId}
              escolaId={selectedProgramacao.escola_id}
              aapId={user.id}
              entidades={[{ id: selectedProgramacao.escola_id, nome: getEscolaNome(selectedProgramacao.escola_id) }]}
              data={selectedProgramacao.data}
              horarioInicio={selectedProgramacao.horario_inicio || ""}
              initialValues={monitGestaoInitial}
              onCancel={() => {
                if (
                  selectedProgramacao.status === "realizada" &&
                  !instrumentHadSavedResponse
                ) {
                  setIsConfirmRevertOpen(true);
                  return;
                }
                setIsMonitGestaoManaging(false);
                setMonitGestaoRegistroId(null);
                setMonitGestaoInitial(null);
                setSelectedProgramacao(null);
              }}
              onSuccess={async () => {
                await supabase.from("programacoes").update({ status: "realizada" }).eq("id", selectedProgramacao.id);
                await supabase
                  .from("registros_acao")
                  .update({ status: "realizada" })
                  .eq("id", monitGestaoRegistroId);
                setInstrumentHadSavedResponse(true);
                setIsMonitGestaoManaging(false);
                setMonitGestaoRegistroId(null);
                setMonitGestaoInitial(null);
                setSelectedProgramacao(null);
                queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
                queryClient.invalidateQueries({ queryKey: ["programacoes"] });
                queryClient.invalidateQueries({ queryKey: ["instrument_responses"] });
                fetchProgramacoes();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Visitas Técnicas - Microciclos — formulário dedicado */}
      {selectedProgramacao && user && isRedesManaging && redesRegistroId && (
        <Dialog
          open={isRedesManaging}
          onOpenChange={(open) => {
            if (open) return;
            setIsRedesManaging(false);
            setRedesRegistroId(null);
            setSelectedProgramacao(null);
          }}
        >
          <DialogContent className="max-w-4xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Visitas Técnicas - Microciclos
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  — {getEscolaNome(selectedProgramacao.escola_id)}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto pr-4">
              <VisitaTecnicaMicrociclosForm
                entidades={[{ id: selectedProgramacao.escola_id, nome: getEscolaNome(selectedProgramacao.escola_id) }]}
                data={selectedProgramacao.data}
                horarioInicio={selectedProgramacao.horario_inicio || ""}
                horarioFim={selectedProgramacao.horario_fim || ""}
                formadorNome={getAapNome(selectedProgramacao.aap_id)}
                registroAcaoId={redesRegistroId}
                entidadeFilhoId={(selectedProgramacao as any).entidade_filho_id || undefined}
                onSuccess={async () => {
                  await supabase.from("programacoes").update({ status: "realizada" }).eq("id", selectedProgramacao.id);
                  await supabase.from("registros_acao").update({ status: "realizada" }).eq("id", redesRegistroId);
                  setIsRedesManaging(false);
                  setRedesRegistroId(null);
                  setSelectedProgramacao(null);
                  queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
                  queryClient.invalidateQueries({ queryKey: ["programacoes"] });
                  queryClient.invalidateQueries({ queryKey: ["instrument_responses"] });
                  fetchProgramacoes();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Observação de Aula (GPA) — formulário dedicado */}
      {selectedProgramacao && user && isGpaManaging && gpaRegistroId && (
        <Dialog
          open={isGpaManaging}
          onOpenChange={(open) => {
            if (open) return;
            setIsGpaManaging(false);
            setGpaRegistroId(null);
            setSelectedProgramacao(null);
          }}
        >
          <DialogContent className="max-w-4xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Observação de Aula (GPA)
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  — {getEscolaNome(selectedProgramacao.escola_id)}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto pr-4">
              <ObservacaoAulaGpaForm
                municipio={getEscolaNome(selectedProgramacao.escola_id)}
                escolaPaiId={selectedProgramacao.escola_id}
                data={selectedProgramacao.data}
                horarioInicio={selectedProgramacao.horario_inicio || ""}
                horarioFim={selectedProgramacao.horario_fim || ""}
                observadorNome={getAapNome(selectedProgramacao.aap_id)}
                registroAcaoId={gpaRegistroId}
                onSuccess={async () => {
                  await supabase.from("programacoes").update({ status: "realizada" }).eq("id", selectedProgramacao.id);
                  await supabase.from("registros_acao").update({ status: "realizada" }).eq("id", gpaRegistroId);
                  setIsGpaManaging(false);
                  setGpaRegistroId(null);
                  setSelectedProgramacao(null);
                  queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
                  queryClient.invalidateQueries({ queryKey: ["programacoes"] });
                  fetchProgramacoes();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedProgramacao && user && isAlfabManaging && alfabRegistroId && (
        <Dialog
          open={isAlfabManaging}
          onOpenChange={(open) => {
            if (open) return;
            setIsAlfabManaging(false);
            setAlfabRegistroId(null);
            setSelectedProgramacao(null);
          }}
        >
          <DialogContent className="max-w-4xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Visita Técnica — IAB (REDES)
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  — {getEscolaNome(selectedProgramacao.escola_id)}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto pr-4">
              <VisitaTecnicaAlfabetizacaoRedesForm
                entidades={[{ id: selectedProgramacao.escola_id, nome: getEscolaNome(selectedProgramacao.escola_id) }]}
                data={selectedProgramacao.data}
                horario={selectedProgramacao.horario_inicio || ""}
                tecnicoVisitanteNome={getAapNome(selectedProgramacao.aap_id)}
                registroAcaoId={alfabRegistroId}
                onSuccess={async () => {
                  await supabase.from("programacoes").update({ status: "realizada" }).eq("id", selectedProgramacao.id);
                  await supabase.from("registros_acao").update({ status: "realizada" }).eq("id", alfabRegistroId);
                  setIsAlfabManaging(false);
                  setAlfabRegistroId(null);
                  setSelectedProgramacao(null);
                  queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
                  queryClient.invalidateQueries({ queryKey: ["programacoes"] });
                  queryClient.invalidateQueries({ queryKey: ["instrument_responses"] });
                  fetchProgramacoes();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedProgramacao && user && isTarlManaging && tarlRegistroId && (
        <Dialog
          open={isTarlManaging}
          onOpenChange={(open) => {
            if (open) return;
            setIsTarlManaging(false);
            setTarlRegistroId(null);
            setSelectedProgramacao(null);
          }}
        >
          <DialogContent className="max-w-4xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Visita Técnica — T@RL
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  — {getEscolaNome(selectedProgramacao.escola_id)}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto pr-4">
              <VisitaTecnicaTarlForm
                entidades={[{ id: selectedProgramacao.escola_id, nome: getEscolaNome(selectedProgramacao.escola_id) }]}
                data={selectedProgramacao.data}
                horarioInicio={selectedProgramacao.horario_inicio || ""}
                horarioFim={selectedProgramacao.horario_fim || ""}
                anoSerie={selectedProgramacao.ano_serie || ""}
                turma={selectedProgramacao.turma_formacao || ""}
                modalidade={(selectedProgramacao as any).modalidade || ""}
                tecnicoVisitanteNome={getAapNome(selectedProgramacao.aap_id)}
                registroAcaoId={tarlRegistroId}
                entidadeFilhoId={(selectedProgramacao as any).entidade_filho_id || undefined}
                onSuccess={async () => {
                  await supabase.from("programacoes").update({ status: "realizada" }).eq("id", selectedProgramacao.id);
                  await supabase.from("registros_acao").update({ status: "realizada" }).eq("id", tarlRegistroId);
                  setIsTarlManaging(false);
                  setTarlRegistroId(null);
                  setSelectedProgramacao(null);
                  queryClient.invalidateQueries({ queryKey: ["registros_acao"] });
                  queryClient.invalidateQueries({ queryKey: ["programacoes"] });
                  queryClient.invalidateQueries({ queryKey: ["instrument_responses"] });
                  fetchProgramacoes();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}





      <AcaoPrintDialog
        open={!!printProgramacaoId}
        onOpenChange={(v) => !v && setPrintProgramacaoId(null)}
        programacaoId={printProgramacaoId}
      />
    </div>
  );
}
