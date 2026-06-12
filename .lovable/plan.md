## Plano

### 1. Rel. Consultoria Pedagógica visível apenas quando a ação está liberada para o programa do usuário
- Usar o hook existente `useAcoesByPrograma` em `Sidebar.tsx` para verificar se `registro_consultoria_pedagogica` está habilitada para o(s) programa(s) do usuário (via `form_config_settings`).
- Admin: sempre vê.
- Demais perfis: o item só aparece se ao menos um dos programas do usuário (ou o programa simulado) tiver a ação habilitada.
- Aplicar a mesma regra para `Visualização Consultoria` (depende da mesma ação).

### 2. Pontos Observados — apenas Admin + flag DESABILITADA
- Remover o item dos menus `managerMenuItems`, `operationalMenuItems` e `observerMenuItems`.
- Manter no `adminMenuItems` com `disabled: true` (mesmo padrão de `Evolução Professor`: badge "Desabilitada" ao lado, link permanece clicável).
- Remover o filtro especial `roleTier === 'operational' && profile?.role === 'n5_formador'` que removia o item (não mais necessário).

### 3. Renomear "Relatórios" → "Relatórios Gerais"
- Sidebar: alterar o `label` do item `/relatorios` em todos os menus (admin, manager, observer).
- Página `src/pages/admin/RelatoriosPage.tsx`: atualizar apenas o título exibido no topo. Rota e nome de arquivo permanecem.

### 4. Ajustar menu lateral conforme programa do usuário
Mapear cada item de menu dependente de ação para um (ou mais) `acaoTipo`. Usando `useAcoesByPrograma().isAcaoEnabledForPrograma(tipo, programa)` contra o(s) programa(s) do usuário, ocultar o item se nenhuma ação relacionada estiver habilitada para nenhum dos programas do usuário. Admin não é filtrado.

Mapeamento proposto (apenas itens dependentes de ação):

| Item de menu | Ação(ões) que habilita |
|---|---|
| Rel. Consultoria Pedagógica | `registro_consultoria_pedagogica` |
| Visualização Consultoria | `registro_consultoria_pedagogica` |
| Visualização Apoio Presencial | `registro_apoio_presencial` |
| Rel. Regionais | `monitoramento_acoes_formativas`, `monitoramento_gestao` |
| Matriz de Ações | qualquer ação habilitada para o programa |
| Histórico Presença | qualquer ação de Formação habilitada |
| Lista de Presença | qualquer ação de Formação habilitada |
| Relatório de Instrumentos | qualquer instrumento habilitado para o programa |
| Relatórios Narrativos | qualquer instrumento habilitado |

Itens estruturais (Dashboard, Programação, Escolas, Usuários, Atores, Manual, Histórico de Alterações, Relatório de Acessos, Configurar Formulário, Notion, Pendências, Relatórios Gerais) permanecem sem filtro por programa.

Observação: a memória `Navigation: Keep menus and route permissions statically configured` é mantida — a lista de menus continua hardcoded; somente a visibilidade depende de `form_config_settings`, que já é a fonte de verdade usada em dashboards/relatórios.

### 5. Manual do Usuário — seções a revisar (aprovar antes de escrever)
Levantamento das seções/ações que precisam ser criadas ou atualizadas com base nas implementações recentes:

**Novas ações a documentar:**
1. Registro de Apoio Presencial (3 focos, rubrica 0–3, permissões Consultoria).
2. Encontro de Microciclos de Recomposição (escala 0–2, agendamento automático do próximo encontro).
3. Observação de Aula (GPA) (9 critérios 1–4, evidências, encaminhamentos).
4. Visita Técnica — Alfabetização (8 critérios 1–4, Q4 "Não se aplica à rede", legenda + card de score).
5. Visita Técnica — Microciclos / TaRL / Alfabetização REDES (consolidar variações por programa).
6. Encontros ETEG REDES e Encontro Professor REDES.
7. Monitoramento de Ações Formativas e Monitoramento de Gestão (programa Regionais).
8. Reunião de Acompanhamento de Alfabetização.

**Mecânicas e funcionalidades a atualizar:**
9. Relatórios Narrativos (geração com IA, filtros aplicados no PDF, custo estimado).
10. Gráfico "Custo de Relatórios Narrativos (USD)" em Relatório de Acessos (visível a N1–N3).
11. Pendências e SLA de 3 dias com notificações automáticas para N3.
12. Atores dos Programas (N1–N8) e Atores Educacionais (/professores).
13. Entidades Filho (sub-entidades REDES, Monitoramento, Regionais).
14. Configurar Formulário (mapeamento de campos por instrumento e perfil).
15. Filtragem dinâmica de entidades por programa nos formulários.
16. Simulação de perfil/programa (Admin).
17. Renomeação: plataforma "Bússola"; "Rel. Consultoria Pedagógica"; "Relatórios Gerais"; "Ator do Programa".
18. Política de senhas (mín. 9 caracteres, reset hierárquico).
19. Importações em lote (Escolas, Programação, Entidades Filho, Usuários).
20. Integração Notion (sincronização bidirecional de tarefas).

**Ajustes finos:**
- Remover/ajustar referências a "Pontos Observados" para indicar que está desabilitada.
- Revisar a seção de "Evolução do Professor" indicando que segue desabilitada.
- Atualizar capturas/descrições de menu para refletir filtragem por programa.

Após sua aprovação desta lista (manter todas, remover algumas, adicionar outras), eu redijo o conteúdo no Manual e gero a versão atualizada.

### Arquivos que serão alterados (itens 1–4)
- `src/components/layout/Sidebar.tsx` (filtragem por ação, rename, Pontos Observados desabilitado).
- `src/pages/admin/RelatoriosPage.tsx` (título no topo).
- Sem migrações nem mudanças em rotas/permissões backend.

### Itens em sequência separada
- Item 5 (Manual) só será executado após sua confirmação da lista de seções.
