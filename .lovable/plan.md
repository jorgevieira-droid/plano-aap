

# Vincular Atores Educacionais a Usuarios do Sistema

## Contexto

Atualmente a tabela `professores` (Atores Educacionais) e a tabela `profiles` (Atores dos Programas) sao completamente independentes. Nao ha nenhum vinculo entre elas. Isso impede, por exemplo, que um professor tenha acesso ao sistema ou que se possa redefinir sua senha a partir da pagina de Atores Educacionais.

A ideia e criar uma associacao similar ao que a integracao do Notion faz com `notion_sync_config` (que mapeia `notion_user_email` para `system_user_id`).

## Solucao

Adicionar uma coluna `user_id` (uuid, nullable) na tabela `professores` que referencia `profiles.id`. Isso permite vincular opcionalmente cada professor a um usuario do sistema.

### O que muda na pratica

- Na pagina de Atores Educacionais, ao criar/editar um professor, aparecera um campo opcional "Usuario do Sistema" com um seletor dos usuarios cadastrados
- Quando vinculado, sera possivel ver o papel (N6, N7 etc.) do usuario e acessar acoes como "Redefinir Senha" diretamente da pagina de professores
- Professores sem vinculo continuam funcionando normalmente (o campo e opcional)

## Detalhes Tecnicos

### 1. Migracao de banco de dados

```sql
ALTER TABLE public.professores
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
```

### 2. Arquivo: `src/pages/admin/ProfessoresPage.tsx`

**Interface Professor** (linhas 42-60): Adicionar campo `user_id: string | null`.

**Formulario de criacao/edicao**: Adicionar um campo `<select>` opcional rotulado "Usuario do Sistema" que lista os perfis disponiveis (busca na tabela `profiles`). O seletor filtrara por perfis que ainda nao estao vinculados a outro professor.

**Tabela de listagem**: Adicionar uma coluna "Usuario" que mostra o nome do perfil vinculado (se houver) com um badge indicando o papel. Quando vinculado, exibir icone de chave para redefinir senha.

**Logica de redefinicao de senha**: Reutilizar a mesma logica ja implementada em `AtoresProgramaPage.tsx`, chamando a edge function `manage-users` com a acao de reset.

### 3. Arquivo: `src/types/index.ts`

Atualizar o tipo `Professor` (se existir) para incluir `user_id`.

### Fluxo

```text
Pagina Atores Educacionais
  |
  |-- Criar/Editar Professor
  |     |-- Campo "Usuario do Sistema" (opcional)
  |     |-- Seleciona um perfil existente de profiles
  |     |-- Salva user_id na tabela professores
  |
  |-- Listagem
        |-- Coluna "Usuario" mostra vinculo
        |-- Se vinculado: botao de redefinir senha
```

### Consideracoes

- A coluna `user_id` e nullable: professores sem usuario do sistema continuam funcionando
- A busca de perfis para o seletor respeitara as politicas RLS existentes
- Nao sera necessario alterar as RLS da tabela `professores` pois a coluna e apenas informativa
- O vinculo e 1:1 (um professor para no maximo um usuario)
