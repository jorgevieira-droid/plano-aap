import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computePratica1 } from '@/lib/pratica1';
import { Pratica1Block } from './Pratica1Block';

export const PRATICA1_TIPOS: { formType: string; nome: string; campo: string; temProfessor: boolean }[] = [
  { formType: 'registro_apoio_presencial', nome: 'Apoio Presencial', campo: 'observou_praticas', temProfessor: true },
  { formType: 'registro_aula_compartilhada', nome: 'Aula compartilhada com prof.', campo: 'desenvolveu_pratica_1', temProfessor: true },
  { formType: 'registro_planejamento_conjunto', nome: 'Planejamento conjunto com prof.', campo: 'desenvolveu_pratica_1', temProfessor: false },
  { formType: 'registro_formacao_coletiva', nome: 'Formação Coletiva', campo: 'desenvolveu_pratica_1', temProfessor: false },
  { formType: 'registro_consultoria_pedagogica', nome: 'Apoio Presencial com a Coordenação', campo: 'desenvolveu_pratica_1', temProfessor: false },
];

interface InRow { formType: string; consultor: string; escola: string; escolaId?: string; professor?: string; resp?: Record<string, any> }

const cell = (k: { sim: number; total: number; pct: number | null }) => `${k.sim} / ${k.total} (${k.pct ?? 0}%)`;
const lbl = (v: number) => (v ? `${v}%` : '');

export function Pratica1GestaoBlock({ rows }: { rows: InRow[] }) {
  const { todos, porTipo } = useMemo(() => {
    const porTipo = PRATICA1_TIPOS.map((t) => {
      const rs = rows.filter((r) => r.formType === t.formType).map((r) => ({
        ...r, professor: t.temProfessor ? r.professor : undefined, valor: r.resp?.[t.campo],
      }));
      return { ...t, rs, c: computePratica1(rs) };
    });
    return { todos: porTipo.flatMap((t) => t.rs), porTipo };
  }, [rows]);

  const pc = (v: number, t: number) => (t ? Math.round((v / t) * 100) : 0);
  const chart = porTipo.map((t) => { const n = t.rs.length; return { nome: t.nome, Sim: pc(t.c.acoes.sim, n), 'Não': pc(t.c.nao, n), 'Sem informação': n ? 100 - pc(t.c.acoes.sim, n) - pc(t.c.nao, n) : 0 }; });

  return (
    <div className="space-y-4">
      <Card className="border shadow-sm" data-pdf-section>
        <CardHeader className="border-b bg-muted/30 px-6 py-4">
          <CardTitle className="text-base font-semibold">Prática Essencial 1 — Por tipo de ação (% das ações)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chart} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" fontSize={12} />
              <YAxis type="category" dataKey="nome" width={230} fontSize={12} />
              <Tooltip formatter={(v: number) => `${v}%`} /><Legend />
              <Bar dataKey="Sim" stackId="a" fill="hsl(var(--primary))"><LabelList dataKey="Sim" position="inside" fill="#fff" fontWeight={700} formatter={lbl} /></Bar>
              <Bar dataKey="Não" stackId="a" fill="hsl(var(--destructive))"><LabelList dataKey="Não" position="inside" fill="#fff" fontWeight={700} formatter={lbl} /></Bar>
              <Bar dataKey="Sem informação" stackId="a" fill="hsl(var(--muted-foreground))"><LabelList dataKey="Sem informação" position="inside" fill="#fff" fontWeight={700} formatter={lbl} /></Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Ação</th>
                  <th className="p-2 text-center">Ações com Prática 1</th>
                  <th className="p-2 text-center">Escolas</th>
                  <th className="p-2 text-center">Professores</th>
                </tr>
              </thead>
              <tbody>
                {porTipo.map((t) => (
                  <tr key={t.formType} className="border-b">
                    <td className="p-2">{t.nome}{t.formType === 'registro_apoio_presencial' && <span className="text-xs text-muted-foreground"> (observou)</span>}</td>
                    <td className="p-2 text-center">{cell(t.c.acoes)}</td>
                    <td className="p-2 text-center">{cell(t.c.escolas)}</td>
                    <td className="p-2 text-center">{t.temProfessor ? cell(t.c.professores) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Pratica1Block rows={todos} titulo="Prática Essencial 1 — Retomada (todas as ações)" />
    </div>
  );
}
