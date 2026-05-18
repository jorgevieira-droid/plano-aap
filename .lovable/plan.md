## Nova página: Relatório de Instrumentos

Rota: `/relatorio-instrumentos` · arquivo: `src/pages/admin/RelatorioInstrumentosPage.tsx`

### Acesso (N1–N3)
Disponível apenas para N1 (admin), N2 (gestor) e N3 (n3_coordenador_programa). Demais perfis (N4–N8) não veem o item no menu e recebem `UnauthorizedPage` se acessarem a URL direta.

- Adicionar item "Relatório de Instrumentos" em `adminMenuItems` e `managerMenuItems` (Sidebar); **não** adicionar em `operationalMenuItems`, `localMenuItems` nem `observerMenuItems`.
- Guarda na própria página: ler `profile.role` via `useAuth`; se não estiver em `['admin','gestor','n3_coordenador_programa']`, redirecionar para `/unauthorized`.
- Filtros de programa e hierarquia já existentes continuam valendo:
  - Dropdown "Programa" mostra apenas os programas do usuário (`profile.programas` para N2/N3; todos para N1). Se houver só 1, auto‑seleciona (regra global).
  - Dropdown "Ator" lista apenas atores que compartilham programa com o usuário (mesma lógica usada nas demais telas).
  - RLS já existente em `instrument_responses` / `registros_acao` continua restringindo os registros retornados — nenhuma mudança de banco.

### Fonte de dados
- `instrument_responses` (`form_type`, `responses` JSONB, `registro_acao_id`, `aap_id`, `created_at`)
- Join com `registros_acao` (`programa`, `tipo`, `data`, `aap_id`) e `profiles` (nome do Ator)
- `instrument_fields` (por `form_type`, ordenado por `sort_order`) define as colunas dinâmicas
- Lista de programas: constantes existentes (`escolas`, `regionais`, `redes_municipais`)

### Layout (padrão visual do projeto)

```text
[ Programa ▼ ]                       (obrigatório, restrito ao escopo do usuário)
[ Instrumento ▼ ]                    (habilita após Programa; lista só form_types com >=1 resposta visível ao usuário no programa)
┌─ Card "Filtros opcionais" ────────────────────────────────┐
│ [ Ator ▼ ]  [ Data Início 📅 ]  [ Data Fim 📅 ]           │  (habilita após Programa+Instrumento)
└────────────────────────────────────────────────────────────┘
[ Gerar Relatório ]   (habilita após Programa+Instrumento)

— após clicar —
┌─ Tabela (overflow-x-auto) ─────────────────────────────────┐
│ Programa | Ator | Ação | Data | Resposta Q1 | Resposta Q2…│
└────────────────────────────────────────────────────────────┘
                                           [ Baixar XLS ]
```

### Regras de comportamento
1. Trocar Programa → reseta Instrumento, Ator, Datas, oculta tabela.
2. Trocar Instrumento → reseta Ator, Datas, oculta tabela.
3. Sem resultados → "Nenhum registro encontrado para os filtros selecionados."
4. Tabela e botão XLS só aparecem após o primeiro "Gerar Relatório".
5. Nome do arquivo: `{Programa}_{Instrumento}_relatorio.xlsx` (slug seguro).

### Queries (supabase client; RLS aplica o recorte por usuário)
- **Instrumentos disponíveis (após Programa):**
  ```ts
  supabase.from('instrument_responses')
    .select('form_type, registros_acao!inner(programa)')
    .contains('registros_acao.programa', [programa])
  ```
  → distinct dos `form_type`, cruzado com `INSTRUMENT_FORM_TYPES` para labels A‑Z.
- **Atores do programa:** reusar consulta de `profiles` filtrada por `user_programas` (mesma usada em outros relatórios).
- **Gerar relatório:**
  ```ts
  supabase.from('instrument_responses')
    .select('id, created_at, responses, aap_id, registros_acao!inner(programa, tipo, data, aap_id), profiles:aap_id(nome)')
    .eq('form_type', instrumento)
    .contains('registros_acao.programa', [programa])
    .gte('registros_acao.data', dataInicio?)
    .lte('registros_acao.data', dataFim?)
    .eq('aap_id', atorId?)
  ```

### Tabela dinâmica
- Colunas fixas: Programa | Ator (`profiles.nome`) | Ação (label de `registros_acao.tipo`) | Data (`dd/MM/yyyy`).
- Dinâmicas: para cada `instrument_fields` (por `sort_order`), header = `label`, célula = `responses[field_key]`. Arrays/objetos serializados como texto legível.
- `overflow-x-auto` no container + `min-w-max` na tabela. Ordenação por data desc.

### Export XLSX
- Usar `xlsx` (SheetJS). Adicionar dependência se ausente.
- AOA = mesmas colunas/linhas exibidas. `XLSX.writeFile(wb, filename)`.

### Rota (`src/App.tsx`)
Importar `RelatorioInstrumentosPage` e registrar `<Route path="/relatorio-instrumentos" element={<RelatorioInstrumentosPage />} />` dentro de `AppLayout`.

### Fora do escopo
- Sem alterações de RLS / banco.
- Não toca em `RelatoriosPage` nem em outras telas.
