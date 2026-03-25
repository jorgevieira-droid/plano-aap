

# Correção: Filtro de Projeto — de Redes Municipais para Regionais de Ensino

## Resumo
A implementação anterior associou o filtro de projeto ao programa errado (`redes_municipais`). Todas as condicionais e opções de projeto devem referenciar `regionais` com os projetos corretos: Jornada PEI, PEC Qualidade de Aula, Professor Tutor, Voar.

## Alterações (3 arquivos, sem migration)

A migration anterior (`ALTER TABLE registros_acao ADD COLUMN projeto text`) está correta e permanece.

### 1. `src/pages/admin/ProgramacaoPage.tsx`
- **Linha 2042**: Trocar `formData.programa?.includes('redes_municipais')` por `formData.programa?.includes('regionais')`
- **Linhas 2053-2056**: Substituir as 4 opções por: Jornada PEI, PEC Qualidade de Aula, Professor Tutor, Voar

### 2. `src/pages/admin/AdminDashboard.tsx`
- **Linha 580**: Trocar `programaFilter === 'redes_municipais'` por `programaFilter === 'regionais'`
- **Linhas 587-590**: Substituir as 4 opções por: Jornada PEI, PEC Qualidade de Aula, Professor Tutor, Voar

### 3. `src/pages/admin/RelatoriosPage.tsx`
- **Linha 1081**: Trocar `programaFilter === 'redes_municipais'` por `programaFilter === 'regionais'`
- **Linhas 1088-1091**: Substituir as 4 opções por: Jornada PEI, PEC Qualidade de Aula, Professor Tutor, Voar

## O que NÃO muda
- Migration SQL (já aplicada corretamente)
- Lógica de states, useEffect, queries, interfaces, filtragem de dados
- Nenhuma outra funcionalidade existente

