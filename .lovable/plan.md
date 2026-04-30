## Problema

No cadastro de Atores Educacionais (`/professores`), o formulário sempre vem com algum programa pré-selecionado:

- **Linha 162** (estado inicial): se o usuário tem programas no perfil, todos são marcados; caso contrário, marca `['escolas']` por padrão.
- **Linha 328** (abertura para novo cadastro): força `['escolas']`.
- **Linha 646** (importação em lote via Excel): se a planilha não trouxer Programa, assume `['escolas']`.

Resultado: um Coordenador de Redes que cadastra um professor acaba salvando também o programa "Escolas" no ator, mesmo sem ter marcado.

## Correção

Tornar a seleção de programa **explícita**, sem default automático.

### Alterações em `src/pages/admin/ProfessoresPage.tsx`

1. **Estado inicial do formulário (linha 162)**
   - Trocar para `programa: [] as ProgramaType[]`. Não pré-marcar nada.

2. **Abertura do diálogo para novo ator (linha 328)**
   - Trocar `programa: ['escolas']` para `programa: []`.

3. **Edição de ator existente (linha 312)**
   - Trocar `programa: professor.programa || ['escolas']` para `programa: professor.programa || []` (mantém o que está salvo, sem injetar Escolas).

4. **Validação no `handleSubmit`**
   - Antes de inserir/atualizar, validar que `formData.programa.length > 0` e mostrar toast de erro: "Selecione ao menos um programa para o ator". Isso evita salvar ator sem programa.

5. **Importação em lote (linha 644-646)**
   - Remover o fallback `'escolas'` quando a coluna Programa estiver vazia.
   - Linhas sem programa válido devem ser reportadas como erro de importação (mensagem clara para a linha) em vez de salvar com Escolas implícito.

6. **UI do checkbox de programas (linhas ~1220-1240)**
   - Adicionar indicador visual de obrigatoriedade ("Programa(s) *") no label da seção.

### Comportamento esperado após a correção

- Coordenador de Redes abre o cadastro → nenhum programa marcado → marca apenas "Redes Municipais" → ator salvo só com Redes.
- Importação em lote sem coluna Programa preenchida → linha rejeitada com erro descritivo.
- Edição de ator existente → mantém exatamente os programas já gravados.

Nenhuma mudança de banco/RLS é necessária — o problema é puramente do default no frontend.