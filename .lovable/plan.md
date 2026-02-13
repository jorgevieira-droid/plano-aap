
# Alinhar Busca com Filtros na Pagina de Atores Educacionais

## Problema 1: Layout desalinhado
Atualmente, a busca por nome e os filtros (Escola, Segmento, Programa) estao em niveis visuais diferentes. A busca fica em uma linha e os filtros em outra abaixo com o label "Filtros" separado, criando desalinhamento visual.

## Problema 2: Professores nao aparecem em "Atores dos Programas"
Os registros da tabela `professores` sao cadastros pedagogicos (com cargo, segmento, componente), e nao usuarios do sistema com login/senha. A pagina "Atores dos Programas" (`/atores`) busca apenas na tabela `profiles` + `user_roles`, por isso professores nao aparecem la. Sao dois conceitos distintos: o "Ator Educacional" (registro pedagogico) e o "Ator do Programa" (usuario do sistema com papel N1-N8).

**Esclarecimento importante:** Nao e necessario deletar e recriar usuarios. A questao e que "Professor" e um **cargo** na tabela `professores`, e nao um **papel de sistema** (N6). Se um professor precisar acessar o sistema (login, senha), ele deve ser cadastrado como usuario em `/usuarios` com o papel N6, alem de estar na tabela `professores`.

## Solucao

### 1. Alinhar visualmente busca e filtros (ProfessoresPage.tsx)

Reorganizar o bloco de filtros (linhas 952-1005) para que a busca e os selects fiquem na mesma linha horizontal, removendo o label "Filtros" separado e usando `items-center` para alinhar tudo:

```text
<div className="flex flex-col md:flex-row md:items-center gap-4">
  [Busca]  [Escola]  [Segmento]  [Programa]  [Switch inativos]
</div>
```

### 2. Manter separacao entre as duas paginas

As paginas continuam com propositos distintos:
- **Atores Educacionais** (`/professores`): cadastro pedagogico (nome, escola, segmento, cargo)
- **Atores dos Programas** (`/atores`): gestao de usuarios do sistema (papel, senha, programas)

Nao sera feita fusao entre elas, pois sao dominos diferentes.

## Detalhes Tecnicos

### Arquivo: `src/pages/admin/ProfessoresPage.tsx`

Alterar linhas 952-1005 para colocar busca e filtros no mesmo nivel visual:

- Remover o wrapper `<div className="flex flex-col gap-2">` e o `<span>Filtros</span>`
- Colocar todos os elementos (input de busca + selects + switch) em um unico flex row com `flex-wrap` e `items-center`
- Manter o comportamento responsivo com `md:flex-row`

A estrutura ficara:
```text
<div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
  <div className="relative flex-1 min-w-[200px] max-w-md">
    [Search input]
  </div>
  <select>[Escola]</select>
  <select>[Segmento]</select>
  <select>[Programa]</select>
  <div>[Switch Mostrar inativos]</div>
</div>
```
