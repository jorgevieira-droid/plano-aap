## Mudança

Substituir o card "Avaliações de Aula" do Dashboard por um card único "Total de Ações Programadas / Executadas".

## Layout

- **Título**: "Total de Ações Programadas / Executadas"
- **Valor principal**: `{programadas} / {executadas}` (ex.: `120 / 87`)
- **Subtítulo**: "Programadas até hoje / Realizadas"
- Mantém `variant="primary"`, mesmo ícone (`ClipboardCheck`) e link para `/programacao` (página onde a pessoa enxerga o detalhamento das ações).
- Mesma posição na grid, mesma condição de visibilidade já existente para o card atual (qualquer usuário com módulo de acompanhamento — Standard ou REDES). Para AAP/N4/N5 segue exibindo, mas com o escopo reduzido aos seus próprios registros (ver abaixo).

## Cálculo (em `AdminDashboard.tsx`)

Usar a variável já existente `filteredProgramacoes`, que aplica todos os filtros corretos:

- Filtros de programa, escola, componente, ator, ano, mês (já aplicados).
- Restringe `data <= today` (já aplicado, atende ao requisito "até a data atual").
- Hierarquia já é respeitada porque `programacoes` é carregado em `loadDashboardData` com escopo por papel (linhas 308–328): N1 carrega tudo; N2/N3 filtra pelos programas do usuário; N4/N5 filtra pelas suas próprias ações.

Calcular:
```
const totalProgramadasAteHoje = filteredProgramacoes.length;
const totalExecutadas = filteredProgramacoes.filter(p => p.status === 'realizada').length;
```

Renderizar:
```
<StatCard
  title="Total de Ações Programadas / Executadas"
  value={`${totalProgramadasAteHoje} / ${totalExecutadas}`}
  subtitle="Programadas até hoje / Realizadas"
  icon={<ClipboardCheck size={24} />}
  variant="primary"
  href="/programacao"
/>
```

## O que NÃO muda

- Variável `totalAvaliacoes` continua existindo e sendo usada na seção "Acompanhamento de Aula — Avaliações ({totalAvaliacoes} avaliações)" e no controle `showStandardModule && totalAvaliacoes > 0`. Apenas o card no topo deixa de exibi-la.
- Demais cards (Escola/Regional/Rede, Atores, Consultores, Ações Pendentes) ficam iguais.
- Sem mudanças de schema, edge functions ou regras de negócio — apenas presentation.