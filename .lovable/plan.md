# Reunião Mensal N1 (PRG Escolas) — cores, rótulos, filtros e PowerPoint

## 1. Cores dos gráficos iguais ao documento
Paleta tirada do PDF "Dados da Olhar Parceiro":
- Roxo (principal): Não observou, PEI, Apoios Presenciais, Com 2+ APs
- Verde-água: Observou prática 1, Com 1 AP
- Amarelo/âmbar: Sem informação, Parcial, Devolutivas Pedagógicas
- Azul-marinho: títulos/escala de apoio
- Cinza: Sem tipo
Aplicado a todos os gráficos da página e ao PDF exportado.

## 2. Rótulos maiores
- Números dentro/sobre as barras: de 10 para 14, em negrito.
- Nomes dos eixos: de 11 para 13.
- Legendas: 13.

## 3. Filtros Escola e Consultor(a)
- Rótulo acima do campo (não ao lado), campos ocupando toda a largura da coluna, alinhados com o filtro Mês — elimina o espaço vazio do print.

## 4. Botão "Exportar PowerPoint"
- Novo botão ao lado de "Exportar PDF".
- Gera um arquivo .pptx (16:9) com: slide de capa (título, mês e filtros) + um slide por módulo (1. Painel Geral … 9.), cada um com título, cards de números e o gráfico/tabela do módulo como imagem nítida.
- Mesma marca (Parceiros + Bússola, azul #1a3a5c no cabeçalho).
- Respeita os filtros selecionados; mostra progresso durante a geração.
- Os gráficos entram como imagem (não editáveis no PowerPoint); textos e números dos slides são editáveis.

## Detalhes técnicos
- `ReuniaoMensalEscolasPage.tsx`: substituir constante `C`/`PART_COLORS` pela nova paleta; `LabelList fontSize={14} fontWeight={700}`; `XAxis/YAxis fontSize={13}`; filtros em `grid grid-cols-3` com `Label` em cima e `SelectTrigger w-full`.
- Instalar `pptxgenjs`; capturar cada `data-pdf-section` com `html2canvas-pro` (já usado no PDF) e inserir via `addImage` em base64; download via blob.
