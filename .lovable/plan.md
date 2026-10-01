# Painel do N4: só as próprias ações e "Canceladas: 0" no gráfico

## O que foi verificado
- **Visibilidade:** a Priscila Pedroso é N4.1 (CPed) do Programa Escolas e está vinculada a 4 escolas. Ela não vê todas as 1.075 ações do programa. O painel mostra as 147 ações dessas 4 escolas, inclusive as de outros consultores. Só 67 dessas ações são dela, ou seja, ela é a responsável ou quem cadastrou.
- **"Canceladas: 0":** não há erro de contagem. Ao passar o mouse, a caixa de detalhes lista as três séries, inclusive as que valem zero. No print, o tipo "Alterações de agenda da visita" não tem nenhuma ação cancelada.

## O que será feito
1. **Painel do N4.1 e do N4.2 com só as próprias ações:** todos os números e gráficos do painel (previstas, realizadas, canceladas, pendentes e indicadores) vão considerar apenas as ações em que a pessoa é a responsável ou que ela cadastrou. Os demais perfis continuam como estão.
2. **Caixa de detalhes sem linhas zeradas:** a caixa que aparece ao passar o mouse sobre os gráficos de Previstas x Realizadas deixará de mostrar séries com valor 0, como "Canceladas: 0".
3. **Teste:** vou abrir o painel no preview simulando o perfil N4.1 e conferir os números com a base de dados.

## Detalhes técnicos
- `AdminDashboard.tsx`: quando o perfil efetivo (`effectiveRole`, que respeita a simulação) for `n4_1_cped` ou `n4_2_gpi`, `programacoes` e `registros` serão filtrados por `aap_id === user.id || created_by === user.id`. Para isso, `created_by` entra no select das programações. As avaliações e presenças derivadas já seguem os registros filtrados.
- Tooltip dos gráficos "por Tipo" e "por Ator": `formatter` retorna `null` quando o valor é 0.
- O banco de dados e as permissões de acesso não mudam. As telas Registros e Programação continuam como estão; se o N4 também deve ver só as próprias ações nelas, isso será um ajuste separado.
