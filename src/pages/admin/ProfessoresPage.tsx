import { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { professores as initialProfessores, escolas, segmentoLabels, componenteLabels, anoSerieOptions } from '@/data/mockData';
import { Professor, Segmento, ComponenteCurricular } from '@/types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>(initialProfessores);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEscola, setFilterEscola] = useState('todos');
  const [filterSegmento, setFilterSegmento] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    escolaId: '',
    segmento: 'anos_iniciais' as Segmento,
    componente: 'polivalente' as ComponenteCurricular,
    anoSerie: '',
  });

  const filteredProfessores = professores.filter(prof => {
    const matchesSearch = prof.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEscola = filterEscola === 'todos' || prof.escolaId === filterEscola;
    const matchesSegmento = filterSegmento === 'todos' || prof.segmento === filterSegmento;
    return matchesSearch && matchesEscola && matchesSegmento;
  });

  const handleOpenDialog = (professor?: Professor) => {
    if (professor) {
      setEditingProfessor(professor);
      setFormData({
        nome: professor.nome,
        email: professor.email || '',
        telefone: professor.telefone || '',
        escolaId: professor.escolaId,
        segmento: professor.segmento,
        componente: professor.componente,
        anoSerie: professor.anoSerie,
      });
    } else {
      setEditingProfessor(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        escolaId: '',
        segmento: 'anos_iniciais',
        componente: 'polivalente',
        anoSerie: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProfessor) {
      setProfessores(prev => prev.map(prof =>
        prof.id === editingProfessor.id
          ? { ...prof, ...formData }
          : prof
      ));
      toast.success('Professor atualizado com sucesso!');
    } else {
      const newProfessor: Professor = {
        id: String(Date.now()),
        ...formData,
        createdAt: new Date(),
      };
      setProfessores(prev => [...prev, newProfessor]);
      toast.success('Professor cadastrado com sucesso!');
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este professor?')) {
      setProfessores(prev => prev.filter(prof => prof.id !== id));
      toast.success('Professor excluído com sucesso!');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const newProfessores: Professor[] = jsonData.map((row: Record<string, unknown>, index) => ({
          id: String(Date.now() + index),
          nome: String(row['Nome'] || row['nome'] || ''),
          email: String(row['Email'] || row['email'] || ''),
          telefone: String(row['Telefone'] || row['telefone'] || ''),
          escolaId: String(row['EscolaId'] || row['escolaId'] || '1'),
          segmento: (row['Segmento'] || row['segmento'] || 'anos_iniciais') as Segmento,
          componente: (row['Componente'] || row['componente'] || 'polivalente') as ComponenteCurricular,
          anoSerie: String(row['AnoSerie'] || row['anoSerie'] || '1º Ano'),
          createdAt: new Date(),
        }));

        setProfessores(prev => [...prev, ...newProfessores]);
        toast.success(`${newProfessores.length} professores importados com sucesso!`);
        setIsImportDialogOpen(false);
      } catch {
        toast.error('Erro ao importar arquivo. Verifique o formato.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportTemplate = () => {
    const template = [
      { Nome: 'Maria Silva', Email: 'maria@escola.edu.br', Telefone: '(11) 99999-9999', EscolaId: '1', Segmento: 'anos_iniciais', Componente: 'polivalente', AnoSerie: '1º Ano' },
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
      Escola: escolas.find(e => e.id === prof.escolaId)?.nome,
      Segmento: segmentoLabels[prof.segmento],
      Componente: componenteLabels[prof.componente],
      AnoSerie: prof.anoSerie,
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Professores');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'professores.xlsx');
    toast.success('Dados exportados com sucesso!');
  };

  const columns = [
    {
      key: 'nome',
      header: 'Professor(a)',
      render: (prof: Professor) => (
        <div>
          <p className="font-medium text-foreground">{prof.nome}</p>
          {prof.email && <p className="text-sm text-muted-foreground">{prof.email}</p>}
        </div>
      ),
    },
    {
      key: 'escola',
      header: 'Escola',
      render: (prof: Professor) => {
        const escola = escolas.find(e => e.id === prof.escolaId);
        return <span className="text-sm">{escola?.nome || '-'}</span>;
      },
    },
    {
      key: 'segmento',
      header: 'Segmento',
      render: (prof: Professor) => (
        <StatusBadge variant="primary">{segmentoLabels[prof.segmento]}</StatusBadge>
      ),
    },
    {
      key: 'componente',
      header: 'Componente',
      render: (prof: Professor) => (
        <StatusBadge variant="info">{componenteLabels[prof.componente]}</StatusBadge>
      ),
    },
    {
      key: 'anoSerie',
      header: 'Ano/Série',
      render: (prof: Professor) => <span>{prof.anoSerie}</span>,
    },
    {
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
            className="p-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Professores</h1>
          <p className="page-subtitle">Gerencie os professores das escolas</p>
        </div>
        
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
                  Faça upload de um arquivo Excel (.xlsx) ou CSV com os dados dos professores.
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
                      value={formData.escolaId}
                      onChange={(e) => setFormData({ ...formData, escolaId: e.target.value })}
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
                        anoSerie: ''
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
                      value={formData.anoSerie}
                      onChange={(e) => setFormData({ ...formData, anoSerie: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Selecione o ano/série</option>
                      {anoSerieOptions[formData.segmento]?.map(ano => (
                        <option key={ano} value={ano}>{ano}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="btn-outline flex-1"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingProfessor ? 'Salvar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar professores..."
            className="input-field pl-11"
          />
        </div>
        <select
          value={filterEscola}
          onChange={(e) => setFilterEscola(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="todos">Todas as escolas</option>
          {escolas.map(escola => (
            <option key={escola.id} value={escola.id}>{escola.nome}</option>
          ))}
        </select>
        <select
          value={filterSegmento}
          onChange={(e) => setFilterSegmento(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="todos">Todos os segmentos</option>
          {Object.entries(segmentoLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
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
