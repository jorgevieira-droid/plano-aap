# Medir tempo de uso da plataforma por usuário

## Situação atual
Hoje a plataforma não registra quanto tempo cada pessoa fica conectada. Ela guarda só **um registro por dia**: o horário do primeiro acesso. Não há como saber quanto tempo a pessoa ficou nem quando saiu. Também não dá para recuperar isso para datas passadas.

## Proposta
1. **Registrar atividade a cada 5 minutos** enquanto a pessoa estiver com a plataforma aberta e em uso. Se a aba ficar escondida ou parada por mais de 5 minutos, a contagem pausa.
2. **Calcular por dia**: primeiro acesso, último sinal de atividade e tempo ativo estimado (número de intervalos × 5 min).
3. **Exibir** o tempo ativo na página de acessos de usuários que já existe (mesmas permissões de N1 a N5) e incluir esse dado na exportação para Excel.

Observações: o valor é uma estimativa com margem de cerca de 5 minutos. A contagem só vale a partir do dia em que isso for ativado.

## Detalhes técnicos
- Nova tabela `user_activity_ping` (user_id, dia, minuto do bloco), com chave única por bloco de 5 minutos, RLS e grants seguindo os mesmos padrões de `user_access_log`.
- Nova função RPC `log_activity_ping()` do tipo security definer, no fuso de São Paulo, que faz insert ignorando conflito.
- Um intervalo de 5 minutos no `AuthContext`, que só dispara com `document.visibilityState === 'visible'` e com interação recente (mouse/teclado).
- Uma função de agregação por usuário e dia (tempo ativo, primeiro e último acesso) usada pelo relatório.
