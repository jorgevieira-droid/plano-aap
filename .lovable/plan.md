

## Ajustes no formulário de "Registro da Consultoria Pedagógica"

Alterações em `src/components/formularios/ConsultoriaPedagogicaForm.tsx`, conforme os 6 pontos do documento. Necessária 1 migration para 3 novas colunas numéricas (item 5).

### 1. Etapa de Ensino (item 1 do doc)
- Renomear título do card de **"Etapa de Ensino"** para **"Etapa de Ensino acompanhada na visita"**.
- Manter as 3 opções atuais (EFAI / EFAF / EM) e o toggle "Escola do Voar?" inalterados.

### 2. Agenda (item 2)
- Renomear label "A agenda foi planejada?" → **"A agenda da visita foi planejada previamente com o coordenador(a)?"**.
- Renomear label "A agenda foi alterada?" → **"A agenda foi alterada durante a visita?"**.
- A textarea condicional já existe quando `agendaAlterada = true`; apenas atualizar o label/placeholder para **"Explicite as razões da alteração da agenda programada."**.
- Atualizar a mensagem do `toast.error` correspondente.

### 3. Ações formativas junto aos professores (item 3) — reordenar
Nova ordem dos `NumberField`s no card:
1. Professores observados
2. Aulas observadas – Língua Portuguesa
3. Aulas observadas – Matemática
4. Aulas observadas – OE Língua Portuguesa (renomear de "com OE")
5. Aulas observadas – OE Matemática (renomear de "com OE")
6. Aulas observadas – Professor Tutor Língua Portuguesa *(novo label para o atual `aulas_tutoria_obs` — split LP)*
7. Aulas observadas – Professor Tutor Matemática *(novo campo, ver §6)*
8. Devolutivas realizadas aos professores (renomear de "Devolutivas ao professor")
9. ATPCs ministrados → **mover para a nova seção ATPC (item 5)** e renomear como "ATPCs ministrados por você".

Os campos VOAR (turma padrão / adaptada), quando aplicáveis, permanecem ao final do card sem alteração.

### 4. Ações formativas junto à coordenação (item 4)
- Renomear título do card para **"Em relação às ações de formação da coordenação para realização do Apoio Presencial:"**.
- Manter os 4 primeiros campos na ordem indicada (renomeando o primeiro para incluir "Quantidade de aulas observadas em parceria com a coordenação pedagógica"):
  1. Quantidade de aulas observadas em parceria com a coordenação pedagógica (`aulas_obs_parceria_coord`)
  2. Observação de aula em parceria com a coordenação *(item adicional do doc — ver nota técnica abaixo)*
  3. Devolutivas modelizadas à coordenação pedagógica (`devolutivas_model_coord`)
  4. Devolutivas da coordenação pedagógica acompanhadas (`acomp_devolutivas_coord`)
- **Mover** os campos "ATPCs acompanhados pela coordenação" (`atpcs_acomp_coord`) e "Devolutivas da coordenação sobre ATPC" (`devolutivas_coord_atpc`) para a nova seção ATPC (item 5).

### 5. Nova seção: "Em relação às ações de formação ligadas à ATPC" (item 5)
Card novo com 3 NumberFields:
- **ATPCs ministrados por você** → reaproveita coluna existente `atpcs_ministrados`.
- **ATPCs realizados pela coordenação e acompanhados por você** → reaproveita coluna existente `atpcs_acomp_coord`.
- **Devolutivas sobre os ATPCs ministrados pela coordenação** → reaproveita coluna existente `devolutivas_coord_atpc`.

### 6. Questões finais (item 6) — atualizar labels e adicionar 1 campo
- Renomear "Análise de dados?" → **"Houve análise de dados sobre os resultados de aprendizagem dos estudantes?"** (continua usando `analise_dados`).
- Renomear "Pauta formativa?" → **"Houve levantamento de temas e/ou construção de pautas formativas com a coordenação?"** (continua usando `pauta_formativa`).
- Demais campos (Boas práticas, Pontos de preocupação, Encaminhamentos, Outros pontos) inalterados.

### Banco de dados — migration
Adicionar colunas (numéricas, default 0, NULL permitido) em `consultoria_pedagogica_respostas` apenas para os campos genuinamente novos:
- `aulas_obs_tutor_lp INT DEFAULT 0` — Aulas observadas Professor Tutor LP
- `aulas_obs_tutor_mat INT DEFAULT 0` — Aulas observadas Professor Tutor Matemática
- `obs_aula_parceria_coord_extra INT DEFAULT 0` — segundo item "Observação de aula em parceria com a coordenação" da seção coordenação (item 4, linha 2)

(Os 3 itens da seção ATPC reaproveitam colunas existentes — sem nova coluna.)

### O que NÃO muda
- Estrutura de salvamento/RLS, página de relatório (`RelatorioConsultoriaPage`) e e-mail — nenhum campo é removido; apenas reaproveitamento de colunas e labels.
- Permissões, fluxo de agendamento, `useFormFieldConfig` keys existentes (apenas adição das 3 novas keys para os campos novos).
- Demais formulários e tipos de ação.

### Resultado esperado
O formulário "Registro da Consultoria Pedagógica" passa a refletir exatamente os 6 ajustes do documento: títulos/labels reescritos, seções reordenadas, nova seção ATPC com os 3 itens consolidados, e duas novas perguntas finais com texto completo — preservando todos os dados já gravados.

