# Ajuste de progressão no Registro de Apoio Presencial

## Objetivo
Evitar que a seção "7. Rubrica da Primeira Prática Essencial — Retomada" seja exibida automaticamente apenas porque o usuário selecionou a segunda rubrica. A retomada deve aparecer somente após a segunda rubrica ser efetivamente pontuada (ou quando o fluxo sem segunda rubrica estiver concluído).

## Diagnóstico
No componente `src/components/formularios/RegistroApoioPresencialContent.tsx`, a variável `rubricasResolvidas` considera o fluxo com segunda rubrica resolvido apenas quando `r.rubrica_2_key` existe. Basta selecionar a segunda rubrica para que Block 7 seja renderizado, mesmo antes de atribuir nota à rubrica 2. Isso é o que o usuário reportou.

## Alterações planejadas

### 1. Ajustar condição de exibição da prática essencial
No arquivo `src/components/formularios/RegistroApoioPresencialContent.tsx`, alterar a condição `rubricasResolvidas`:

- Quando `tem_rubrica_2 === 'Não'`, manter o critério atual: primeira rubrica selecionada e pergunta respondida.
- Quando `tem_rubrica_2 === 'Sim'`, exigir que `r.rubrica_2_nota` esteja preenchido (ou seja, a segunda rubrica foi pontuada), e não apenas `r.rubrica_2_key`.

Isso garante que a retomada não apareça imediatamente após a seleção da segunda rubrica.

### 2. Resetar nota da segunda rubrica ao trocar a rubrica selecionada
No handler `onSelect` da segunda rubrica (`RubricaSelector` no Block 6), limpar `rubrica_2_nota` junto com a mudança de `rubrica_2_key`. Isso evita que uma nota de uma rubrica anterior mantenha o Block 7 visível quando a rubrica é trocada.

### 3. Validar comportamento visual
Verificar que, após o ajuste:
- Selecionar a segunda rubrica (Block 6) mostra apenas a descrição e os botões de pontuação da segunda rubrica, sem abrir Block 7.
- Ao pontuar a segunda rubrica, Block 7 aparece.
- Modo `readOnly` continua mostrando todos os dados já salvos, independentemente da condição de resolução.

## Escopo
- Somente frontend no componente `RegistroApoioPresencialContent.tsx`.
- Nenhuma alteração de banco de dados ou novas dependências.
- Não afeta a persistência dos dados, apenas o fluxo de exibição do formulário.
