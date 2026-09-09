# Formação Coletiva — ajustes na ação e no painel

## 1. Cadastro da ação

- Ocultar o campo **Título** (gera título automático, como nas demais ações do Programa Escolas).
- Descrição, Tags e Hora início/fim seguem ocultos como hoje.

## 2. Formulário de registro (perguntas numeradas)

Todas obrigatórias, exceto Anotações:

1. **Tema**
2. **Quantidade de professores participantes** (número)
3. **Papel de atuação da consultoria** (antes "Formato") — opções:
   - Liderança da mediação
   - Co-liderança da mediação
   - Co-construção de pauta com PAAC/CGP para ele mediar
4. **Como o coordenador/PAAC participou da construção da pauta?** — opções:
   - Não participou
   - Apenas validou
   - Trouxe sugestões à pauta elaborada pelo consultor
   - Participou ativamente na ideação, construção e validação da pauta
5. **A formação aconteceu conforme planejada?** (Sim / Não / Em parte)
   - Se "Não" ou "Em parte": **Registro dos desafios** (texto longo, obrigatório)
6. **Link da pauta**
7. **Anotações** (texto longo, opcional)

Retiradas: **NPS da formação** e **Destaques e desafios da formação**.

O envio é bloqueado com aviso quando faltar alguma resposta obrigatória, tanto ao criar a ação quanto pela tela de Registros.

## 3. Painel "Relatório - Formação Coletiva"

Sai da tela e do PDF tudo que dependia do NPS: cards **Nota Média de NPS** e **NPS**, distribuição de notas, linhas de NPS na evolução mensal e a lista de "Destaques e desafios".

Passa a mostrar:

- Cards: Total de formações, Total de professores participantes, Média de participantes, % de co-liderança, Média de participação do coordenador/PAAC (0–3), Formações conforme planejado (%).
- Distribuição por **Papel de atuação da consultoria**.
- Distribuição por **Participação do coordenador/PAAC na pauta**.
- Distribuição de **A formação aconteceu conforme planejada?** (Sim / Não / Em parte).
- Rankings por Escola e por Consultor(a) (quantidade e total de professores).
- Evolução mensal: volume de formações, professores participantes e média de participação na pauta.
- Listas qualitativas: **Temas** (com escola, consultor, data e link da pauta), **Registro dos desafios** e **Anotações**.

Tudo replicado no PDF, com marca Parceiros + Bússola e ordenação A-Z pt-BR.

## Detalhes técnicos

- `src/components/formularios/OlharParceiroContents.tsx`: reescrever `FormacaoColetivaContent` com as 7 questões numeradas; novas constantes `FORMACAO_COLETIVA_PAPEL_OPTIONS` e `FORMACAO_COLETIVA_PARTICIPACAO_OPTIONS` (+ `_SCORE` 0–3 atualizado); novos campos `conforme_planejado`, `desafios`, `anotacoes`; exportar `validateFormacaoColetiva`.
- Registros antigos: valores legados de formato ("Liderança", "Co-liderança", "Co-construção de Pauta") e de participação são normalizados para os novos rótulos apenas na leitura do painel; nenhuma migração de banco.
- `ProgramacaoPage.tsx`: ocultar Título para `registro_formacao_coletiva` (com título automático) e chamar `validateFormacaoColetiva` antes de salvar; mesma validação em `RegistrosPage.tsx`.
- `RelatoriosFormacaoColetivaPanelPage.tsx`: remover cálculos de `nps`/`npsScore`/`destaques_desafios`, adicionar distribuições e listas novas, ajustar `pdfKpis` e a tabela de evolução mensal.
- `RelatoriosGestaoEscolasPage.tsx`: remover referência ao NPS de Formação Coletiva, se houver.
- Atualizar `mem://features/action-types/...` e `mem://logic/nps-calculation` (NPS deixa de existir neste instrumento).
