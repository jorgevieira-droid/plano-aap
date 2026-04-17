

# Adicionar campo Projeto ao "Encontro Formativo ET/EG – REDES"

## Objetivo
Replicar o fluxo do `encontro_professor_redes` para `encontro_eteg_redes`:
- Campo **Projeto** obrigatório no agendamento (3 opções: Instituto Alfa e Beto, Teaching at The Right Level, Gestão para aprendizagem).
- Quando projeto = **Instituto Alfa e Beto** ou **Teaching at The Right Level** → fluxo simplificado (apenas confirmar realizado sim/não + lista de presença, **sem** preencher instrumento).
- Quando projeto = **Gestão para aprendizagem** → fluxo atual completo (presença + instrumento ET/EG).

## Mudanças

### 1. `src/pages/admin/ProgramacaoPage.tsx`
- Adicionar `<SelectItem>` Projeto também quando `tipo === 'encontro_eteg_redes'` (linhas ~2120-2136).
- Incluir `encontro_eteg_redes` na condicional `skipInstrument` (linha 1566).
- Incluir na condicional de exibição do bloco de instrumento (linha 3601).

### 2. `src/pages/admin/RegistrosPage.tsx`
- Salvar `projeto` também para `encontro_eteg_redes` (linhas 914 e 968).
- Mostrar Select de Projeto quando tipo for `encontro_eteg_redes` (linha 2134).

### 3. `src/pages/aap/AAPRegistrarAcaoPage.tsx`
- Adicionar `case 'encontro_eteg_redes'` com mesma lógica de fluxo simplificado quando projeto ≠ "Gestão para aprendizagem" (replicando linhas 1232-1234).

### 4. Banco de dados
A coluna `projeto` já existe na tabela (usada por `encontro_professor_redes`). **Nenhuma migração necessária**.

### 5. Memória
Atualizar `mem://data-model/formation-optional-fields` ou `redes-forms-config` para registrar que ET/EG também usa Projeto com fluxo simplificado para IAB/TaRL.

## Resultado
"Encontro Formativo ET/EG – REDES" passa a ter campo Projeto com mesma mecânica de bypass de instrumento, idêntico ao "Encontro Formativo Professor – REDES".

