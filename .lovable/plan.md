# Reunião Mensal N1 (PRG Escolas) — Alargar eixo Y dos módulos 7 e 8

## Contexto
Nos gráficos 7 (Professores apoiados por escola) e 8 (Formações coletivas — participação do coordenador) de `src/pages/admin/ReuniaoMensalEscolasPage.tsx`, os nomes das escolas no eixo Y ficam apertados (largura fixa de 170px) e quebram em várias linhas, comprimindo e sobrepondo os rótulos (ex.: "ANTONIO CASTELAR DE FRANCESCHI PROFESSOR").

## Alteração
- Nos dois gráficos (linhas 358 e 364), aumentar a largura do `YAxis` de `width={170}` para `width={280}`, de modo que nomes de escolas longos caibam em até ~2 linhas sem sobreposição.
- Ajustar o `margin={{ left: 40 }}` do `BarChart` dos dois módulos conforme necessário para que a área do gráfico continue legível (o rótulo do eixo ganha mais espaço).
- Manter inalterados os demais módulos, cores, rótulos de dados e legendas.

## Verificação
- Typecheck do projeto.
- Conferência no preview: abrir `/reuniao-mensal-escolas`, checar módulos 7 e 8 com os mesmos filtros do print (nomes de escola sem quebra excessiva/sobreposição).
