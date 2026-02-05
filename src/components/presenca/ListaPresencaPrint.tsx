import { forwardRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ListaPresencaPrintProps {
  formacao: {
    titulo: string;
    data: string;
    horario_inicio: string;
    horario_fim: string;
    segmento: string;
    componente: string;
    programa: string[] | null;
  };
  formador: string;
  escola: string;
  professores: Array<{
    id: string;
    nome: string;
    escola_nome: string;
  }>;
  linhasExtras?: number;
}

export const ListaPresencaPrint = forwardRef<HTMLDivElement, ListaPresencaPrintProps>(
  ({ formacao, formador, escola, professores, linhasExtras = 5 }, ref) => {
    const formatProgramaLabel = (programa: string[] | null) => {
      if (!programa || programa.length === 0) return '-';
      return programa.map(p => {
        switch (p) {
          case 'escolas': return 'Escolas';
          case 'regionais': return 'Regionais';
          case 'redes_municipais': return 'Redes Municipais';
          default: return p;
        }
      }).join(', ');
    };

    const formatSegmentoLabel = (segmento: string) => {
      switch (segmento) {
        case 'anos_iniciais': return 'Anos Iniciais';
        case 'anos_finais': return 'Anos Finais';
        case 'ensino_medio': return 'Ensino Médio';
        case 'todos': return 'Todos';
        default: return segmento;
      }
    };

    const formatComponenteLabel = (componente: string) => {
      switch (componente) {
        case 'lingua_portuguesa': return 'Língua Portuguesa';
        case 'matematica': return 'Matemática';
        case 'polivalente': return 'Polivalente';
        case 'todos': return 'Todos';
        default: return componente;
      }
    };

    // Create extra empty rows
    const linhasVazias = Array.from({ length: linhasExtras }, (_, i) => ({
      id: `extra-${i}`,
      nome: '',
      escola_nome: '',
    }));

    const todasLinhas = [...professores, ...linhasVazias];

    return (
      <div
        ref={ref}
        className="hidden print:block print-container"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm',
          backgroundColor: 'white',
          color: 'black',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            Lista de Presença - Formação
          </h1>
        </div>

        {/* Formation Info */}
        <div className="mb-6 border border-black p-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Formação:</strong> {formacao.titulo}
            </div>
            <div>
              <strong>Data:</strong> {format(parseISO(formacao.data), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <div>
              <strong>Horário:</strong> {formacao.horario_inicio} às {formacao.horario_fim}
            </div>
            <div>
              <strong>Formador(a):</strong> {formador}
            </div>
            <div>
              <strong>Escola/Rede:</strong> {escola}
            </div>
            <div>
              <strong>Programa:</strong> {formatProgramaLabel(formacao.programa)}
            </div>
            <div>
              <strong>Segmento:</strong> {formatSegmentoLabel(formacao.segmento)}
            </div>
            <div>
              <strong>Componente:</strong> {formatComponenteLabel(formacao.componente)}
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2 text-center w-12">Nº</th>
              <th className="border border-black p-2 text-left">NOME</th>
              <th className="border border-black p-2 text-left w-40">ESCOLA</th>
              <th className="border border-black p-2 text-center w-48">ASSINATURA</th>
            </tr>
          </thead>
          <tbody>
            {todasLinhas.map((prof, index) => (
              <tr key={prof.id} style={{ minHeight: '12mm' }}>
                <td className="border border-black p-2 text-center h-10">
                  {index + 1}
                </td>
                <td className="border border-black p-2 h-10">
                  {prof.nome}
                </td>
                <td className="border border-black p-2 h-10">
                  {prof.escola_nome}
                </td>
                <td className="border border-black p-2 h-10">
                  {/* Empty for signature */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Observations */}
        <div className="mt-6">
          <p className="font-bold mb-2">Observações:</p>
          <div className="border-b border-black h-6 mb-2"></div>
          <div className="border-b border-black h-6 mb-2"></div>
          <div className="border-b border-black h-6"></div>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-container {
              display: block !important;
            }
            
            .print\\:hidden {
              display: none !important;
            }
            
            .print\\:block {
              display: block !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

ListaPresencaPrint.displayName = 'ListaPresencaPrint';
