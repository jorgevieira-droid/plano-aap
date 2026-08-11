# Corrigir "Adicionar Ação" para perfis operacionais

## O que está acontecendo

A página abre para todos, mas ao clicar em um card ela envia o usuário para `/programacao`. Essa rota **não é permitida** para o grupo operacional (N4.1 CPed, N4.2 GPI, N5 Formador, AAPs) — esses perfis usam `/aap/calendario`, que é a mesma tela. Resultado: o clique joga o usuário de volta para o painel/Adicionar Ação e "não funciona". Perfis N1–N3 e N6/N7 têm `/programacao` liberado, por isso funcionam normalmente.

Dois pontos secundários que também podem deixar o clique sem efeito:

1. A tela de programação valida a ação recebida usando o **cargo real** do usuário, enquanto a página Adicionar Ação monta os cards usando o **cargo simulado** (quando um admin está simulando). Se houver divergência, o formulário simplesmente não abre, sem nenhuma mensagem.
2. Quando a ação escolhida não está habilitada para o programa do usuário (por exemplo, ações que não valem para Regionais), o formulário abre sem programa definido e trava na validação.

## O que será feito

1. **Destino correto por perfil:** em Adicionar Ação, direcionar para `/aap/calendario` quando o usuário for do grupo operacional e para `/programacao` nos demais casos, mantendo os mesmos parâmetros (`novaAcao`, `direto=1`, `programa`).
2. **Mesma regra de permissão nos dois lados:** a validação da ação recebida por link passará a considerar o cargo efetivo (simulado quando houver simulação), igual à página Adicionar Ação.
3. **Feedback quando a ação não puder ser aberta:** se a ação não for válida para o perfil/programa, exibir um aviso claro em vez de não fazer nada, e não listar na página os cards cujo tipo não esteja disponível para o programa selecionado.

## Detalhes técnicos

- `src/pages/admin/AdicionarAcaoPage.tsx`: usar `roleTier` do `AuthContext` para escolher a rota base no `handleSelect`; filtrar cards por `getProgramasForTipo` equivalente (ações sem o programa selecionado saem da lista).
- `src/pages/admin/ProgramacaoPage.tsx`: no efeito de deep-link (`?novaAcao=...`), trocar `creatableAcoes` (baseado em `profile?.role`) por lista baseada no cargo efetivo com simulação, e adicionar `toast` de erro quando o tipo for rejeitado.
- Nenhuma mudança de banco de dados ou de permissões de rota em `AppLayout` é necessária.
