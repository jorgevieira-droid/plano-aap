# Corrigir criação e disponibilidade da "Visita Técnica — Alfabetização (REDES)"

## Diagnóstico

Foram identificados dois problemas distintos:

### 1. Erro ao criar a programação (check constraint)
As tabelas `programacoes` e `registros_acao` possuem uma restrição (`*_tipo_check`) que lista todos os tipos de ação válidos. O novo tipo `visita_tecnica_alfabetizacao_redes` **não foi adicionado** a essas restrições, então o banco recusa a inserção:

```text
new row for relation "programacoes" violates check constraint "programacoes_tipo_check"
```

### 2. Indisponível para o programa "Regionais"
Em `ProgramacaoPage.tsx`, a função `getProgramasForTipo` remove automaticamente o programa "regionais" de qualquer tipo, exceto os que estão na lista `REGIONAIS_CADASTRABLE_TIPOS` (hoje apenas `monitoramento_acoes_formativas` e `monitoramento_gestao`). Como o novo tipo não está nessa lista, ele nunca aparece para Regionais — independentemente da configuração.

## Mudanças

### A. Migração de banco de dados
Atualizar as duas restrições para incluir `visita_tecnica_alfabetizacao_redes`:
- `programacoes_tipo_check`
- `registros_acao_tipo_check`

Isso é feito recriando cada constraint com a lista atual de tipos + o novo valor.

### B. Liberar para Regionais (`src/pages/admin/ProgramacaoPage.tsx`)
Adicionar `visita_tecnica_alfabetizacao_redes` ao conjunto `REGIONAIS_CADASTRABLE_TIPOS`, para que o tipo deixe de ser filtrado e fique disponível também no programa Regionais.

Com isso, o tipo passa a ficar disponível por padrão para **todos os programas** (Escolas, Regionais, Redes Municipais), e o administrador continua podendo ativar/desativar por programa em **Configurar Formulário** (que grava em `form_config_settings`). Nenhum registro de seed é necessário: sem configuração, o padrão já é "todos os programas".

## Verificação
- Criar uma programação do tipo "Visita Técnica — Alfabetização (REDES)" em cada programa (incluindo Regionais) sem erro de constraint.
- Confirmar que o tipo aparece no seletor de tipos quando o programa Regionais está selecionado/simulado.
- Confirmar que em "Configurar Formulário" é possível restringir os programas e que a restrição é respeitada na Programação.
