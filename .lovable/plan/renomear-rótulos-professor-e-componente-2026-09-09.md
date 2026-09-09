# Renomear rótulos "Professor" e "Componente"

Alteração apenas visual nos formulários de cadastro do Programa de Escolas: onde hoje aparece "Professor", passa a aparecer "Professor - Nome"; onde aparece "Componente", passa a aparecer "Professor - Componente".

## Onde muda

| Ação/Evento | Professor | Componente |
| --- | --- | --- |
| Apoio Presencial | sim | sim |
| Apoio Presencial com a Coordenação | não existe | sim |
| Aula compartilhada com prof. | sim | sim |
| Planejamento conjunto com prof. | sim | sim |

A ação "Reunião com a coordenação" não tem esses campos, então nada muda nela. A lista de Ano/Série já está aplicada e não será alterada.

## O que não muda

- Nenhum dado, tabela ou relatório é alterado — apenas o texto exibido no formulário.
- Os painéis/relatórios continuam com seus rótulos atuais.

## Detalhes técnicos

- Arquivo: `src/pages/admin/ProgramacaoPage.tsx` (blocos de cadastro por tipo de ação).
  - Bloco `registro_apoio_presencial`: rótulos "Professor *" e "Componente *".
  - Bloco `registro_consultoria_pedagogica`: rótulo "Componente *".
  - Bloco compartilhado `registro_planejamento_conjunto` / `registro_aula_compartilhada`: rótulos "Professor *" e "Componente *".
- Os rótulos genéricos de "Componente" usados por outras ações (Redes, Formação etc.) permanecem inalterados.
- Verificação: `npx tsgo --noEmit -p tsconfig.app.json`.
