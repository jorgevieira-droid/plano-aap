import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Upload, Download, FileSpreadsheet, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Segmento, ComponenteCurricular, CargoProfessor } from '@/types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  escolas?: Escola;
  programa: ProgramaType[] | null;
}

const segmentoLabels: Record<string, string> = {
  anos_iniciais: 'Anos Iniciais',
  anos_finais: 'Anos Finais',
  ensino_medio: 'Ensino Médio',
};

const componenteLabels: Record<string, string> = {
  polivalente: 'Polivalente',
  lingua_portuguesa: 'Língua Portuguesa',
  matematica: 'Matemática',
};

const cargoLabels: Record<string, string> = {
  professor: 'Professor',
  coordenador: 'Coordenador',
};

const anoSerieOptions: Record<string, string[]> = {
  anos_iniciais: ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'],
  anos_finais: ['6º Ano', '7º Ano', '8º Ano', '9º Ano'],
  ensino_medio: ['1ª Série', '2ª Série', '3ª Série'],
};

export default function ProfessoresPage() {
  const { isAdminOrGestor } = useAuth();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    escola_id: '',
    segmento: 'anos_iniciais' as Segmento,
    componente: 'polivalente' as ComponenteCurricular,
    ano_serie: '',
    cargo: 'professor' as CargoProfessor,
    ativo: true,
    programa: ['escolas'] as ProgramaType[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [professoresRes, escolasRes] = await Promise.all([
        supabase
          .from('professores')
          .select('*, escolas(id, nome, ativa)')
          .order('nome'),
        supabase
          .from('escolas')
          .select('id, nome, ativa')
          .eq('ativa', true)
          .order('nome'),
      ]);

      if (professoresRes.error) throw professoresRes.error;
      if (escolasRes.error) throw escolasRes.error;

      setProfessores(professoresRes.data || []);
      setEscolas(escolasRes.data || []);
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
    const matchesSegmento = filterSegmento === 'todos' || prof.segmento === filterSegmento;
    const matchesStatus = showInactive || prof.ativo;
    const matchesPrograma = filterPrograma === 'todos' || prof.programa?.includes(filterPrograma as ProgramaType);
    return matchesSearch && matchesEscola && matchesSegmento && matchesStatus && matchesPrograma;
  });

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
      });
    } else {
      setEditingProfessor(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        escola_id: '',
        segmento: 'anos_iniciais',
        componente: 'polivalente',
        ano_serie: '',
        cargo: 'professor',
        ativo: true,
        programa: ['escolas'],
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
          })
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
          });

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

  // Mapeamentos para normalização na importação
  const segmentoMap: Record<string, string> = {
    'anos_iniciais': 'anos_iniciais',
    'anos iniciais': 'anos_iniciais',
    'anos finais': 'anos_finais',
    'anos_finais': 'anos_finais',
    'ensino medio': 'ensino_medio',
    'ensino_medio': 'ensino_medio',
    'ensino médio': 'ensino_medio',
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
  };

  const cargoMap: Record<string, string> = {
    'professor': 'professor',
    'coordenador': 'coordenador',
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
              segmento: segmento || 'anos_iniciais',
              componente: componente || 'polivalente',
              ano_serie: String(row['AnoSerie'] || row['ano_serie'] || row['Ano/Série'] || '1º Ano').trim(),
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
    const template = [
      { Nome: 'Maria Silva', Email: 'maria@escola.edu.br', Telefone: '(11) 99999-9999', Escola: 'Nome da Escola', Segmento: 'anos_iniciais', Componente: 'polivalente', AnoSerie: '1º Ano', Cargo: 'professor' },
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Professores');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'modelo_professores.xlsx');
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
    {
      key: 'status',
      header: 'Status',
      className: 'w-20',
      render: (prof: Professor) => (
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
    ...(isAdminOrGestor ? [{
      key: 'actions',
      header: 'Ações',
      className: 'w-24',
      render: (prof: Professor) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenDialog(prof)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(prof.id)}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={16} />
          </button>
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
          <h1 className="page-header">Professores</h1>
          <p className="page-subtitle">
            {totalProfessores} professores e {totalCoordenadores} coordenadores ativos
          </p>
        </div>
        
        {isAdminOrGestor && (
          <div className="flex flex-wrap gap-3">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <button className="btn-outline flex items-center gap-2">
                  <Upload size={18} />
                  Importar
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Importar Professores</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Faça upload de um arquivo Excel (.xlsx) com os dados dos professores.
                  </p>
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

            <button onClick={handleExportData} className="btn-outline flex items-center gap-2">
              <Download size={18} />
              Exportar
            </button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button onClick={() => handleOpenDialog()} className="btn-primary flex items-center gap-2">
                  <Plus size={20} />
                  Novo Professor
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
                      <label className="form-label">Segmento *</label>
                      <select
                        value={formData.segmento}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          segmento: e.target.value as Segmento,
                          ano_serie: ''
                        })}
                        className="input-field"
                        required
                      >
                        {Object.entries(segmentoLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Componente *</label>
                      <select
                        value={formData.componente}
                        onChange={(e) => setFormData({ ...formData, componente: e.target.value as ComponenteCurricular })}
                        className="input-field"
                        required
                      >
                        {Object.entries(componenteLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="form-label">Ano/Série *</label>
                      <select
                        value={formData.ano_serie}
                        onChange={(e) => setFormData({ ...formData, ano_serie: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">Selecione o ano/série</option>
                        {anoSerieOptions[formData.segmento]?.map(ano => (
                          <option key={ano} value={ano}>{ano}</option>
                        ))}
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
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
          <option value="todos">Todas as Escolas</option>
          {escolas.map(escola => (
            <option key={escola.id} value={escola.id}>{escola.nome}</option>
          ))}
        </select>
        <select
          value={filterSegmento}
          onChange={(e) => setFilterSegmento(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="todos">Todos os Segmentos</option>
          {Object.entries(segmentoLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={filterPrograma}
          onChange={(e) => setFilterPrograma(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="todos">Todos os Programas</option>
          <option value="escolas">Programa de Escolas</option>
          <option value="regionais">Regionais de Ensino</option>
          <option value="redes_municipais">Redes Municipais</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
          <Switch
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <span className="text-muted-foreground">Mostrar inativos</span>
        </label>
      </div>

      {/* Table */}
      <DataTable
        data={filteredProfessores}
        columns={columns}
        keyExtractor={(prof) => prof.id}
        emptyMessage="Nenhum professor encontrado"
      />
    </div>
  );
}
