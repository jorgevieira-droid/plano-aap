# Indicadores – Caê: incluir "Aula compartilhada com prof."

Hoje o bloco "Indicadores - Caê" consolida apenas **Apoio Presencial** + **Planejamento conjunto com prof.**. A alteração inclui também os registros de **Aula compartilhada com prof.** (`registro_aula_compartilhada`) nessa consolidação.

O formulário de Aula compartilhada já salva o nome do professor no cadastro (`apoio_professor_nome`) e usa a mesma lista oficial de Componente, então os dados entram automaticamente em:

- **Qtd de professores atendidos** (contagem de professores distintos)
- **Lista de professores apoiados** — Professor / Escola / Componente / Qtd de apoios
- **Qtd de Apoios por Componente**
- **Qtd de Apoios por Ano/Série** (somente valores da listagem oficial)

## Alteração

`src/pages/admin/RelatoriosGestaoEscolasPage.tsx` — no cálculo do bloco `cae`, adicionar os registros de `registro_aula_compartilhada` à lista consolidada (junto de Apoio Presencial e Planejamento conjunto). A mesma lista alimenta a tabela de professores e as distribuições, então uma única inclusão cobre todas as visualizações do bloco.

## Verificação

- `npx tsgo --noEmit -p tsconfig.app.json`
