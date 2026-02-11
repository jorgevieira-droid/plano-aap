

## Mover "Acompanhamento de Formações" para dentro do gerenciamento da Formação

### Problema atual
Ao clicar no botao "Acompanhamento" de uma Formacao realizada, o sistema abre o formulario de criacao com campos pre-preenchidos e travados. Isso causa confusao porque o formulario de criacao e compartilhado com todos os tipos de acao.

### Nova abordagem
O "Acompanhamento de Formacoes" sera criado automaticamente como etapa do gerenciamento da Formacao, quando o usuario marca a formacao como "realizada". O fluxo sera:

1. Usuario clica "Gerenciar" em uma Formacao prevista
2. Marca como "Sim, realizada"
3. Aparece uma opcao: "Agendar Acompanhamento de Formacao?"
4. Se marcar sim, preenche apenas data e horarios do acompanhamento
5. Ao confirmar, o sistema cria a programacao de acompanhamento automaticamente com todos os dados herdados da formacao original

### Alteracoes

#### 1. Remover botao "Acompanhamento" dos cards de Formacao realizada
- Remover o botao com icone LinkIcon que aparece nos cards da visao calendario (linha ~1692) e na tabela da visao lista (linha ~1789)
- Remover a funcao `handleCreateAcompanhamento` e o estado `formacaoOrigemId`

#### 2. Remover logica de `formacaoOrigemId` do formulario de criacao
- Remover o banner informativo, o tipo travado e os campos `disabled={!!formacaoOrigemId}`
- Remover as condicoes `if (formacaoOrigemId)` no `handleSubmit`
- O formulario de criacao volta a funcionar normalmente apenas para os tipos criáveis diretamente

#### 3. Adicionar opcao de acompanhamento no dialog de Gerenciamento
- No dialog "Gerenciar Acao" (`isManageDialogOpen`), quando o tipo da acao for `formacao` e o usuario selecionar "Sim" (realizada):
  - Exibir um checkbox: "Agendar Acompanhamento de Formacao"
  - Se marcado, exibir campos: Data, Horario Inicio e Horario Fim
  - Titulo sera gerado automaticamente: "Acompanhamento: [titulo da formacao]"

#### 4. Criar acompanhamento automaticamente no `handleManageSubmit`
- Quando a formacao for marcada como realizada e o checkbox de acompanhamento estiver ativo:
  - Inserir nova `programacao` com tipo `acompanhamento_formacoes`, dados herdados da formacao (escola, aap, segmento, componente, ano_serie, programa), e `formacao_origem_id` preenchido
  - Inserir `registro_acao` correspondente com status `agendada`
  - Toast de sucesso indicando que o acompanhamento foi agendado

### Detalhes tecnicos

**Novos estados no componente:**
- `agendarAcompanhamento: boolean` - se o usuario quer agendar acompanhamento
- `acompanhamentoData: string` - data do acompanhamento
- `acompanhamentoHorarioInicio: string` - horario inicio
- `acompanhamentoHorarioFim: string` - horario fim

**Arquivos modificados:**
- `src/pages/admin/ProgramacaoPage.tsx` - unico arquivo alterado

**Fluxo resumido:**

```text
Formacao (prevista) 
  -> Gerenciar 
    -> "Foi realizada?" Sim 
      -> [x] Agendar Acompanhamento? 
        -> Data, Inicio, Fim 
      -> Confirmar
        -> Cria programacao de acompanhamento automaticamente
```

