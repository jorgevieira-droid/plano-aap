# Permitir que N2 e N3 excluam atores educacionais dos seus programas

## Situação atual (verificada)
- Na página Atores Educacionais, o botão de lixeira, a seleção múltipla e "Excluir selecionados" só aparecem para N1 e N2. O N3 não vê esses botões.
- O banco já permite que N2/N3 excluam atores dos seus programas, além das presenças e respostas de instrumentos ligadas a eles.
- Falta permissão para N2/N3 apagarem as avaliações de aula antigas do ator. Se ele tiver alguma, a exclusão falha.

## O que muda
1. N3 (Coordenador de Programa) passa a ver o botão de excluir, a caixa de seleção e "Excluir selecionados", como o N2 já vê.
2. A exclusão continua limitada aos atores dos programas do usuário. O banco bloqueia o resto.
3. Nova permissão para N2/N3 apagarem as avaliações de aula dos atores dos seus programas, para a exclusão não travar no meio.
4. Se um ator não puder ser excluído, a mensagem de erro mostra o motivo exato.

## Detalhes técnicos
- `ProfessoresPage.tsx`: criar `canDeleteProfessores = isAdminOrGestor || hasRole('n3_coordenador_programa')` (ou o equivalente que já existe no AuthContext) e usar nas linhas 790, 989 e 1408. Em `handleDelete` e `handleBatchDelete`, conferir o erro de cada exclusão em cascata.
- Migration: política DELETE em `avaliacoes_aula` para `is_gestor OR has_role(n3)`, filtrando por `professor_id` de um professor cujo `programa` tem interseção com `user_programas` do usuário.
