import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ACAO_FORM_CONFIG, ACAO_TYPE_INFO, normalizeAcaoTipo } from '@/config/acaoPermissions';

interface ProgramacaoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escolas: { id: string; nome: string; codesc?: string | null }[];
  aaps: { id: string; nome: string }[];
  onUpload: (programacoes: ParsedProgramacao[], updateExisting: boolean) => void;
}

export interface ParsedProgramacao {
  tipo: string;
  titulo: string;
  descricao?: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  programa: string[];
}

interface ParsedRow extends ParsedProgramacao {
  valid: boolean;
  errors: string[];
  warnings: string[];
  escolaNome?: string;
  aapNome?: string;
}

// Tipos que podem ser importados em lote (agendamento simples)
const TIPOS_IMPORTAVEIS = [
  'formacao',
  'agenda_gestao',
  'devolutiva_pedagogica',
  'obs_engajamento_solidez',
  'obs_implantacao_programa',
  'obs_uso_dados',
  'qualidade_acomp_aula',
  'qualidade_implementacao',
  'qualidade_atpcs',
  'sustentabilidade_programa',
] as const;

type TipoImportavel = typeof TIPOS_IMPORTAVEIS[number];

// Tipos legados para retrocompatibilidade
const TIPOS_LEGADOS_MAP: Record<string, { novo: TipoImportavel; aviso: string }> = {
  visita: { novo: 'observacao_aula' as any, aviso: 'Tipo "visita" convertido para "observacao_aula"' },
  acompanhamento_aula: { novo: 'observacao_aula' as any, aviso: 'Tipo "acompanhamento_aula" convertido para "observacao_aula"' },
};

const segmentosValidos = ['anos_iniciais', 'anos_finais', 'ensino_medio'];
const componentesValidos = ['polivalente', 'lingua_portuguesa', 'matematica'];
const programasValidos = ['escolas', 'regionais', 'redes_municipais'];

export function ProgramacaoUploadDialog({ open, onOpenChange, escolas, aaps, onUpload }: ProgramacaoUploadDialogProps) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeTime = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'number') {
      const totalMinutes = Math.round(value * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    const cleaned = String(value).trim();
    if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
      const [h, m] = cleaned.split(':');
      return `${String(h).padStart(2, '0')}:${m}`;
    }
    return cleaned;
  };

  const normalizeDate = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    const cleaned = String(value).trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
      const [d, m, y] = cleaned.split('/');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return cleaned;
    }
    return cleaned;
  };

  const findEscolaByCodesc = (codesc: string): { id: string; nome: string } | null => {
    const cleaned = String(codesc).replace(/\D/g, '');
    const found = escolas.find(e => e.codesc?.replace(/\D/g, '') === cleaned);
    return found ? { id: found.id, nome: found.nome } : null;
  };

  const findAapByNome = (nome: string): { id: string; nome: string } | null => {
    const cleaned = String(nome).trim().toLowerCase();
    const found = aaps.find(a => a.nome.toLowerCase() === cleaned);
    return found ? { id: found.id, nome: found.nome } : null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        const parsed: ParsedRow[] = jsonData.map((row: any) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          // Tipo — retrocompatibilidade com legados
          let tipoRaw = String(row['TIPO'] || row['tipo'] || '').toLowerCase().trim();
          
          // Verificar legados primeiro
          if (TIPOS_LEGADOS_MAP[tipoRaw]) {
            const legado = TIPOS_LEGADOS_MAP[tipoRaw];
            warnings.push(legado.aviso);
            tipoRaw = legado.novo;
          }

          // Verificar se é importável
          if (!TIPOS_IMPORTAVEIS.includes(tipoRaw as TipoImportavel)) {
            const tiposStr = TIPOS_IMPORTAVEIS.join(', ');
            errors.push(`Tipo "${tipoRaw}" não pode ser importado em lote. Tipos válidos: ${tiposStr}`);
          }

          // Título
          const titulo = String(row['TITULO'] || row['titulo'] || '').trim();
          if (!titulo) errors.push('Título obrigatório');

          // Descrição (opcional)
          const descricao = String(row['DESCRICAO'] || row['descricao'] || '').trim() || undefined;

          // Data
          const dataRaw = row['DATA'] || row['data'];
          const data = normalizeDate(dataRaw);
          if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            errors.push('Data inválida (use DD/MM/YYYY ou YYYY-MM-DD)');
          }

          // Horários
          const horarioInicioRaw = row['HORARIO_INICIO'] || row['horario_inicio'] || row['INICIO'] || row['inicio'];
          const horarioFimRaw = row['HORARIO_FIM'] || row['horario_fim'] || row['FIM'] || row['fim'];
          const horario_inicio = normalizeTime(horarioInicioRaw);
          const horario_fim = normalizeTime(horarioFimRaw);
          if (!horario_inicio || !/^\d{2}:\d{2}$/.test(horario_inicio)) {
            errors.push('Horário início inválido (use HH:MM)');
          }
          if (!horario_fim || !/^\d{2}:\d{2}$/.test(horario_fim)) {
            errors.push('Horário fim inválido (use HH:MM)');
          }

          // Escola (por CODESC)
          const codesc = String(row['CODESC'] || row['codesc'] || '').trim();
          const escola = findEscolaByCodesc(codesc);
          if (!escola) {
            errors.push(`Escola não encontrada com CODESC: ${codesc}`);
          }

          // Ator/Responsável (retrocompatibilidade: AAP | ATOR | FORMADOR)
          const atorNome = String(
            row['ATOR'] || row['ator'] || row['AAP'] || row['aap'] || row['FORMADOR'] || row['formador'] || ''
          ).trim();
          const aap = findAapByNome(atorNome);
          if (!aap) {
            errors.push(`Consultor/Gestor/Formador não encontrado: "${atorNome}"`);
          }

          // Determinar obrigatoriedade de Segmento/Componente/Ano via ACAO_FORM_CONFIG
          const normalizedTipo = normalizeAcaoTipo(tipoRaw);
          const formConfig = ACAO_FORM_CONFIG[normalizedTipo as keyof typeof ACAO_FORM_CONFIG];
          const requiresSegmento = formConfig?.showSegmento ?? true;
          const requiresComponente = formConfig?.showComponente ?? true;
          const requiresAnoSerie = formConfig?.showAnoSerie ?? true;

          // Segmento
          let segmento = String(row['SEGMENTO'] || row['segmento'] || '').toLowerCase().trim();
          if (requiresSegmento) {
            if (!segmentosValidos.includes(segmento)) {
              errors.push(`Segmento inválido: "${segmento}" (use: anos_iniciais, anos_finais, ensino_medio)`);
            }
          } else {
            if (!segmento) segmento = 'anos_iniciais';
          }

          // Componente
          let componente = String(row['COMPONENTE'] || row['componente'] || '').toLowerCase().trim();
          if (requiresComponente) {
            if (!componentesValidos.includes(componente)) {
              errors.push(`Componente inválido: "${componente}" (use: polivalente, lingua_portuguesa, matematica)`);
            }
          } else {
            if (!componente) componente = 'polivalente';
          }

          // Ano/Série
          let anoSerie = String(row['ANO_SERIE'] || row['ano_serie'] || row['ANO'] || row['ano'] || '').trim();
          if (requiresAnoSerie && !anoSerie) {
            errors.push('Ano/Série obrigatório para este tipo de ação');
          }
          if (!requiresAnoSerie && !anoSerie) anoSerie = 'N/A';

          // Programa
          const programaRaw = String(row['PROGRAMA'] || row['programa'] || 'escolas').toLowerCase().trim();
          const programa = programaRaw.split(',').map(p => p.trim()).filter(p => programasValidos.includes(p));
          if (programa.length === 0) {
            errors.push(`Programa inválido: "${programaRaw}" (use: escolas, regionais, redes_municipais)`);
          }

          return {
            tipo: tipoRaw,
            titulo,
            descricao,
            data,
            horario_inicio,
            horario_fim,
            escola_id: escola?.id || '',
            aap_id: aap?.id || '',
            segmento,
            componente,
            ano_serie: anoSerie,
            programa,
            escolaNome: escola?.nome,
            aapNome: aap?.nome,
            valid: errors.length === 0,
            errors,
            warnings,
          };
        });

        setParsedData(parsed);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Erro ao processar arquivo. Verifique o formato.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    // Aba 1 — dados de exemplo
    const templateData = [
      {
        TIPO: 'formacao',
        TITULO: 'Formação em Alfabetização',
        DESCRICAO: 'Formação para professores do 1º ano',
        DATA: format(new Date(), 'dd/MM/yyyy'),
        HORARIO_INICIO: '08:00',
        HORARIO_FIM: '12:00',
        CODESC: '123456',
        ATOR: 'Nome do Responsável',
        SEGMENTO: 'anos_iniciais',
        COMPONENTE: 'polivalente',
        ANO_SERIE: '1º Ano',
        PROGRAMA: 'escolas',
      },
      {
        TIPO: 'agenda_gestao',
        TITULO: 'Reunião de Alinhamento de Gestão',
        DESCRICAO: '',
        DATA: format(new Date(), 'dd/MM/yyyy'),
        HORARIO_INICIO: '09:00',
        HORARIO_FIM: '11:00',
        CODESC: '123456',
        ATOR: 'Nome do Responsável',
        SEGMENTO: '',
        COMPONENTE: '',
        ANO_SERIE: '',
        PROGRAMA: 'escolas',
      },
    ];

    const ws1 = XLSX.utils.json_to_sheet(templateData);
    ws1['!cols'] = [
      { wch: 25 }, // TIPO
      { wch: 35 }, // TITULO
      { wch: 40 }, // DESCRICAO
      { wch: 14 }, // DATA
      { wch: 16 }, // HORARIO_INICIO
      { wch: 14 }, // HORARIO_FIM
      { wch: 10 }, // CODESC
      { wch: 28 }, // ATOR
      { wch: 16 }, // SEGMENTO
      { wch: 18 }, // COMPONENTE
      { wch: 14 }, // ANO_SERIE
      { wch: 18 }, // PROGRAMA
    ];

    // Aba 2 — referência de valores válidos
    const refData = [
      // Tipos
      { CAMPO: 'TIPO', VALOR: 'formacao', DESCRICAO: 'Formação' },
      { CAMPO: 'TIPO', VALOR: 'agenda_gestao', DESCRICAO: 'Agenda de Gestão' },
      { CAMPO: 'TIPO', VALOR: 'devolutiva_pedagogica', DESCRICAO: 'Devolutiva Pedagógica' },
      { CAMPO: 'TIPO', VALOR: 'obs_engajamento_solidez', DESCRICAO: 'Observação – Engajamento e Solidez' },
      { CAMPO: 'TIPO', VALOR: 'obs_implantacao_programa', DESCRICAO: 'Observação – Implantação do Programa' },
      { CAMPO: 'TIPO', VALOR: 'obs_uso_dados', DESCRICAO: 'Observação Uso Pedagógico de Dados' },
      { CAMPO: 'TIPO', VALOR: 'qualidade_acomp_aula', DESCRICAO: 'Qualidade Acompanhamento de Aula (Coord.)' },
      { CAMPO: 'TIPO', VALOR: 'qualidade_implementacao', DESCRICAO: 'Qualidade da Implementação' },
      { CAMPO: 'TIPO', VALOR: 'qualidade_atpcs', DESCRICAO: 'Qualidade de ATPCs' },
      { CAMPO: 'TIPO', VALOR: 'sustentabilidade_programa', DESCRICAO: 'Sustentabilidade e Aprendizado do Programa' },
      // Nota sobre tipos não importáveis
      { CAMPO: 'TIPO (NÃO IMPORTÁVEL)', VALOR: 'observacao_aula', DESCRICAO: 'Requer instrumento por professor no ato' },
      { CAMPO: 'TIPO (NÃO IMPORTÁVEL)', VALOR: 'autoavaliacao', DESCRICAO: 'Reflexão individual, não agendável' },
      { CAMPO: 'TIPO (NÃO IMPORTÁVEL)', VALOR: 'lista_presenca', DESCRICAO: 'Gerada junto com a formação' },
      { CAMPO: 'TIPO (NÃO IMPORTÁVEL)', VALOR: 'acompanhamento_formacoes', DESCRICAO: 'Gerado automaticamente' },
      // Segmentos
      { CAMPO: 'SEGMENTO', VALOR: 'anos_iniciais', DESCRICAO: 'Anos Iniciais (obrigatório para formacao)' },
      { CAMPO: 'SEGMENTO', VALOR: 'anos_finais', DESCRICAO: 'Anos Finais (obrigatório para formacao)' },
      { CAMPO: 'SEGMENTO', VALOR: 'ensino_medio', DESCRICAO: 'Ensino Médio (obrigatório para formacao)' },
      // Componentes
      { CAMPO: 'COMPONENTE', VALOR: 'polivalente', DESCRICAO: 'Polivalente (obrigatório para formacao)' },
      { CAMPO: 'COMPONENTE', VALOR: 'lingua_portuguesa', DESCRICAO: 'Língua Portuguesa (obrigatório para formacao)' },
      { CAMPO: 'COMPONENTE', VALOR: 'matematica', DESCRICAO: 'Matemática (obrigatório para formacao)' },
      // Programas
      { CAMPO: 'PROGRAMA', VALOR: 'escolas', DESCRICAO: 'Programa de Escolas' },
      { CAMPO: 'PROGRAMA', VALOR: 'regionais', DESCRICAO: 'Regionais de Ensino' },
      { CAMPO: 'PROGRAMA', VALOR: 'redes_municipais', DESCRICAO: 'Redes Municipais' },
    ];

    const ws2 = XLSX.utils.json_to_sheet(refData);
    ws2['!cols'] = [{ wch: 28 }, { wch: 30 }, { wch: 50 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Programacoes');
    XLSX.utils.book_append_sheet(wb, ws2, 'Tipos e Valores Válidos');
    XLSX.writeFile(wb, 'modelo_programacoes.xlsx');
  };

  const handleConfirmUpload = () => {
    const validData = parsedData.filter(item => item.valid);
    if (validData.length === 0) {
      toast.error('Nenhum registro válido para importar');
      return;
    }

    const dataToUpload = validData.map(({ valid, errors, warnings, escolaNome, aapNome, ...prog }) => prog);
    onUpload(dataToUpload, updateExisting);
    setParsedData([]);
    setUpdateExisting(false);
    onOpenChange(false);
  };

  const validCount = parsedData.filter(item => item.valid).length;
  const invalidCount = parsedData.filter(item => !item.valid).length;
  const warningCount = parsedData.filter(item => item.valid && item.warnings.length > 0).length;

  const tiposImportaveisLabel = TIPOS_IMPORTAVEIS.map(t => 
    ACAO_TYPE_INFO[t as keyof typeof ACAO_TYPE_INFO]?.label || t
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Programações em Lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-3">
            <div>
              <p className="font-medium mb-2">Formato do arquivo (colunas obrigatórias):</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
                <div><strong>TIPO</strong>: ver tipos válidos abaixo</div>
                <div><strong>TITULO</strong>: Nome da ação (obrigatório)</div>
                <div><strong>DESCRICAO</strong>: Descrição (opcional)</div>
                <div><strong>DATA</strong>: DD/MM/YYYY ou YYYY-MM-DD</div>
                <div><strong>HORARIO_INICIO</strong>: HH:MM (ex: 08:00)</div>
                <div><strong>HORARIO_FIM</strong>: HH:MM (ex: 12:00)</div>
                <div><strong>CODESC</strong>: Código da escola</div>
                <div><strong>ATOR</strong>: Nome do responsável</div>
                <div><strong>SEGMENTO</strong>: anos_iniciais, anos_finais, ensino_medio <span className="text-xs">(obrigatório p/ formacao)</span></div>
                <div><strong>COMPONENTE</strong>: polivalente, lingua_portuguesa, matematica <span className="text-xs">(obrigatório p/ formacao)</span></div>
                <div><strong>ANO_SERIE</strong>: Ex: 1º Ano <span className="text-xs">(obrigatório p/ formacao)</span></div>
                <div><strong>PROGRAMA</strong>: escolas, regionais, redes_municipais</div>
              </div>
            </div>

            <div>
              <p className="font-medium mb-1">Tipos de ação importáveis em lote:</p>
              <div className="flex flex-wrap gap-1">
                {TIPOS_IMPORTAVEIS.map(tipo => (
                  <span key={tipo} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-mono">
                    {tipo}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-warning/10 border border-warning/20 rounded p-2">
              <Info size={14} className="text-warning mt-0.5 shrink-0" />
              <span>
                Tipos como <strong>Observação de Aula</strong>, <strong>Autoavaliação</strong> e <strong>Lista de Presença</strong> não podem ser importados em lote pois requerem preenchimento de instrumento no momento do registro.
              </span>
            </div>
          </div>

          {/* Update existing option */}
          <label className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded border-border w-4 h-4"
            />
            <div className="flex-1">
              <span className="font-medium text-sm">Atualizar programações existentes</span>
              <p className="text-xs text-muted-foreground">
                Se habilitado, programações com mesma data, escola e ator serão atualizadas. Caso contrário, duplicatas serão ignoradas.
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="btn-outline flex items-center gap-2"
            >
              <Download size={16} />
              Baixar Modelo
            </button>
            <label className="btn-primary flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm font-medium">Prévia dos dados:</span>
                <span className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle size={14} />
                  {validCount} válido(s)
                </span>
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 text-sm text-warning">
                    <AlertCircle size={14} />
                    {warningCount} com avisos
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle size={14} />
                    {invalidCount} com erro(s)
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left whitespace-nowrap">Status</th>
                      <th className="p-2 text-left whitespace-nowrap">Tipo</th>
                      <th className="p-2 text-left whitespace-nowrap">Título</th>
                      <th className="p-2 text-left whitespace-nowrap">Data</th>
                      <th className="p-2 text-left whitespace-nowrap">Horário</th>
                      <th className="p-2 text-left whitespace-nowrap">Escola</th>
                      <th className="p-2 text-left whitespace-nowrap">Ator</th>
                      <th className="p-2 text-left">Erros / Avisos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-t border-border ${
                          !item.valid
                            ? 'bg-destructive/5'
                            : item.warnings.length > 0
                            ? 'bg-warning/5'
                            : ''
                        }`}
                      >
                        <td className="p-2">
                          {item.valid ? (
                            <CheckCircle size={16} className={item.warnings.length > 0 ? 'text-warning' : 'text-success'} />
                          ) : (
                            <AlertCircle size={16} className="text-destructive" />
                          )}
                        </td>
                        <td className="p-2 whitespace-nowrap font-mono text-xs">{item.tipo}</td>
                        <td className="p-2 max-w-[150px] truncate" title={item.titulo}>{item.titulo}</td>
                        <td className="p-2 whitespace-nowrap">{item.data}</td>
                        <td className="p-2 whitespace-nowrap">{item.horario_inicio}-{item.horario_fim}</td>
                        <td className="p-2 max-w-[120px] truncate" title={item.escolaNome}>{item.escolaNome || '-'}</td>
                        <td className="p-2 max-w-[120px] truncate" title={item.aapNome}>{item.aapNome || '-'}</td>
                        <td className="p-2 text-xs">
                          {item.errors.length > 0 && (
                            <span className="text-destructive">{item.errors.join('; ')}</span>
                          )}
                          {item.warnings.length > 0 && (
                            <span className="text-warning">{item.warnings.join('; ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          {parsedData.length > 0 && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setParsedData([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="btn-outline flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={validCount === 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Importar {validCount} Programação(ões)
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
