

# Importação em Lote de Entidades Filho

## Resumo
Adicionar botão "Importar em Lote" na página de Entidades Filho, com dialog seguindo o mesmo padrão do `EscolaUploadDialog`, incluindo download de modelo Excel e validação prévia.

## Alterações

### 1. Novo componente `src/components/forms/EntidadeFilhoUploadDialog.tsx`
- Dialog com mesmo padrão visual do `EscolaUploadDialog`
- **Modelo Excel** com colunas: `CODESC_PAI`, `CODESC_FILHO`, `NOMESC_FILHO`
- Exemplo no modelo: `123456 | EF001 | Escola Municipal Exemplo`
- **Validação ao parsear**:
  - `CODESC_PAI` obrigatório — faz lookup em `escolas` por `codesc` para resolver `escola_id`
  - `CODESC_FILHO` obrigatório
  - `NOMESC_FILHO` obrigatório
- Tabela de prévia com status válido/inválido e contagem
- Botão confirmar insere todos os válidos em `entidades_filho` via upsert (ou insert simples)

### 2. `src/pages/admin/EntidadesFilhoPage.tsx`
- Adicionar estado `uploadOpen` e botão "Importar em Lote" ao lado do "Nova Entidade Filho"
- Handler `handleBatchUpload` que recebe array validado, faz batch de lookups de `CODESC_PAI` → `escola_id`, e insere em `entidades_filho`
- Invalidar query após sucesso

## Fluxo do usuário
1. Clica "Importar em Lote"
2. Baixa modelo Excel
3. Preenche e faz upload do .xlsx
4. Vê prévia com validação (CODESC_PAI não encontrado = erro)
5. Confirma importação dos válidos

