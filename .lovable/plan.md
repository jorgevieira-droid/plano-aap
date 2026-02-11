

## Corrigir formulario errado no Acompanhamento de Formacao

### Problema identificado
Na pagina de registro de acao (`AAPRegistrarAcaoPage.tsx`), o tipo `formacao` esta classificado simultaneamente como:
- `PRESENCE_TYPE` (correto - deve ter lista de presenca)
- `INSTRUMENT_TYPE` (incorreto - o instrumento de formacao NAO deve aparecer no registro)

Isso faz com que, ao registrar uma acao do tipo `formacao`, alem da lista de presenca, apareca tambem o formulario de instrumento da Formacao (com campos Tema, Objetivos, Conteudos, Metodologia, etc.). Esse formulario e exibido mas nunca salvo, pois o submit so salva instrumento para tipos HYBRID.

O mesmo problema pode afetar a exibicao: como `isInstrumentType` e `true` para `formacao`, a logica de renderizacao mostra o instrumento junto com a presenca, causando confusao.

### Solucao
Ajustar a logica de renderizacao do instrumento para que tipos que sao `PRESENCE_TYPE` mas NAO sao `HYBRID_TYPE` nao mostrem o formulario de instrumento.

### Alteracoes em `src/pages/aap/AAPRegistrarAcaoPage.tsx`

#### 1. Corrigir condicao de exibicao do InstrumentForm (linha 875)
Alterar de:
```text
((isInstrumentType && normalizedTipo) || (isHybridType && normalizedTipo))
```
Para:
```text
(((isInstrumentType && !isPresenceType) && normalizedTipo) || (isHybridType && normalizedTipo))
```

Isso garante que:
- `formacao` (isPresenceType=true, isHybridType=false): mostra APENAS presenca
- `acompanhamento_formacoes` (isPresenceType=true, isHybridType=true): mostra presenca + instrumento (correto)
- `agenda_gestao` (isInstrumentType=true, isPresenceType=false): mostra APENAS instrumento (correto)

#### 2. Corrigir condicao de exibicao das observacoes (linha 890)
A condicao `!isInstrumentType` tambem precisa considerar o mesmo ajuste para nao ocultar observacoes de tipos que sao `PRESENCE_TYPE`:
Alterar de:
```text
!isInstrumentType
```
Para:
```text
(!isInstrumentType || isPresenceType) && !isHybridType
```

### Arquivo modificado
- `src/pages/aap/AAPRegistrarAcaoPage.tsx` - unico arquivo alterado
