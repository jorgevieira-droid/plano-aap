import { forwardRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calcularHorasFormacao } from '@/lib/utils';

interface ListaPresencaPrintProps {
  formacao: {
    tipo?: string;
    tipoLabel?: string;
    titulo: string;
    data: string;
    horario_inicio: string;
    horario_fim: string;
    segmento: string;
    componente: string;
    programa: string[] | null;
    turma_formacao?: string | null;
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

    const horas = calcularHorasFormacao(formacao.horario_inicio, formacao.horario_fim);

    const linhasVazias = Array.from({ length: linhasExtras }, (_, i) => ({
      id: `extra-${i}`,
      nome: '',
      escola_nome: '',
    }));

    const todasLinhas = [...professores, ...linhasVazias];

    return (
      <div ref={ref} className="hidden print:block">
        <table className="lista-presenca-table">
          <thead>
            {/* Branded header that repeats on every page */}
            <tr>
              <th colSpan={4} style={{ padding: 0, border: 'none' }}>
                {/* Blue bar with logo */}
                <div style={{
                  backgroundColor: '#1a3a5c',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                } as React.CSSProperties}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src="/pe-logo-branco.png"
                      alt="Parceiros da Educação"
                      style={{ height: '32px', objectFit: 'contain' }}
                    />
                    <img
                      src="/logo-bussola-vertical.png"
                      alt="Olhar Parceiro"
                      style={{ height: '32px', objectFit: 'contain' }}
                    />
                  </div>
                  <span style={{ color: 'white', fontSize: '11px', fontWeight: 500, letterSpacing: '0.5px' }}>
                    Olhar Parceiro
                  </span>
                </div>
                {/* Title */}
                <div style={{ textAlign: 'center', margin: '10px 0' }}>
                  <h1 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                    Lista de Presença — {formacao.tipoLabel || 'Formação'}
                  </h1>
                </div>
                {/* Formation info */}
                <div style={{ border: '1px solid black', padding: '10px', marginBottom: '10px', fontSize: '11px', lineHeight: '1.8' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <div><strong>Título:</strong> {formacao.titulo}</div>
                    <div><strong>Data:</strong> {format(parseISO(formacao.data), 'dd/MM/yyyy', { locale: ptBR })}</div>
                    <div><strong>Horário:</strong> {formacao.horario_inicio} às {formacao.horario_fim} ({horas.toFixed(1)}h)</div>
                    <div><strong>Formador(a):</strong> {formador}</div>
                    <div><strong>Escola/Rede:</strong> {escola}</div>
                    <div><strong>Programa:</strong> {formatProgramaLabel(formacao.programa)}</div>
                    {formacao.tipo === 'formacao' ? (
                      <>
                        <div><strong>Segmento:</strong> {formatSegmentoLabel(formacao.segmento)}</div>
                        <div><strong>Componente:</strong> {formatComponenteLabel(formacao.componente)}</div>
                      </>
                    ) : (
                      <div><strong>Turma:</strong> {formacao.turma_formacao || 'Todas'}</div>
                    )}
                  </div>
                </div>
              </th>
            </tr>
            {/* Column headers */}
            <tr>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', width: '40px', fontSize: '11px', fontWeight: 'bold' }}>Nº</th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold' }}>NOME</th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'left', width: '140px', fontSize: '11px', fontWeight: 'bold' }}>ESCOLA</th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', width: '180px', fontSize: '11px', fontWeight: 'bold' }}>ASSINATURA</th>
            </tr>
          </thead>
          <tbody>
            {todasLinhas.map((prof, index) => (
              <tr key={prof.id}>
                <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', height: '12mm', fontSize: '11px' }}>
                  {index + 1}
                </td>
                <td style={{ border: '1px solid black', padding: '4px', height: '12mm', fontSize: '11px' }}>
                  {prof.nome}
                </td>
                <td style={{ border: '1px solid black', padding: '4px', height: '12mm', fontSize: '11px' }}>
                  {prof.escola_nome}
                </td>
                <td style={{ border: '1px solid black', padding: '4px', height: '12mm' }}>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '16px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '11px' }}>Observações:</p>
          <div style={{ borderBottom: '1px solid black', height: '20px', marginBottom: '6px' }}></div>
          <div style={{ borderBottom: '1px solid black', height: '20px', marginBottom: '6px' }}></div>
          <div style={{ borderBottom: '1px solid black', height: '20px' }}></div>
        </div>

        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm 15mm 15mm 15mm;
              @bottom-center {
                content: "Página " counter(page) " de " counter(pages);
                font-size: 9px;
                color: #666;
              }
            }

            /* Force white background everywhere */
            html, body, #root, #root > *, main, [class*="min-h"], [class*="bg-"] {
              background: white !important;
              background-color: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Hide sidebar, nav, header, and all non-print UI */
            aside, nav, header, [data-sidebar], [class*="sidebar"],
            .print\\:hidden {
              display: none !important;
            }

            /* Remove layout constraints so print content fills the page */
            #root, #root > *, main, [class*="flex"], [class*="ml-"] {
              display: block !important;
              margin-left: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: 0 !important;
              overflow: visible !important;
            }

            .print\\:block {
              display: block !important;
              background: white !important;
            }

            .lista-presenca-table {
              width: 100%;
              border-collapse: collapse;
              font-family: Arial, sans-serif;
              color: black;
              background: white !important;
            }

            .lista-presenca-table thead {
              display: table-header-group;
            }

            .lista-presenca-table tbody {
              display: table-row-group;
            }

            .lista-presenca-table tr {
              page-break-inside: avoid;
            }
          }

          @media screen {
            .lista-presenca-table {
              display: none;
            }
          }
        `}</style>
      </div>
    );
  }
);

ListaPresencaPrint.displayName = 'ListaPresencaPrint';
