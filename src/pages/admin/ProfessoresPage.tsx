import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Upload, Download, FileSpreadsheet, Loader2, CheckCircle, XCircle, Power, Calendar, KeyRound, Eye, EyeOff, Link2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Segmento, ComponenteCurricular, CargoProfessor } from '@/types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { roleLabelsMap, getRoleTierColor } from '@/config/roleConfig';
import type { AppRole } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Programa de Regionais de Ensino',
  redes_municipais: 'Programa de Redes Municipais',
};

interface Escola {
  id: string;
  nome: string;
  ativa: boolean;
}

interface Professor {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  escola_id: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  cargo: string;
  ativo: boolean;
  created_at: string;
  data_desativacao: string | null;
  escolas?: Escola;
  programa: ProgramaType[] | null;
  user_id: string | null;
  turma_formacao: string | null;
}

interface SystemUser {
  id: string;
  nome: string;
  email: string;
  role: AppRole | null;
}

const segmentoLabels: Record<string, string> = {
  nao_se_aplica: 'Não se aplica',
  anos_iniciais: 'Anos Iniciais',
  anos_finais: 'Anos Finais',
  ensino_medio: 'Ensino Médio',
  todos: 'Todos os Segmentos',
};

const componenteLabels: Record<string, string> = {
  nao_se_aplica: 'Não se aplica',
  polivalente: 'Polivalente',
  lingua_portuguesa: 'Língua Portuguesa',
  matematica: 'Matemática',
};

const cargoLabels: Record<string, string> = {
  professor: 'Professor',
  coordenador: 'Coordenador',
  vice_diretor: 'Vice-Diretor',
  diretor: 'Diretor',
  equipe_tecnica_sme: 'Equipe Técnica (SME)',
};

const anoSerieOptions: Record<string, string[]> = {
  anos_iniciais: ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'],
  anos_finais: ['6º Ano', '7º Ano', '8º Ano', '9º Ano'],
  ensino_medio: ['1ª Série', '2ª Série', '3ª Série'],
};

export default function ProfessoresPage() {
  const { isAdminOrGestor, isAAP, isManager, user, profile } = useAuth();
  const canBatchImport = isAdminOrGestor || isManager || isAAP;
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [aapEscolasIds, setAapEscolasIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEscola, setFilterEscola] = useState('todos');
  const [filterSegmento, setFilterSegmento] = useState('todos');
  const [filterPrograma, setFilterPrograma] = useState('todos');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<{ id: string; nome: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    escola_id: '',
    segmento: 'nao_se_aplica' as Segmento,
    componente: 'nao_se_aplica' as ComponenteCurricular,
    ano_serie: '',
    cargo: 'professor' as CargoProfessor,
    ativo: true,
    programa: ['escolas'] as ProgramaType[],
    user_id: '' as string,
    turma_formacao: '',
  });

  // Verifica se o usuário pode cadastrar professores (admin, gestor ou AAP)
  const canManageProfessores = isAdminOrGestor || isManager || isAAP;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar escolas do AAP se for AAP
      let userAapEscolasIds: string[] = [];
      if (isAAP && user) {
        const { data: aapEscolasData } = await supabase
          .from('aap_escolas')
          .select('escola_id')
          .eq('aap_user_id', user.id);
        
        userAapEscolasIds = (aapEscolasData || []).map(ae => ae.escola_id);
        setAapEscolasIds(userAapEscolasIds);
      }

      const [professoresRes, escolasRes, profilesRes, rolesRes] = await Promise.all([
        supabase
          .from('professores')
          .select('*, escolas(id, nome, ativa)')
          .order('nome'),
        supabase
          .from('escolas')
          .select('id, nome, ativa')
          .eq('ativa', true)
          .order('nome'),
        supabase.from('profiles').select('id, nome, email').order('nome'),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      if (professoresRes.error) throw professoresRes.error;
      if (escolasRes.error) throw escolasRes.error;

      // Build system users list
      const sysUsers: SystemUser[] = (profilesRes.data || []).map(p => {
        const userRole = rolesRes.data?.find(r => r.user_id === p.id);
        return { id: p.id, nome: p.nome, email: p.email, role: (userRole?.role as AppRole) || null };
      });
      setSystemUsers(sysUsers);

      // Filtrar professores para AAP (somente das escolas vinculadas)
      let professoresData = professoresRes.data || [];
      if (isAAP && userAapEscolasIds.length > 0) {
        professoresData = professoresData.filter(p => userAapEscolasIds.includes(p.escola_id));
      }

      setProfessores(professoresData);
      
      // Filtrar escolas para AAP
      let escolasData = escolasRes.data || [];
      if (isAAP && userAapEscolasIds.length > 0) {
        escolasData = escolasData.filter(e => userAapEscolasIds.includes(e.id));
      }
      setEscolas(escolasData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProfessores = professores.filter(prof => {
    const matchesSearch = prof.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEscola = filterEscola === 'todos' || prof.escola_id === filterEscola;
    const matchesSegmento = filterSegmento === 'todos' || prof.segmento === filterSegmento || prof.segmento === 'todos';
    const matchesStatus = showInactive || prof.ativo;
    const matchesPrograma = filterPrograma === 'todos' || prof.programa?.includes(filterPrograma as ProgramaType);
    return matchesSearch && matchesEscola && matchesSegmento && matchesStatus && matchesPrograma;
  });

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchTerm, filterEscola, filterSegmento, filterPrograma, showInactive]);

  // Batch selection helpers
  const filteredIds = filteredProfessores.map(p => p.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        await supabase.from('presencas').delete().eq('professor_id', id);
        await supabase.from('avaliacoes_aula').delete().eq('professor_id', id);
        await supabase.from('instrument_responses').delete().eq('professor_id', id);
        const { error } = await supabase.from('professores').delete().eq('id', id);
        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Error deleting professor ${id}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) toast.success(`${successCount} ator(es) excluído(s) com sucesso!`);
    if (errorCount > 0) toast.error(`${errorCount} ator(es) não puderam ser excluídos.`);

    setSelectedIds(new Set());
    setIsBatchDeleting(false);
    setIsBatchDeleteDialogOpen(false);
    fetchData();
  };

  const handleOpenDialog = (professor?: Professor) => {
    if (professor) {
      setEditingProfessor(professor);
      setFormData({
        nome: professor.nome,
        email: professor.email || '',
        telefone: professor.telefone || '',
        escola_id: professor.escola_id,
        segmento: professor.segmento as Segmento,
        componente: professor.componente as ComponenteCurricular,
        ano_serie: professor.ano_serie,
        cargo: professor.cargo as CargoProfessor,
        ativo: professor.ativo,
        programa: professor.programa || ['escolas'],
        user_id: professor.user_id || '',
        turma_formacao: professor.turma_formacao || '',
      });
    } else {
      setEditingProfessor(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        escola_id: '',
        segmento: 'nao_se_aplica',
        componente: 'nao_se_aplica',
        ano_serie: '',
        cargo: 'professor',
        ativo: true,
        programa: ['escolas'],
        user_id: '',
        turma_formacao: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingProfessor) {
        const { error } = await supabase
          .from('professores')
          .update({
            nome: formData.nome,
            email: formData.email || null,
            telefone: formData.telefone || null,
            escola_id: formData.escola_id,
            segmento: formData.segmento,
            componente: formData.componente,
            ano_serie: formData.ano_serie,
            cargo: formData.cargo,
            ativo: formData.ativo,
            programa: formData.programa,
            user_id: formData.user_id || null,
          } as any)
          .eq('id', editingProfessor.id);

        if (error) throw error;
        toast.success('Professor atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('professores')
          .insert({
            nome: formData.nome,
            email: formData.email || null,
            telefone: formData.telefone || null,
            escola_id: formData.escola_id,
            segmento: formData.segmento,
            componente: formData.componente,
            ano_serie: formData.ano_serie,
            cargo: formData.cargo,
            ativo: formData.ativo,
            programa: formData.programa,
            user_id: formData.user_id || null,
          } as any);

        if (error) throw error;
        toast.success('Professor cadastrado com sucesso!');
      }
      
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving professor:', error);
      toast.error('Erro ao salvar professor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este professor?')) return;
    
    try {
      const { error } = await supabase
        .from('professores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Professor excluído com sucesso!');
      setProfessores(prev => prev.filter(prof => prof.id !== id));
    } catch (error) {
      console.error('Error deleting professor:', error);
      toast.error('Erro ao excluir professor');
    }
  };

  const handleToggleAtivo = async (professor: Professor) => {
    setTogglingId(professor.id);
    const novoStatus = !professor.ativo;
    
    try {
      const { error } = await supabase
        .from('professores')
        .update({
          ativo: novoStatus,
          data_desativacao: novoStatus ? null : new Date().toISOString(),
        })
        .eq('id', professor.id);

      if (error) throw error;
      
      setProfessores(prev => prev.map(p => 
        p.id === professor.id 
          ? { ...p, ativo: novoStatus, data_desativacao: novoStatus ? null : new Date().toISOString() } 
          : p
      ));
      
      toast.success(novoStatus ? 'Professor ativado com sucesso!' : 'Professor desativado com sucesso!');
    } catch (error) {
      console.error('Error toggling professor status:', error);
      toast.error('Erro ao alterar status do professor');
    } finally {
      setTogglingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordTarget || !newPassword) {
      toast.error('Digite a nova senha');
      return;
    }
    if (newPassword.length < 9) {
      toast.error('A senha deve ter pelo menos 9 caracteres');
      return;
    }

    setIsResettingPassword(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action: 'reset-password', userId: passwordTarget.id, newPassword }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Erro ao redefinir senha');
        return;
      }

      toast.success('Senha redefinida com sucesso!');
      setPasswordDialogOpen(false);
      setPasswordTarget(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Erro ao redefinir senha');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Helper to get linked system user info
  const getLinkedUser = (prof: Professor): SystemUser | undefined => {
    if (!prof.user_id) return undefined;
    return systemUsers.find(u => u.id === prof.user_id);
  };

  // Get user_ids already linked to other professors (for filtering the selector)
  const linkedUserIds = professores
    .filter(p => p.user_id && (!editingProfessor || p.id !== editingProfessor.id))
    .map(p => p.user_id!);

  // Mapeamentos para normalização na importação
  const segmentoMap: Record<string, string> = {
    'anos_iniciais': 'anos_iniciais',
    'anos iniciais': 'anos_iniciais',
    'anos finais': 'anos_finais',
    'anos_finais': 'anos_finais',
    'ensino medio': 'ensino_medio',
    'ensino_medio': 'ensino_medio',
    'ensino médio': 'ensino_medio',
    'nao_se_aplica': 'nao_se_aplica',
    'nao se aplica': 'nao_se_aplica',
    'não se aplica': 'nao_se_aplica',
    'n/a': 'nao_se_aplica',
    'todos': 'todos',
  };

  const componenteMap: Record<string, string> = {
    'polivalente': 'polivalente',
    'portugues': 'lingua_portuguesa',
    'português': 'lingua_portuguesa',
    'lingua portuguesa': 'lingua_portuguesa',
    'língua portuguesa': 'lingua_portuguesa',
    'lingua_portuguesa': 'lingua_portuguesa',
    'matematica': 'matematica',
    'matemática': 'matematica',
    'nao_se_aplica': 'nao_se_aplica',
    'nao se aplica': 'nao_se_aplica',
    'não se aplica': 'nao_se_aplica',
    'n/a': 'nao_se_aplica',
  };

  const cargoMap: Record<string, string> = {
    'professor': 'professor',
    'coordenador': 'coordenador',
    'vice-diretor': 'vice_diretor',
    'vice_diretor': 'vice_diretor',
    'diretor': 'diretor',
    'equipe tecnica': 'equipe_tecnica_sme',
    'equipe_tecnica_sme': 'equipe_tecnica_sme',
    'equipe técnica': 'equipe_tecnica_sme',
    'equipe técnica (sme)': 'equipe_tecnica_sme',
  };

  const programaMap: Record<string, ProgramaType> = {
    'escolas': 'escolas',
    'programa de escolas': 'escolas',
    'regionais': 'regionais',
    'programa de regionais': 'regionais',
    'programa de regionais de ensino': 'regionais',
    'redes_municipais': 'redes_municipais',
    'redes municipais': 'redes_municipais',
    'programa de redes municipais': 'redes_municipais',
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Buscar todas as escolas para mapear por codesc e nome
    const { data: todasEscolas, error: escolasError } = await supabase
      .from('escolas')
      .select('id, nome, codesc');

    if (escolasError) {
      console.error('Error fetching escolas for import:', escolasError);
      toast.error(`Erro ao carregar escolas para importação: ${escolasError.message}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
          throw new Error('Não foi possível ler o arquivo selecionado.');
        }

        let workbook: XLSX.WorkBook;
        try {
          workbook = XLSX.read(new Uint8Array(arrayBuffer as ArrayBuffer), { type: 'array' });
        } catch {
          throw new Error('Arquivo inválido. Envie um Excel .xlsx gerado pelo modelo.');
        }

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('Planilha vazia: nenhuma aba encontrada.');

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error('Planilha sem dados. Preencha linhas abaixo do cabeçalho.');
        }

        // Mapear escolas por nome e codesc
        const escolaByNome = new Map<string, string>();
        const escolaByCodesc = new Map<string, string>();

        todasEscolas?.forEach((e) => {
          escolaByNome.set(e.nome.toLowerCase().trim(), e.id);
          if (e.codesc) {
            escolaByCodesc.set(e.codesc.toLowerCase().trim(), e.id);
          }
        });

        const findEscolaId = (escolaValue: string): string | null => {
          const normalized = escolaValue.toLowerCase().trim();
          return escolaByCodesc.get(normalized) || escolaByNome.get(normalized) || null;
        };

        const normalizePrograma = (value: string): ProgramaType[] => {
          if (!value) return ['escolas'];
          const programas = value.split(/[,;]/).map((p) => p.trim().toLowerCase());
          return programas.map((p) => programaMap[p]).filter((p): p is ProgramaType => !!p);
        };

        const errors: string[] = [];
        const newProfessores = jsonData
          .map((row: Record<string, unknown>, index: number) => {
            const rowNum = index + 2; // +2 porque Excel começa em 1 e tem cabeçalho

            const escolaValue = String(row['Escola'] || row['escola'] || row['Codesc'] || row['codesc'] || '');
            const escolaId = findEscolaId(escolaValue);

            if (!escolaId) {
              errors.push(`Linha ${rowNum}: Escola "${escolaValue}" não encontrada`);
            }

            const segmentoRaw = String(row['Segmento'] || row['segmento'] || '').toLowerCase().trim();
            const segmento = segmentoMap[segmentoRaw];
            if (!segmento && segmentoRaw) {
              errors.push(`Linha ${rowNum}: Segmento "${segmentoRaw}" inválido`);
            }

            const componenteRaw = String(row['Componente'] || row['componente'] || '').toLowerCase().trim();
            const componente = componenteMap[componenteRaw];
            if (!componente && componenteRaw) {
              errors.push(`Linha ${rowNum}: Componente "${componenteRaw}" inválido`);
            }

            const cargoRaw = String(row['Cargo'] || row['cargo'] || 'professor').toLowerCase().trim();
            const cargo = cargoMap[cargoRaw] || 'professor';

            const programaRaw = String(row['Programa'] || row['programa'] || 'escolas');
            const programa = normalizePrograma(programaRaw);
            if (programa.length === 0) programa.push('escolas');

            return {
              nome: String(row['Nome'] || row['nome'] || '').trim(),
              email: String(row['Email'] || row['email'] || '').trim() || null,
              telefone: String(row['Telefone'] || row['telefone'] || '').trim() || null,
              escola_id: escolaId,
              segmento: segmento || 'nao_se_aplica',
              componente: componente || 'nao_se_aplica',
              ano_serie: String(row['AnoSerie'] || row['ano_serie'] || row['Ano/Série'] || '').trim(),
              cargo,
              ativo: true,
              programa,
            };
          })
          .filter((p) => p.nome && p.escola_id);

        if (errors.length > 0) {
          toast.error(
            `Erros encontrados:\n${errors.slice(0, 5).join('\n')}${
              errors.length > 5 ? `\n...e mais ${errors.length - 5} erros` : ''
            }`
          );
        }

        if (newProfessores.length === 0) {
          toast.error('Nenhum professor válido encontrado no arquivo');
          return;
        }

        const { error: insertError } = await supabase.from('professores').insert(newProfessores);

        if (insertError) throw insertError;

        toast.success(`${newProfessores.length} professores importados com sucesso!`);
        setIsImportDialogOpen(false);
        fetchData();
      } catch (error) {
        console.error('Import error:', error);

        const msg = typeof (error as any)?.message === 'string' ? (error as any).message : 'Erro desconhecido';
        if (/row level security|rls/i.test(msg)) {
          toast.error('Seu usuário não tem permissão para importar professores.');
          return;
        }

        toast.error(`Erro ao importar: ${msg}`);
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportTemplate = () => {
    // Aba 1 — Atores (dados a preencher)
    const template = [
      { Nome: 'Maria Silva', Email: 'maria@escola.edu.br', Telefone: '(11) 99999-9999', Escola: 'Nome da Escola', Segmento: 'anos_iniciais', Componente: 'polivalente', 'Ano/Série': '1º Ano', Cargo: 'professor', Programa: 'escolas' },
    ];

    // Aba 2 — Valores Válidos (guia de referência)
    const valoresValidos = [
      { Campo: 'Segmento', Valor: 'nao_se_aplica', Descrição: 'Não se aplica (Diretor, Vice-Diretor, Equipe Técnica)' },
      { Campo: 'Segmento', Valor: 'anos_iniciais', Descrição: 'Anos Iniciais' },
      { Campo: 'Segmento', Valor: 'anos_finais', Descrição: 'Anos Finais' },
      { Campo: 'Segmento', Valor: 'ensino_medio', Descrição: 'Ensino Médio' },
      { Campo: 'Segmento', Valor: 'todos', Descrição: 'Todos os Segmentos (atua em todos)' },
      { Campo: 'Componente', Valor: 'nao_se_aplica', Descrição: 'Não se aplica' },
      { Campo: 'Componente', Valor: 'polivalente', Descrição: 'Polivalente' },
      { Campo: 'Componente', Valor: 'lingua_portuguesa', Descrição: 'Língua Portuguesa' },
      { Campo: 'Componente', Valor: 'matematica', Descrição: 'Matemática' },
      { Campo: 'Ano/Série', Valor: '1º Ano', Descrição: 'Anos Iniciais' },
      { Campo: 'Ano/Série', Valor: '2º Ano', Descrição: 'Anos Iniciais' },
      { Campo: 'Ano/Série', Valor: '3º Ano', Descrição: 'Anos Iniciais' },
      { Campo: 'Ano/Série', Valor: '4º Ano', Descrição: 'Anos Iniciais' },
      { Campo: 'Ano/Série', Valor: '5º Ano', Descrição: 'Anos Iniciais' },
      { Campo: 'Ano/Série', Valor: '6º Ano', Descrição: 'Anos Finais' },
      { Campo: 'Ano/Série', Valor: '7º Ano', Descrição: 'Anos Finais' },
      { Campo: 'Ano/Série', Valor: '8º Ano', Descrição: 'Anos Finais' },
      { Campo: 'Ano/Série', Valor: '9º Ano', Descrição: 'Anos Finais' },
      { Campo: 'Ano/Série', Valor: '1ª Série', Descrição: 'Ensino Médio' },
      { Campo: 'Ano/Série', Valor: '2ª Série', Descrição: 'Ensino Médio' },
      { Campo: 'Ano/Série', Valor: '3ª Série', Descrição: 'Ensino Médio' },
      { Campo: 'Ano/Série', Valor: 'todos', Descrição: 'Todos os Anos/Séries (atua em todos)' },
      { Campo: 'Cargo', Valor: 'professor', Descrição: 'Professor' },
      { Campo: 'Cargo', Valor: 'coordenador', Descrição: 'Coordenador' },
      { Campo: 'Cargo', Valor: 'vice_diretor', Descrição: 'Vice-Diretor' },
      { Campo: 'Cargo', Valor: 'diretor', Descrição: 'Diretor' },
      { Campo: 'Cargo', Valor: 'equipe_tecnica_sme', Descrição: 'Equipe Técnica (SME)' },
      { Campo: 'Programa', Valor: 'escolas', Descrição: 'Programa de Escolas' },
      { Campo: 'Programa', Valor: 'regionais', Descrição: 'Programa de Regionais de Ensino' },
      { Campo: 'Programa', Valor: 'redes_municipais', Descrição: 'Programa de Redes Municipais' },
    ];

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws1, 'Atores');

    const ws2 = XLSX.utils.json_to_sheet(valoresValidos);
    XLSX.utils.book_append_sheet(wb, ws2, 'Valores Válidos');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'modelo_atores_educacionais.xlsx');
    toast.success('Modelo baixado com sucesso!');
  };

  const handleExportData = () => {
    const exportData = professores.map(prof => ({
      Nome: prof.nome,
      Email: prof.email,
      Telefone: prof.telefone,
      Escola: prof.escolas?.nome || '',
      Segmento: segmentoLabels[prof.segmento] || prof.segmento,
      Componente: componenteLabels[prof.componente] || prof.componente,
      AnoSerie: prof.ano_serie,
      Cargo: cargoLabels[prof.cargo] || prof.cargo,
      Ativo: prof.ativo ? 'Sim' : 'Não',
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Professores');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'professores.xlsx');
    toast.success('Dados exportados com sucesso!');
  };

  // Stats
  const totalProfessores = professores.filter(p => p.cargo === 'professor' && p.ativo).length;
  const totalCoordenadores = professores.filter(p => p.cargo === 'coordenador' && p.ativo).length;

  const columns = [
    ...(isAdminOrGestor ? [{
      key: 'select',
      header: () => (
        <Checkbox
          checked={allSelected}
          onCheckedChange={handleToggleSelectAll}
          aria-label="Selecionar todos"
        />
      ),
      className: 'w-10',
      render: (prof: Professor) => (
        <Checkbox
          checked={selectedIds.has(prof.id)}
          onCheckedChange={() => handleToggleSelect(prof.id)}
          aria-label={`Selecionar ${prof.nome}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    }] : []),
    {
      key: 'status',
      header: 'Status',
      className: 'w-28',
      render: (prof: Professor) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                {prof.ativo ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                    <CheckCircle size={12} />
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <XCircle size={12} />
                    Inativo
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar size={10} />
                  <span>Inclusão: {format(parseISO(prof.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                {prof.data_desativacao && (
                  <div className="flex items-center gap-1 text-destructive">
                    <XCircle size={10} />
                    <span>Desativado: {format(parseISO(prof.data_desativacao), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      key: 'nome',
      header: 'Nome',
      render: (prof: Professor) => (
        <div className={!prof.ativo ? 'opacity-60' : ''}>
          <p className="font-medium text-foreground">{prof.nome}</p>
          {prof.email && <p className="text-sm text-muted-foreground">{prof.email}</p>}
        </div>
      ),
    },
    {
      key: 'cargo',
      header: 'Cargo',
      render: (prof: Professor) => (
        <StatusBadge variant={prof.cargo === 'coordenador' ? 'warning' : 'default'}>
          {cargoLabels[prof.cargo] || prof.cargo}
        </StatusBadge>
      ),
    },
    {
      key: 'escola',
      header: 'Escola',
      render: (prof: Professor) => (
        <span className="text-sm">{prof.escolas?.nome || '-'}</span>
      ),
    },
    {
      key: 'segmento',
      header: 'Segmento',
      render: (prof: Professor) => (
        <StatusBadge variant="primary">{segmentoLabels[prof.segmento] || prof.segmento}</StatusBadge>
      ),
    },
    {
      key: 'componente',
      header: 'Componente',
      render: (prof: Professor) => (
        <StatusBadge variant="info">{componenteLabels[prof.componente] || prof.componente}</StatusBadge>
      ),
    },
    {
      key: 'anoSerie',
      header: 'Ano/Série',
      render: (prof: Professor) => <span>{prof.ano_serie}</span>,
    },
    {
      key: 'programa',
      header: 'Programas',
      render: (prof: Professor) => (
        <div className="flex flex-wrap gap-1">
          {prof.programa?.map(p => (
            <span key={p} className="inline-flex text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
              {p === 'escolas' ? 'Escolas' : p === 'regionais' ? 'Regionais' : 'Redes Mun.'}
            </span>
          )) || '-'}
        </div>
      ),
    },
    {
      key: 'usuario',
      header: 'Usuário',
      render: (prof: Professor) => {
        const linkedUser = getLinkedUser(prof);
        if (!linkedUser) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">{linkedUser.nome}</p>
              <Badge variant="outline" className={`text-[10px] ${getRoleTierColor(linkedUser.role)}`}>
                {linkedUser.role ? (roleLabelsMap[linkedUser.role] || linkedUser.role) : 'Sem papel'}
              </Badge>
            </div>
            {canManageProfessores && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPasswordTarget({ id: linkedUser.id, nome: linkedUser.nome });
                        setNewPassword('');
                        setShowPassword(false);
                        setPasswordDialogOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <KeyRound size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Redefinir senha</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    ...(canManageProfessores ? [{
      key: 'actions',
      header: 'Ações',
      className: 'w-32',
      render: (prof: Professor) => (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleToggleAtivo(prof)}
                  disabled={togglingId === prof.id}
                  className={`p-2 rounded-lg transition-colors ${
                    prof.ativo 
                      ? 'hover:bg-warning/10 text-muted-foreground hover:text-warning' 
                      : 'hover:bg-success/10 text-muted-foreground hover:text-success'
                  }`}
                >
                  {togglingId === prof.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Power size={16} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {prof.ativo ? 'Desativar' : 'Ativar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <button
            onClick={() => handleOpenDialog(prof)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 size={16} />
          </button>
          {isAdminOrGestor && (
            <button
              onClick={() => handleDelete(prof.id)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Atores Educacionais</h1>
          <p className="page-subtitle">
            {totalProfessores} professores e {totalCoordenadores} coordenadores ativos
          </p>
        </div>
        
        {canManageProfessores && (
          <div className="flex flex-wrap gap-3">
            {canBatchImport && (
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <button className="btn-outline flex items-center gap-2">
                    <Upload size={18} />
                    Importar
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Importar Atores Educacionais</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground mb-2">Formato do arquivo:</p>
                      <ul className="space-y-1 text-xs">
                        <li><span className="font-medium">Nome:</span> Nome completo do ator educacional <span className="text-destructive">(obrigatório)</span></li>
                        <li><span className="font-medium">Email:</span> Email (opcional)</li>
                        <li><span className="font-medium">Telefone:</span> Telefone (opcional)</li>
                        <li><span className="font-medium">Escola:</span> Nome ou CODESC da escola <span className="text-destructive">(obrigatório)</span></li>
                        <li><span className="font-medium">Segmento:</span> <code className="bg-muted px-1 rounded text-xs">anos_iniciais</code> | <code className="bg-muted px-1 rounded text-xs">anos_finais</code> | <code className="bg-muted px-1 rounded text-xs">ensino_medio</code></li>
                        <li><span className="font-medium">Componente:</span> <code className="bg-muted px-1 rounded text-xs">polivalente</code> | <code className="bg-muted px-1 rounded text-xs">lingua_portuguesa</code> | <code className="bg-muted px-1 rounded text-xs">matematica</code></li>
                        <li><span className="font-medium">Ano/Série:</span> <code className="bg-muted px-1 rounded text-xs">1º Ano</code> ... <code className="bg-muted px-1 rounded text-xs">9º Ano</code>, <code className="bg-muted px-1 rounded text-xs">1ª Série</code> ...</li>
                        <li><span className="font-medium">Cargo:</span> <code className="bg-muted px-1 rounded text-xs">professor</code> | <code className="bg-muted px-1 rounded text-xs">coordenador</code> | <code className="bg-muted px-1 rounded text-xs">diretor</code> ...</li>
                        <li><span className="font-medium">Programa:</span> <code className="bg-muted px-1 rounded text-xs">escolas</code> | <code className="bg-muted px-1 rounded text-xs">regionais</code> | <code className="bg-muted px-1 rounded text-xs">redes_municipais</code></li>
                      </ul>
                      <p className="text-xs mt-2 text-muted-foreground italic">Baixe o modelo para ver os valores válidos na aba "Valores Válidos".</p>
                    </div>
                    <button
                      onClick={handleExportTemplate}
                      className="w-full btn-outline flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Baixar Modelo
                    </button>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                      <FileSpreadsheet className="mx-auto text-muted-foreground mb-3" size={40} />
                      <p className="text-sm text-muted-foreground mb-3">
                        Arraste um arquivo ou clique para selecionar
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportFile}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="btn-primary cursor-pointer inline-block">
                        Selecionar Arquivo
                      </label>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {canBatchImport && (
              <button onClick={handleExportData} className="btn-outline flex items-center gap-2">
                <Download size={18} />
                Exportar
              </button>
            )}
           
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button onClick={() => handleOpenDialog()} className="btn-primary flex items-center gap-2">
                  <Plus size={20} />
                  Novo Ator
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingProfessor ? 'Editar Professor' : 'Novo Professor'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="form-label">Nome *</label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="input-field"
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-field"
                        placeholder="email@escola.edu.br"
                      />
                    </div>
                    <div>
                      <label className="form-label">Telefone</label>
                      <input
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="input-field"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="form-label">Escola *</label>
                      <select
                        value={formData.escola_id}
                        onChange={(e) => setFormData({ ...formData, escola_id: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">Selecione a escola</option>
                        {escolas.map(escola => (
                          <option key={escola.id} value={escola.id}>{escola.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Segmento</label>
                      <select
                        value={formData.segmento}
                        onChange={(e) => {
                          const newSegmento = e.target.value as Segmento;
                          setFormData({ 
                            ...formData, 
                            segmento: newSegmento,
                            componente: newSegmento === 'nao_se_aplica' ? 'nao_se_aplica' : formData.componente,
                            ano_serie: newSegmento === 'todos' ? 'todos' : ''
                          });
                        }}
                        className="input-field"
                      >
                        {Object.entries(segmentoLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Componente</label>
                      <select
                        value={formData.componente}
                        onChange={(e) => setFormData({ ...formData, componente: e.target.value as ComponenteCurricular })}
                        className="input-field"
                      >
                        {Object.entries(componenteLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="form-label">Ano/Série</label>
                      <select
                        value={formData.ano_serie}
                        onChange={(e) => setFormData({ ...formData, ano_serie: e.target.value })}
                        className="input-field"
                        disabled={formData.segmento === 'nao_se_aplica' || formData.segmento === 'todos'}
                      >
                        <option value="">Não se aplica</option>
                        {formData.segmento === 'todos' && (
                          <option value="todos">Todos os Anos/Séries</option>
                        )}
                        {formData.segmento !== 'nao_se_aplica' && formData.segmento !== 'todos' && anoSerieOptions[formData.segmento]?.map(ano => (
                          <option key={ano} value={ano}>{ano}</option>
                        ))}
                        {formData.segmento !== 'nao_se_aplica' && formData.segmento !== 'todos' && (
                          <option value="todos">Todos os Anos/Séries</option>
                        )}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="form-label">Cargo *</label>
                      <select
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value as CargoProfessor })}
                        className="input-field"
                        required
                      >
                        {Object.entries(cargoLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    {editingProfessor && (
                      <div className="col-span-2 flex items-center justify-between py-2">
                        <div>
                          <label className="form-label mb-0">Professor Ativo</label>
                          <p className="text-xs text-muted-foreground">Desativar mantém o histórico</p>
                        </div>
                        <Switch
                          checked={formData.ativo}
                          onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                        />
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="form-label">Programas *</label>
                      <div className="space-y-2">
                        {(['escolas', 'regionais', 'redes_municipais'] as ProgramaType[]).map(prog => (
                          <label key={prog} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.programa.includes(prog)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, programa: [...formData.programa, prog] });
                                } else {
                                  setFormData({ ...formData, programa: formData.programa.filter(p => p !== prog) });
                                }
                              }}
                              className="rounded border-border"
                            />
                            <span className="text-sm">{programaLabels[prog]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {canManageProfessores && (
                      <div className="col-span-2">
                        <label className="form-label flex items-center gap-1">
                          <Link2 size={14} />
                          Usuário do Sistema
                        </label>
                        <select
                          value={formData.user_id}
                          onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                          className="input-field"
                        >
                          <option value="">Nenhum (sem vínculo)</option>
                          {systemUsers
                            .filter(u => !linkedUserIds.includes(u.id) || u.id === formData.user_id)
                            .map(u => (
                              <option key={u.id} value={u.id}>
                                {u.nome} ({u.email}){u.role ? ` — ${roleLabelsMap[u.role] || u.role}` : ''}
                              </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vincule a um usuário cadastrado para permitir redefinição de senha
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      className="btn-outline flex-1"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        editingProfessor ? 'Salvar' : 'Cadastrar'
                      )}
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="input-field pl-11"
          />
        </div>
        <select
          value={filterEscola}
          onChange={(e) => setFilterEscola(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="todos">Escola</option>
          {escolas.map(escola => (
            <option key={escola.id} value={escola.id}>{escola.nome}</option>
          ))}
        </select>
        <select
          value={filterSegmento}
          onChange={(e) => setFilterSegmento(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="todos">Segmento</option>
          {Object.entries(segmentoLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={filterPrograma}
          onChange={(e) => setFilterPrograma(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="todos">Programa</option>
          <option value="escolas">Programa de Escolas</option>
          <option value="regionais">Regionais de Ensino</option>
          <option value="redes_municipais">Redes Municipais</option>
        </select>
        <div className="flex items-center gap-2">
          <Switch
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <span className="text-sm text-muted-foreground">Mostrar inativos</span>
        </div>
      </div>

      {/* Batch action bar */}
      {isAdminOrGestor && selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium">
            {selectedIds.size} ator(es) selecionado(s)
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Limpar seleção
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBatchDeleteDialogOpen(true)}
              disabled={isBatchDeleting}
            >
              <Trash2 size={14} className="mr-1" />
              Excluir selecionados
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        data={filteredProfessores}
        columns={columns}
        keyExtractor={(prof) => prof.id}
        emptyMessage="Nenhum professor encontrado"
      />

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Tem certeza que deseja excluir <strong>{selectedIds.size}</strong> ator(es) educacional(is)?</p>
                <p className="mt-2 text-destructive text-sm">
                  Esta ação não pode ser desfeita. Presenças, avaliações e respostas de instrumentos
                  vinculadas a estes atores também serão excluídas permanentemente.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBatchDeleting ? (
                <><Loader2 size={14} className="mr-1 animate-spin" />Excluindo...</>
              ) : (
                `Excluir ${selectedIds.size} ator(es)`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Redefinir Senha
            </DialogTitle>
          </DialogHeader>
          {passwordTarget && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Redefinir senha de <strong>{passwordTarget.nome}</strong>
              </p>
              <div>
                <Label>Nova Senha *</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 9 caracteres"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPasswordDialogOpen(false)}
                  disabled={isResettingPassword}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword || newPassword.length < 9}
                >
                  {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Redefinir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
