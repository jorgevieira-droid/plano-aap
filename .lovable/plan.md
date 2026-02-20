
# Atualizar Modelo de Importação em Lote de Programações

## Diagnóstico

O `ProgramacaoUploadDialog` está desatualizado em dois aspectos críticos:

1. **Tipos de ação obsoletos**: Valida apenas `formacao`, `visita` e `acompanhamento_aula` — sendo que `visita` não existe mais no sistema e `acompanhamento_aula` foi renomeado para `observacao_aula`. Os 13 novos tipos de ação não são reconhecidos.

2. **Valor incorreto de Componente**: A validação aceita `'portugues'` mas o sistema usa `'lingua_portuguesa'`.

3. **Modelo Excel desatualizado**: O template gerado só exemplifica `formacao` e usa a coluna `AAP` que hoje representa qualquer ator do programa.

## Análise: Quais tipos são importáveis em lote?

A importação em lote serve para **agendar** programações futuras. Tipos que requerem preenchimento de instrumento, geração automática ou reflexão individual **não são candidatos**:

| Tipo | Importável? | Motivo |
|---|---|---|
| `formacao` | Sim | Agendamento simples |
| `agenda_gestao` | Sim | Agendamento simples |
| `devolutiva_pedagogica` | Sim | Agendamento simples |
| `obs_engajamento_solidez` | Sim | Agendamento simples |
| `obs_implantacao_programa` | Sim | Agendamento simples |
| `obs_uso_dados` | Sim | Agendamento simples |
| `qualidade_acomp_aula` | Sim | Agendamento simples |
| `qualidade_implementacao` | Sim | Agendamento simples |
| `qualidade_atpcs` | Sim | Agendamento simples |
| `sustentabilidade_programa` | Sim | Agendamento simples |
| `observacao_aula` | **Não** | Requer instrumento por professor no ato |
| `acompanhamento_formacoes` | **Não** | Gerado automaticamente a partir de formações |
| `autoavaliacao` | **Não** | Reflexão individual sem entidade fixa |
| `avaliacao_formacao_participante` | **Não** | Formulário preenchido pelo participante |
| `lista_presenca` | **Não** | Gerada junto com a formação |
| `participa_formacoes` | **Não** | Desativado do sistema |

## Alterações no `src/components/forms/ProgramacaoUploadDialog.tsx`

### 1. Atualizar lista de tipos válidos

```typescript
// Antes
const tiposValidos = ['formacao', 'visita', 'acompanhamento_aula'];

// Depois
const tiposImportaveis = [
  'formacao',
  'agenda_gestao',
  'devolutiva_pedagogica',
  'obs_engajamento_solidez',
  'obs_implantacao_programa',
  'obs_uso_dados',
  'qualidade_acomp_aula',
  'qualidade_implementacao',
  'qualidade_atpcs',
  'sustentabilidade_programa',
] as const;
```

### 2. Corrigir valor de Componente

```typescript
// Antes
const componentesValidos = ['polivalente', 'portugues', 'matematica'];

// Depois
const componentesValidos = ['polivalente', 'lingua_portuguesa', 'matematica'];
```

### 3. Atualizar lógica de validação de Segmento/Componente/Ano

Atualmente, apenas `visita` isenta esses campos. Na nova lógica, os tipos que **não** usam Segmento/Componente/Ano (conforme `ACAO_FORM_CONFIG`) devem ser isentos. Importar a configuração `ACAO_FORM_CONFIG` para determinar dinamicamente quais campos são opcionais por tipo:

```typescript
import { ACAO_FORM_CONFIG } from '@/config/acaoPermissions';

// Na validação de cada linha:
const config = ACAO_FORM_CONFIG[tipo as AcaoTipo];
const requiresSegmento = config?.showSegmento ?? true;
const requiresAnoSerie = config?.showAnoSerie ?? true;
```

### 4. Atualizar instruções no dialog

Substituir os tipos exibidos na seção de formato:
```
TIPO: formacao | agenda_gestao | devolutiva_pedagogica | obs_engajamento_solidez |
      obs_implantacao_programa | obs_uso_dados | qualidade_acomp_aula |
      qualidade_implementacao | qualidade_atpcs | sustentabilidade_programa
```

Renomear coluna `AAP` → `ATOR` na instrução (mantendo retrocompatibilidade na leitura do arquivo).

Adicionar nota explicativa: *"Tipos como Observação de Aula, Autoavaliação e Lista de Presença não podem ser importados em lote pois requerem preenchimento de instrumento no momento do registro."*

### 5. Atualizar o modelo Excel (duas abas)

**Aba 1 — "Programacoes"**: Linha de exemplo com `formacao` (mais comum), coluna renomeada para `ATOR`.

**Aba 2 — "Tipos e Valores Válidos"**: Tabela de referência:

| Campo | Valor | Descrição |
|---|---|---|
| TIPO | formacao | Formação |
| TIPO | agenda_gestao | Agenda de Gestão |
| TIPO | devolutiva_pedagogica | Devolutiva Pedagógica |
| TIPO | obs_engajamento_solidez | Obs. – Engajamento e Solidez |
| TIPO | obs_implantacao_programa | Obs. – Implantação do Programa |
| TIPO | obs_uso_dados | Obs. Uso Pedagógico de Dados |
| TIPO | qualidade_acomp_aula | Qualidade Acomp. de Aula (Coord.) |
| TIPO | qualidade_implementacao | Qualidade da Implementação |
| TIPO | qualidade_atpcs | Qualidade de ATPCs |
| TIPO | sustentabilidade_programa | Sustentabilidade e Aprendizado |
| SEGMENTO | anos_iniciais | Anos Iniciais |
| SEGMENTO | anos_finais | Anos Finais |
| SEGMENTO | ensino_medio | Ensino Médio |
| COMPONENTE | polivalente | Polivalente |
| COMPONENTE | lingua_portuguesa | Língua Portuguesa |
| COMPONENTE | matematica | Matemática |
| PROGRAMA | escolas | Programa de Escolas |
| PROGRAMA | regionais | Regionais de Ensino |
| PROGRAMA | redes_municipais | Redes Municipais |

### 6. Retrocompatibilidade

Manter leitura das colunas antigas no parse para não quebrar arquivos já existentes:
- `AAP` ou `ATOR` ou `FORMADOR` → campo do ator
- Tipos legados `visita` → mapeado para `observacao_aula` com aviso; `acompanhamento_aula` → mapeado para `observacao_aula` com aviso

## Resumo das alterações

| Aspecto | Antes | Depois |
|---|---|---|
| Tipos válidos | 3 (2 legados obsoletos) | 10 tipos atuais do sistema |
| Componente | `portugues` (errado) | `lingua_portuguesa` (correto) |
| Segmento/Componente obrigatório | Opcional só para `visita` | Opcional dinamicamente por tipo via `ACAO_FORM_CONFIG` |
| Coluna do ator | `AAP` | `ATOR` (lendo ambos) |
| Modelo Excel | 1 aba, sem referência de tipos | 2 abas com guia completo |
| Tipos não importáveis | Sem indicação | Removidos + nota explicativa no dialog |
