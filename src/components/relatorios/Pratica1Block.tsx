import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { computePratica1, type Pratica1Input } from '@/lib/pratica1';

const pctTxt = (p: number | null) => (p === null ? '—' : `${p}%`);

function VisaoTable({ col, linhas, extra }: { col: string; linhas: { nome: string; extra?: string; total: number; sim: number; pct: number | null }[]; extra?: string }) {
  if (!linhas.length) return <p className="py-4 text-sm text-muted-foreground">Sem registros no período.</p>;
  return (
    <div className="max-h-[70vh] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted">
          <tr>
            <th className="p-2 text-left">{col}</th>
            {extra && <th className="p-2 text-left">{extra}</th>}
            <th className="p-2 text-center">Ações</th>
            <th className="p-2 text-center">Com Prática 1</th>
            <th className="p-2 text-center">%</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.nome + (l.extra || '')} className="border-b">
              <td className="p-2 break-words">{l.nome}</td>
              {extra && <td className="p-2">{l.extra || '—'}</td>}
              <td className="p-2 text-center">{l.total}</td>
              <td className="p-2 text-center font-semibold">{l.sim}</td>
              <td className="p-2 text-center">{pctTxt(l.pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pratica1Block({ rows, titulo = 'Prática Essencial 1 — Retomada', rotuloSim = 'desenvolvida', semProfessor = false }: {
  rows: Pratica1Input[]; titulo?: string; rotuloSim?: string; semProfessor?: boolean;
}) {
  const r = useMemo(() => computePratica1(rows), [rows]);
  const kpis = [
    ['Ações com Prática 1', r.acoes],
    ['Escolas com Prática 1', r.escolas],
    ...(semProfessor ? [] : [['Professores com Prática 1', r.professores]]),
  ] as [string, typeof r.acoes][];
  return (
    <Card className="border shadow-sm" data-pdf-section>
      <CardHeader className="border-b bg-muted/30 px-6 py-4">
        <CardTitle className="text-base font-semibold">{titulo}</CardTitle>
        <p className="text-xs text-muted-foreground">Prática {rotuloSim} = resposta "Sim". Ações sem resposta contam no total.</p>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {kpis.map(([l, k]) => (
            <div key={l} className="rounded-lg border p-4">
              <p className="text-2xl font-bold text-primary">{k.sim} <span className="text-base font-medium text-muted-foreground">/ {k.total}</span></p>
              <p className="text-sm font-semibold">{pctTxt(k.pct)}</p>
              <p className="text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <Tabs defaultValue="consultor">
          <TabsList>
            <TabsTrigger value="consultor">Por Consultor(a)</TabsTrigger>
            <TabsTrigger value="escola">Por Escola</TabsTrigger>
            {!semProfessor && <TabsTrigger value="professor">Por Professor</TabsTrigger>}
          </TabsList>
          <TabsContent value="consultor"><VisaoTable col="Consultor(a)" linhas={r.porConsultor} /></TabsContent>
          <TabsContent value="escola"><VisaoTable col="Escola" linhas={r.porEscola} /></TabsContent>
          {!semProfessor && <TabsContent value="professor"><VisaoTable col="Professor" extra="Escola" linhas={r.porProfessor} /></TabsContent>}
        </Tabs>
      </CardContent>
    </Card>
  );
}
