# Novos nomes das ações/eventos (somente rótulos)

Alteração visual: muda apenas o que aparece na tela. Nada muda no banco de dados, nas rotas ou nas permissões — os registros já existentes continuam funcionando normalmente.

## De => Para

| De | Para |
| --- | --- |
| Registro de Apoio Presencial com Coordenação | Apoio Presencial com a Coordenação |
| Registro de Apoio Presencial | Apoio Presencial |
| Registro de Apoio ao Coordenador | Reunião com a coordenação |
| Registro de Aula Compartilhada | Aula compartilhada com prof. |
| Registro de Formação Coletiva | Formação Coletiva |
| Registro de Planejamento Conjunto com o Professor | Planejamento conjunto com prof. |

## Onde os nomes serão atualizados

- Tela "Adicionar Ação" e seletores de tipo de ação
- Programação/Calendário e lista de Registros
- Títulos dos formulários e mensagens de sucesso ao salvar
- Títulos das páginas de relatório e dos PDFs gerados, por exemplo:
  - "Relatórios - Apoio Presencial"
  - "Relatório - Apoio Presencial com a Coordenação"
  - "Relatório - Reunião com a coordenação"
  - "Relatório - Aula compartilhada com prof."
  - "Relatório - Formação Coletiva"
  - "Relatório - Planejamento conjunto com prof."
- Cartões e links da página "Relatórios de Gestão - Programa Escolas"
- Páginas de visualização e impressão do formulário completo
- Manual do Usuário

## Detalhes técnicos

- `src/config/acaoPermissions.ts` (`ACAO_TYPE_INFO`) e `src/hooks/useInstrumentFields.ts` (`INSTRUMENT_FORM_TYPES`) — fonte principal dos rótulos.
- Textos fixos em: `RelatoriosApoioPresencialPanelPage.tsx`, `RelatoriosApoioCoordenacaoPanelPage.tsx`, `RelatoriosApoioCoordenadorPanelPage.tsx`, `RelatoriosFormacaoColetivaPanelPage.tsx`, `RelatoriosPlanejamentoConjuntoPanelPage.tsx`, `RelatoriosAulaCompartilhadaPanelPage.tsx`, `RelatoriosGestaoEscolasPage.tsx`, `RelatorioApoioPresencialPage.tsx`, `RelatorioConsultoriaVisualizacaoPage.tsx`, `ProgramacaoPage.tsx`, `EvolucaoProfessorPage.tsx`, `ManualUsuarioPage.tsx`, `RegistroApoioPresencialPrintSection.tsx`, `RegistroApoioPresencialForm.tsx`, `ConsultoriaPedagogicaForm.tsx`, `ConsultoriaPedagogicaFormLegacy.tsx`.
- Chaves técnicas mantidas: `registro_apoio_presencial`, `registro_consultoria_pedagogica`, `registro_apoio_coordenador`, `registro_aula_compartilhada`, `registro_formacao_coletiva`, `registro_planejamento_conjunto`.
- Sem migração de banco; o De => Para fica registrado na memória do projeto.
