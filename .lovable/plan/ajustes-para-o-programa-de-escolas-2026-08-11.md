# Ajustes para o Programa de Escolas

## 1. "Entidade" vira "Nome da Escola"

No formulário de cadastro/registro de ações, o rótulo do campo de entidade passa a ser **Nome da Escola** sempre que o programa selecionado for Escolas. Os demais contextos continuam como hoje: "Rede" (Visitas Técnicas – Microciclos), "Regional" (Formação em Regionais) e "Entidade" nos casos restantes. O texto do seletor vazio também acompanha ("Selecione a escola").

## 2. "Nome da Escola" como primeiro campo

Quando o programa for Escolas, o campo passa a ser o primeiro do formulário, acima de Título, Descrição, Tags, Data e horários. Nos demais programas a ordem atual é mantida.

## 3. Página de entrada de N2/N3 vinculados só a Escolas

Usuários N2 (Gestor do Programa) e N3 (Coordenador do Programa) cujo único programa é Escolas passam a entrar na plataforma em **Visualização de Apoio Presencial**. N1, e N2/N3 com mais de um programa, continuam entrando no Dashboard. A regra já existente para perfis operacionais/locais (entrada em "Adicionar Ação") não muda.

## Detalhes técnicos

- `src/pages/admin/ProgramacaoPage.tsx`: no bloco do seletor de entidade (por volta da linha 3858), calcular o rótulo considerando `formData.programa.includes('escolas')`; extrair esse bloco para uma variável/render function e posicioná-lo antes do bloco de Título quando o programa for Escolas, mantendo a posição atual nos demais casos.
- `src/components/layout/AppLayout.tsx` — `getDefaultRoute`: adicionar, antes do retorno padrão, o caso `tier === 'manager' && onlyEscolas` → `/visualizacao-apoio-presencial`. A rota já consta na lista permitida do tier `manager`, e o tier `manager` cobre exatamente `gestor` (N2) e `n3_coordenador_programa` (N3) — N1 é o tier `admin` e não é afetado.
