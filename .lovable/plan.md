

## Vincular "Acompanhamento de Formação" a uma "Formação" existente

### Contexto
Atualmente, "Acompanhamento de Formação" pode ser criado como ação independente no formulário de programação. O correto é que ele só exista vinculado a uma "Formação" previamente cadastrada, acessível por um botão no gerenciamento da Formação.

### Alterações

#### 1. Banco de dados: nova coluna de vínculo
- Adicionar coluna `formacao_origem_id` (uuid, nullable) na tabela `programacoes`, referenciando outra programação do tipo `formacao`
- Adicionar a mesma coluna em `registros_acao` para manter o vínculo nos registros

#### 2. Remover "Acompanhamento de Formação" do formulário de criação direta
- Em `ProgramacaoPage.tsx`, filtrar `acompanhamento_formacoes` da lista de tipos criáveis no formulário de nova programação
- O tipo continua existindo no sistema, mas só pode ser criado a partir de uma Formação

#### 3. Adicionar botão "Acompanhamento" nas Formações realizadas
- No card de evento da programação (tanto na visão calendário quanto na lista), quando o tipo for `formacao` e o status for `realizada`, exibir um botão "Acompanhamento"
- Ao clicar, abre o formulário de nova programação pre-preenchido com:
  - Tipo: `acompanhamento_formacoes`
  - Escola, AAP, segmento, componente e ano/serie copiados da formação original
  - `formacao_origem_id` preenchido com o ID da formação
  - Apenas título, data e horários ficam editáveis

#### 4. Exibir vínculo nos registros
- Na página de Registros (`RegistrosPage.tsx`), quando um registro tiver `formacao_origem_id`, exibir um indicador visual mostrando "Acompanhamento de: [título da formação]"

### Detalhes Tecnicoes

**Migração SQL:**
```text
ALTER TABLE programacoes 
  ADD COLUMN formacao_origem_id uuid REFERENCES programacoes(id);

ALTER TABLE registros_acao 
  ADD COLUMN formacao_origem_id uuid REFERENCES programacoes(id);
```

**Arquivos modificados:**
- `src/pages/admin/ProgramacaoPage.tsx` - Filtrar `acompanhamento_formacoes` do seletor de tipo; adicionar botao "Acompanhamento" nos cards de formacao realizada; preencher formulario automaticamente ao criar acompanhamento a partir de formacao
- `src/pages/admin/RegistrosPage.tsx` - Exibir referencia a formacao de origem quando existir
- Nenhuma alteracao em `acaoPermissions.ts` - o tipo `acompanhamento_formacoes` continua registrado normalmente, apenas nao aparece no formulario de criacao direta

