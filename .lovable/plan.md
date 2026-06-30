## Objetivo
Permitir **seleção múltipla** nos filtros da página **Programação / Calendário** (Tipos, Entidades, Entidades-filho, Formadores, Consultores, GPIs e Programa).

## O que muda

### 1. Estado dos filtros (`ProgramacaoPage.tsx`)
Converter os 7 filtros atuais de `string` (`"todos" | id`) para `string[]` (array vazio = "todos"):
- `programaFilter` → `programaFilters: string[]`
- `tipoFilter` → `tipoFilters: string[]`
- `entidadeFilter` → `entidadeFilters: string[]`
- `entidadeFilhoFilter` → `entidadeFilhoFilters: string[]`
- `formadorFilter` → `formadorFilters: string[]`
- `consultorFilter` → `consultorFilters: string[]`
- `gpiFilter` → `gpiFilters: string[]`

### 2. Lógica de filtragem
Em `filteredProgramacoes` e `passesUiFilters`, trocar comparações `=== "todos"` / `!== valor` por:
```ts
if (tipoFilters.length > 0 && !tipoFilters.includes(p.tipo)) return false;
```
Mesmo padrão para todos os 7 filtros. Lógica de cascata (`availableTipoIds`, etc.) permanece — segue funcionando porque já depende de `passesUiFilters`.

### 3. UI dos filtros
Substituir os 7 `<Select>` shadcn (single-select) por um novo componente **`MultiSelectFilter`** baseado em `Popover + Command + Checkbox` (padrão shadcn combobox multi-select), com:
- Label dinâmico: "Todos os Tipos" (vazio) · "Visita Técnica" (1) · "3 Tipos selecionados" (>1)
- Busca interna
- Botão "Limpar" no rodapé
- Mantém ordenação A-Z (`localeCompare pt-BR`) já usada hoje
- Mantém a regra de desabilitar opções fora de `availableXIds` (cascata)
- Visual idêntico aos chips atuais (mesma altura/borda/cor)

Criar em `src/components/forms/MultiSelectFilter.tsx` para ser reutilizável.

### 4. Comportamento preservado
- Pré-seleção atual (ex.: programa único do gestor) vira `[programaUnico]` ao invés de `"programaUnico"`.
- Reset de seleção em lote (`setSelectedProgramacaoIds(new Set())`) quando qualquer filtro muda — já existe, mantém.
- Permissões hierárquicas (N1–N8) não mudam.
- Demais usos de `programaFilter` etc. em outras partes da página (ex.: defaults ao criar nova ação) recebem `programaFilters[0] ?? undefined`.

## Fora de escopo
- Lista (aba "Lista") — mesmos filtros, então também ganha multi-seleção (mesmo estado compartilhado).
- Outras páginas (Registros, Relatórios) — não alteradas neste ticket.

## Risco
Baixo. Mudança isolada na página Programação; lógica de escopo/hierarquia intocada.