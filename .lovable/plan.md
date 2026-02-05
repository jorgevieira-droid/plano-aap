

# Página de Lista de Presença para Impressão

## Resumo

Criar uma página dedicada para gerar e imprimir listas de presença de formações. A página permitirá selecionar uma formação e gerar um documento formatado para impressão em A4, contendo cabeçalho com informações da formação e tabela para assinatura dos participantes.

---

## Fluxo do Usuário

1. Usuário acessa a página "Lista de Presença" (nova rota `/lista-presenca`)
2. Seleciona uma formação realizada ou prevista através de filtros
3. Sistema gera automaticamente a lista com os professores elegíveis
4. Usuário clica em "Imprimir" → navegador abre diálogo de impressão nativo

---

## Layout da Página para Impressão (A4)

```text
┌─────────────────────────────────────────────────────────────────┐
│                        [LOGO opcional]                          │
│                                                                 │
│            LISTA DE PRESENÇA - FORMAÇÃO                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Formação: [Título da Formação]                                 │
│  Data: [DD/MM/YYYY]           Horário: [HH:MM] às [HH:MM]       │
│  Formador(a): [Nome do AAP]                                     │
│  Escola/Rede: [Nome da Escola]                                  │
│  Programa: [Escolas / Regionais / Redes Municipais]             │
│  Segmento: [Anos Iniciais/Finais/EM]   Componente: [LP/Mat/Pol] │
├─────────────────────────────────────────────────────────────────┤
│  Nº  │  NOME                    │  ESCOLA          │ ASSINATURA │
├──────┼──────────────────────────┼──────────────────┼────────────┤
│  1   │  Professor Silva         │  E.M. Paulo F.   │            │
│  2   │  Professora Costa        │  E.M. Paulo F.   │            │
│  3   │  Professor Santos        │  E.M. Monteiro   │            │
│  ... │  ...                     │  ...             │            │
├──────┼──────────────────────────┼──────────────────┼────────────┤
│                                                                 │
│  Observações: ____________________________________________      │
│  _____________________________________________________________  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/admin/ListaPresencaPage.tsx` | **CRIAR** - Página principal |
| `src/components/presenca/ListaPresencaPrint.tsx` | **CRIAR** - Componente de impressão |
| `src/App.tsx` | **MODIFICAR** - Adicionar rota |
| `src/components/layout/Sidebar.tsx` | **MODIFICAR** - Adicionar link no menu |

---

## Detalhes Técnicos

### 1. Página Principal (`ListaPresencaPage.tsx`)

**Funcionalidades:**
- Filtros: Programa, Escola, Período (data início/fim)
- Lista de formações filtradas (previstas ou realizadas)
- Ao selecionar formação, carrega professores elegíveis baseado em:
  - `escola_id` da formação
  - `componente` da formação
  - `segmento` (se não for "todos")
  - `ano_serie` (se não for "todos")

**Query para buscar formações:**
```sql
SELECT p.*, e.nome as escola_nome, pr.nome as formador_nome
FROM programacoes p
JOIN escolas e ON p.escola_id = e.id
JOIN profiles pr ON p.aap_id = pr.id
WHERE p.tipo = 'formacao'
ORDER BY p.data DESC
```

**Query para buscar professores elegíveis:**
```sql
SELECT p.id, p.nome, p.cargo, e.nome as escola_nome
FROM professores p
JOIN escolas e ON p.escola_id = e.id
WHERE p.escola_id = [formacao.escola_id]
  AND p.componente = [formacao.componente]
  AND p.ativo = true
  AND (formacao.segmento = 'todos' OR p.segmento = [formacao.segmento])
  AND (formacao.ano_serie = 'todos' OR p.ano_serie = [formacao.ano_serie])
ORDER BY p.nome
```

### 2. Componente de Impressão (`ListaPresencaPrint.tsx`)

**Props:**
```typescript
interface ListaPresencaPrintProps {
  formacao: {
    titulo: string;
    data: string;
    horario_inicio: string;
    horario_fim: string;
    segmento: string;
    componente: string;
    programa: string[];
  };
  formador: string;
  escola: string;
  professores: Array<{
    id: string;
    nome: string;
    escola_nome: string;
  }>;
}
```

**Estilos para impressão:**
- Usar CSS `@media print` para ocultar elementos não-impressíveis
- Dimensões A4: 210mm x 297mm
- Margens: 15mm
- Fonte: 12pt para corpo, 14pt para cabeçalho
- Linhas da tabela com altura mínima de 12mm para espaço de assinatura

### 3. Lógica de Impressão

```typescript
const handlePrint = () => {
  window.print();
};
```

O componente `ListaPresencaPrint` será renderizado com `display: none` no modo normal e `display: block` em `@media print`.

### 4. Navegação

**Nova rota:**
```tsx
<Route path="/lista-presenca" element={<ListaPresencaPage />} />
```

**Menu Sidebar:**
- Para Admin/Gestor: Adicionar em seção "Relatórios" ou como item separado
- Para AAP: Adicionar na seção de ações

---

## Considerações

1. **RLS:** A página seguirá as mesmas políticas já existentes para `programacoes` e `professores`
2. **Acesso:** Disponível para Admin, Gestor e AAPs (cada um vê apenas suas formações conforme RLS)
3. **Linhas em branco:** Opção para adicionar linhas extras para participantes não cadastrados
4. **Impressão direta:** Sem necessidade de gerar PDF, usando `window.print()` nativo

---

## Estimativa

- **Complexidade:** Baixa
- **Impacto:** Nenhum em dados/RLS existentes
- **Tempo estimado:** 1 ciclo de implementação

