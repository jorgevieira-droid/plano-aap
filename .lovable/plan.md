# Corrigir timeouts de carregamento (páginas em branco)

## O problema (confirmado)
As estatísticas do banco confirmam a falha: leituras muito lentas e canceladas por tempo limite (8s).

Piores ofensores (tempo médio por chamada):
- `registros_acao` filtrado por `status` — 19.551 chamadas, média 892 ms, pico 7,9 s
- `programacoes` (lendo todas as colunas, ordenado por data) — ~16.000 chamadas, média 0,9–1,8 s, pico 8,0 s
- `instrument_responses` filtrado por `form_type` — 6.839 chamadas, média 903 ms, pico 8,0 s

Duas causas somadas:
1. As telas leem tabelas inteiras (sem filtro de período no banco) e filtram no navegador.
2. Cada linha lida passa por funções de permissão (RLS) que consultam outras tabelas, o que multiplica o custo em varreduras grandes.

## O que será feito

### 1. Índices (migração)
Criar índices para as colunas usadas nos filtros e ordenações:
- `registros_acao`: `(status, data)`, `(escola_id)`, `(aap_id)`, `(tipo)`
- `programacoes`: `(data)`, `(escola_id)`, `(aap_id)`, `(status)`
- `instrument_responses`: `(form_type, created_at)`, `(registro_acao_id)`, `(escola_id)`
- `user_entidades (user_id, escola_id)`, `user_programas (user_id, programa)`, `user_roles (user_id, role)` — usados pelas funções de permissão

### 2. Reduzir o custo das funções de permissão
Marcar as funções auxiliares como `STABLE` + `PARALLEL SAFE` (as que ainda não são) para que o Postgres reaproveite o resultado por consulta em vez de reavaliar por linha.

### 3. Reduzir o volume lido nas telas
Sem mudar o que o usuário vê:
- Aplicar o filtro de período no banco (`.gte('data', inicio).lte('data', fim)`) nas páginas de Programação/Calendário, Registros e nos painéis de relatório, em vez de baixar tudo e filtrar no navegador.
- Selecionar apenas as colunas usadas em vez de `select('*')` nas leituras grandes (`programacoes`, extração de bases).
- Paginar em lotes na página de Extração de Bases, que hoje lê tabelas inteiras de uma vez.

## Detalhes técnicos
- Migração com `CREATE INDEX IF NOT EXISTS` (sem `CONCURRENTLY`, pois roda em transação) e `ALTER FUNCTION ... STABLE PARALLEL SAFE`.
- Arquivos afetados no frontend: `src/pages/admin/ProgramacaoPage.tsx`, `RegistrosPage.tsx`, `ExtracaoBasesInstrumentosPage.tsx`, `RelatoriosGestaoEscolasPage.tsx` e os painéis `Relatorios*PanelPage.tsx`.
- Validação: reexecutar a análise de consultas lentas após a mudança e conferir `EXPLAIN` das duas consultas mais caras.
