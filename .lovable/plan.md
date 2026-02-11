

## Corrigir Formularios: Engajamento e Solidez + Implantacao (Por Entidade)

### Contexto
Os documentos enviados revelam que os campos atualmente cadastrados no banco estao trocados:
- `obs_engajamento_solidez` contem os campos de Implantacao (1 rating + 5 textos) -- ERRADO
- `obs_implantacao_programa` nao tem campos cadastrados

Alem disso, nao ha respostas registradas para nenhum dos dois instrumentos, entao a correcao pode ser feita sem perda de dados.

### Alteracoes no Banco de Dados (migracao SQL)

**1. Mover campos existentes de `obs_engajamento_solidez` para `obs_implantacao_programa`:**
Os 6 campos atuais (situacao_geral, fraquezas, forcas, principais_avancos, principais_riscos, recomendacoes_estrategicas) pertencem ao formulario de Implantacao. Basta atualizar o `form_type`.

**2. Criar campos corretos para `obs_engajamento_solidez`:**
Conforme o documento, sao 5 campos de rating (escala 1-4) + 1 campo texto:

| # | field_key | label | tipo | escala |
|---|-----------|-------|------|--------|
| 1 | clareza_papel_pe | Clareza sobre o Papel da PE no Desenvolvimento Pedagogico e da Gestao | rating | 1-4 (Fragil / Em construcao / Ativa / Consolidada) |
| 2 | clareza_papel_consultor | Clareza sobre o Papel do Consultor/Gestor Pedagogico | rating | 1-4 |
| 3 | participacao_gestao_escolar | Participacao da Gestao Escolar | rating | 1-4 |
| 4 | abertura_acompanhamento | Abertura para Acompanhamento e Devolutivas | rating | 1-4 |
| 5 | estabilidade_parceria | Estabilidade da Parceria com a Escola | rating | 1-4 |
| 6 | evidencias | Evidencias | text | -- |

Todos os 5 campos rating usam a mesma rubrica:
- 1 = Fragil (Baixo engajamento; parceria reativa)
- 2 = Em construcao (Engajamento pontual; dependencia de mediacao)
- 3 = Ativa (Participacao consistente; corresponsabilidade)
- 4 = Consolidada (Parceria estrategica; alto nivel de confianca)

### Alteracoes no Codigo

**1. `src/config/acaoPermissions.ts` (linha 56):**
Renomear o label de `obs_implantacao_programa` de "Por Escola" para "Por Entidade".

**2. `src/hooks/useInstrumentFields.ts` (linha 73):**
Renomear o label de `obs_implantacao_programa` de "Por Escola" para "Por Entidade".

### Resumo

| Local | Alteracao |
|-------|-----------|
| Banco de dados | Mover 6 campos de obs_engajamento_solidez para obs_implantacao_programa |
| Banco de dados | Inserir 6 novos campos para obs_engajamento_solidez (5 rating + 1 texto) |
| acaoPermissions.ts | Renomear label para "Por Entidade" |
| useInstrumentFields.ts | Renomear label para "Por Entidade" |

