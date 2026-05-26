## Contexto

O campo `componente_formacao_redes` já existe no dialog **Editar Registro** (RegistrosPage.tsx, linhas ~2322-2338), mas não aparece no dialog **Gerenciar Presenças** (linha 2015), que é o fluxo usado para registrar presença em ações `encontro_professor_redes`. O usuário quer vê-lo lá também, como **primeiro campo**, hidratado com o valor salvo no cadastro e editável.

## Mudanças em `src/pages/admin/RegistrosPage.tsx`

1. **Renderização** — Dentro do dialog `Gerenciar Presenças` (a partir da linha 2024, antes do bloco "Action Info"), adicionar um bloco condicional `selectedRegistro?.tipo === 'encontro_professor_redes'`:
   - Label: **"Informe o componente da formação:"**
   - Componente: `<Select>` com as 4 opções já usadas no editar (`Não se aplica`, `Polivalente`, `Língua Portuguesa`, `Matemática`).
   - Valor controlado por um novo state `manageComponenteFormacaoRedes`.

2. **State e hidratação** — Adicionar `const [manageComponenteFormacaoRedes, setManageComponenteFormacaoRedes] = useState('')`. Em `handleManage` (e nos demais pontos que setam `setIsManaging(true)` para esse tipo, linhas 613/743/778), hidratar com `selectedRegistro?.componente_formacao_redes ?? ''`.

3. **Persistência** — Em `handleSaveManage`, quando `selectedRegistro.tipo === 'encontro_professor_redes'`, incluir `componente_formacao_redes: manageComponenteFormacaoRedes || null` no `update` da `programacoes` (e no `registros_acao` correspondente, seguindo o mesmo padrão dos updates já existentes nas linhas 1070/1124).

4. **Reset** — Limpar `manageComponenteFormacaoRedes` ao fechar o dialog (`setIsManaging(false)` nos handlers de cancelar/salvar).

## Arquivos afetados
- `src/pages/admin/RegistrosPage.tsx` (somente front-end + write na coluna já existente)

## Ganhos / Perdas / Riscos
- **Ganhos:** Componente fica visível e editável também no fluxo de Gerenciar Presenças, com o valor do cadastro pré-carregado.
- **Perdas:** Nenhuma.
- **Riscos:** Baixo — coluna nullable já existe; nenhuma migration necessária.

Confirma que faço dessa forma?