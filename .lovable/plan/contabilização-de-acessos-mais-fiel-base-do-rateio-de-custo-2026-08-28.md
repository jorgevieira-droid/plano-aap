# Contabilização de acessos mais fiel (base do rateio de custo)

## Como funciona hoje

O registro de acesso acontece em um único ponto: quando a pessoa digita e-mail e senha e o login é aceito. Nada mais gera registro — nem abrir o sistema já logado, nem recarregar a página, nem navegar entre telas.

Essa regra foi criada de propósito, porque antes o sistema contava dezenas de eventos falsos por dia (renovação de token, várias abas, restauração de sessão). Só que ela foi longe demais: como a sessão fica válida por muito tempo, quem usa o sistema todo dia praticamente nunca refaz o login — e por isso "some" do relatório.

## Evidência nos dados

Registros de acesso por mês (usuários distintos / usuário-dias):

```text
abr/26   34 usuários   120 usuário-dias
mai/26   49 usuários   338 usuário-dias
jun/26   51 usuários   319 usuário-dias
jul/26   12 usuários    19 usuário-dias
ago/26   12 usuários    17 usuário-dias
```

A usuária do print tem 53 registros, todos entre 19/04 e 18/05/2026. Ou seja: a partir de julho o número não representa mais o uso real — só captura quem foi obrigado a refazer login. Usar isso como base de rateio hoje distorce o custo entre programas.

## O que será feito

Trocar a régua de "quantos logins com senha" para **"em quais dias a pessoa realmente usou a ferramenta"** — que é exatamente o que interessa para o rateio.

1. **Marcação diária de uso (heartbeat)**
   - Quando o sistema carrega com uma sessão ativa (login novo, retorno à ferramenta, nova aba), grava **no máximo 1 registro por usuário por dia**.
   - Trava dupla contra inflar: controle no navegador (não repete no mesmo dia) e uma regra no banco que impede dois registros do mesmo usuário no mesmo dia.

2. **Relatório de Acessos ajustado**
   - "Qtd Acessos" passa a se chamar **Dias de Uso** (é o mesmo número de dias ativos, agora fiel).
   - "Último acesso" passa a refletir o último dia de uso real.
   - Aviso curto na página indicando que dados anteriores a set/2026 seguem a régua antiga (só logins com senha) e por isso subestimam jul–ago/2026.

3. **Rateio entre programas**
   - Continua usando usuário-dias por programa (quem tem 2 programas conta 1 dia em cada, como já é hoje).
   - A exportação CSV de rateio permanece igual, apenas com a base corrigida.

## Detalhes técnicos

- `src/contexts/AuthContext.tsx`: remover o insert exclusivo do `login()` e registrar o acesso quando houver sessão válida na carga do app, com guarda `localStorage` por dia (chave com data em fuso de São Paulo).
- Banco: índice único em `user_access_log (user_id, date(accessed_at at time zone 'America/Sao_Paulo'))` + insert com `ON CONFLICT DO NOTHING` (via RPC `security definer` simples, para não vazar erro no cliente).
- `src/pages/admin/RelatorioAcessosPage.tsx`: renomear colunas/rótulos; as RPCs `get_dias_ativos_por_usuario`, `get_acessos_por_mes_programa` e `get_rateio_usuario_programa_mes` continuam válidas sem alteração.
- Sem retroatividade: o histórico de jul–ago/2026 não pode ser reconstruído; a série fica fiel a partir da implantação.
- Atualizar a memória do projeto com a nova regra de contagem.

## Ponto de decisão

Se preferir, dá para manter também a contagem antiga de "logins com senha" como coluna separada (auditoria), em vez de substituí-la.
