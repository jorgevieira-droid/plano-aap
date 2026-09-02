# Visualizar formulário completo na página de Registros

## Objetivo
Na página **Registros de Ações**, permitir abrir uma visualização somente-leitura com **todo o conteúdo preenchido**: os dados do **cadastro** (programação: consultor, entidade, data, segmento, componente, turma, título etc.) e as respostas do **formulário de gerenciamento** (instrumento preenchido, presenças e campos de texto).

## O que será feito

1. **Novo item de ação na lista de registros**
   - No menu de ações de cada linha (onde hoje existem "Gerenciar", "Editar", "Excluir"), incluir **"Visualizar formulário completo"** com ícone de documento.
   - Disponível para qualquer registro que o usuário já pode visualizar (mesma regra de permissão do "Ver detalhes").

2. **Reaproveitar o visualizador já existente**
   - A tela de Programação/Calendário já possui um diálogo de impressão que monta o formulário completo (cadastro + respostas do instrumento + tabelas dedicadas como Microciclos, Alfabetização, TaRL, GPA). Esse mesmo componente será usado em Registros, evitando duplicar layout.
   - O diálogo mantém o botão **Imprimir / Exportar PDF** com a marca dupla (Parceiros + Bússola).

3. **Suporte a registros sem agendamento (Ação Direta)**
   - Hoje o visualizador só carrega dados a partir da programação. Alguns registros são criados direto, sem programação vinculada.
   - Será adicionada a possibilidade de abrir o visualizador **a partir do registro**: quando não houver programação vinculada, os dados de cadastro vêm do próprio registro de ação.

4. **Lista de presença**
   - Quando a ação tiver controle de presença, a visualização incluirá a relação de participantes com presente/ausente.

## Detalhes técnicos

- `src/pages/admin/RegistrosPage.tsx`: novo estado `printRegistro` e item no menu de ações; renderizar `<AcaoPrintDialog>` com `programacaoId={registro.programacao_id}` ou, na ausência, o novo prop `registroId`.
- `src/components/print/AcaoPrintDialog.tsx`: aceitar `registroId?: string | null`. Fluxo de carga:
  - se `programacaoId` presente → comportamento atual;
  - senão, buscar `registros_acao` por `id`, usar seus campos como "cadastro" e o próprio `id` para carregar `instrument_responses` e as tabelas dedicadas.
- Presenças: consultar `presencas` + `professores` pelo `registro_acao_id` e passar para `AcaoPrintForm` como seção adicional.
- Sem mudanças de banco de dados; apenas leitura.
