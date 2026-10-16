# Módulo 9 — Aulas compartilhadas: nova origem e filtro por período

## O que muda
1. **Origem dos dados:** a tabela "9. Aulas compartilhadas" passa a contar diretamente as ações "Aula compartilhada com prof." (realizadas, programa Escolas) — e não mais apenas as que têm o formulário de registro preenchido. Assim, nenhuma aula realizada fica de fora por falta de formulário.
   - Escola, Ano/série e Componente vêm do cadastro da ação.
   - Continua respeitando os filtros de Escola e Consultor(a) da página.
2. **Filtro próprio de período:** no topo do módulo 9, dois campos — **Data início** e **Data fim**.
   - Padrão: primeiro e último dia do mês selecionado no filtro "Mês" da página (e acompanha quando o mês muda).
   - O usuário pode ajustar livremente (ex.: trimestre); a escolha fica salva.
   - O período aparece no título do módulo no PDF e no PowerPoint.
3. Os demais módulos continuam com o filtro "Mês", sem alteração.

## Detalhes técnicos
- `ReuniaoMensalEscolasPage.tsx`: nova `useQuery` em `registros_acao` (`tipo = 'registro_aula_compartilhada'`, `status = 'realizada'`, `programa` contém `escolas`, `data` entre início/fim), com join em `programacoes` (`apoio_ano_serie`, `apoio_componente`) e `escolas(nome)`; fallback para `ano_serie`/`componente` do registro.
- Estados `aulasIni`/`aulasFim` via `usePersistedState`, reinicializados ao trocar o mês.
- Card "aulas compartilhadas" do Painel Geral mantém a contagem do mês (opcionalmente pode usar a mesma fonte — não alterado).
