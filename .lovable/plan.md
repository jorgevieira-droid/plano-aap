

## Atualizar instrumento "Registro de Apoio Presencial" conforme novo documento

### Diagnóstico
Comparei o documento anexo com a implementação atual e a maior parte da estrutura **já existe** (campos C/R, focos, escala 0–3, ordem 3→0, perguntas obrigatórias finais, filtro de professor por LP/MAT). As diferenças são pontuais e ficam concentradas no **conteúdo** das rubricas (textos, subtextos e marcação SEDUC-SP), não na arquitetura.

### O que será alterado

**1. Atualizar enunciados das 23 rubricas no banco** (`instrument_fields`)
- Sobrescrever cada `label` com o texto literal do documento.
- Adicionar à coluna `description` o subtexto em itálico de cada rubrica (frase explicativa do documento).
- Adicionar prefixo `*` nas rubricas que pertencem à rubrica oficial SEDUC-SP, conforme marcação do documento (ex.: `*2 - O objetivo de aprendizagem...`, `*3 - A compreensão dos estudantes...`).

**2. Inserir nota explicativa antes das rubricas** (`RegistroApoioPresencialForm.tsx`)
- Acima do bloco de rubricas (componente `InstrumentForm`), exibir um aviso fixo:
  > "Responda as rubricas referentes ao(s) foco(s) de observação escolhido(s). As perguntas marcadas com * fazem parte da rubrica da SEDUC-SP."
- Renderizar acima dos focos visíveis para que apareça apenas no momento do gerenciamento (já é onde o componente é usado).

**3. Renderizar `description` em itálico em cada rubrica**
- Verificar se o `InstrumentForm` / `RatingScale` já mostra `description`. Se sim, basta popular o campo no banco. Se não, adicionar render condicional do subtexto em `<p class="text-sm italic text-muted-foreground">` logo abaixo do label.

### O que **não** muda
- Estrutura dos campos (C) de cadastro (Programa, Data, Consultor, Escola, Voar, Componente, Etapa, Turma VOAR, Professor, Participantes, Obs. planejada, Focos, Devolutiva). Já está correta.
- Campos (R) de Alunos previstos / presentes (Número) e Horário previsto / real (mantidos como `time` HH:MM, conforme sua confirmação).
- Escala 0–3 (Nada efetivo → Muito efetivo) com ordem 3 → 0.
- 4 perguntas obrigatórias finais (já estão alinhadas).
- Filtro do dropdown de professor por componente (LP/Tutoria LP/OE LP → língua portuguesa; Mat/Tutoria MAT/OE MAT → matemática) — já implementado.

### Arquivos afetados
- **Migration nova** em `supabase/migrations/...sql` — `UPDATE instrument_fields` para rotular os 23 campos com texto e subtexto literais do documento e marcar com `*` os de origem SEDUC-SP.
- `src/components/formularios/RegistroApoioPresencialForm.tsx` — adicionar a nota explicativa acima do `InstrumentForm`.
- `src/components/instruments/InstrumentForm.tsx` e/ou `src/components/instruments/DimensionBlock.tsx` — caso ainda não exibam, renderizar `description` em itálico abaixo do label.

### Detalhes técnicos
- A migration usará `UPDATE` por `field_key` (não recriação), preservando IDs e respostas já gravadas.
- A nota explicativa será exibida apenas quando houver pelo menos 1 foco selecionado (`visibleFieldKeys.length > 0`), ou seja, dentro do gerenciamento — nunca no cadastro.
- Subtextos serão armazenados em `instrument_fields.description` (já existe na tabela) — sem necessidade de mudar schema.

### Resultado esperado
- O instrumento de Apoio Presencial passa a apresentar o texto exato do documento, com subtítulos contextuais e identificação clara das rubricas SEDUC-SP.
- Nenhuma alteração em respostas já registradas, já que apenas labels/descrições mudam.

