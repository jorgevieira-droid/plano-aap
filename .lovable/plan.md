

## Manual do Usuario -- Pagina com Exportacao PDF

### Resumo
Criar uma pagina "/manual" dentro da aplicacao que exibe o manual do usuario com descricoes ilustradas de cada modulo, com botao para exportar tudo em PDF. A pagina usara ilustracoes via icones (Lucide) e descricoes textuais detalhadas de cada tela/modulo, organizadas em secoes com layout A4-friendly.

### O que sera feito

**1. Nova pagina `src/pages/admin/ManualUsuarioPage.tsx`**

Pagina com todas as secoes do manual, cada uma contendo:
- Icone representativo do modulo
- Titulo do modulo
- Descricao detalhada de como usar
- Dicas e observacoes

Modulos documentados:
- Login e Autenticacao
- Dashboard (Painel Principal)
- Programacao (Calendario de Acoes)
- Registrar Acao (Formulario)
- Registros (Historico)
- Escolas / Regional / Rede
- Professores / Coordenadores
- AAPs / Formadores
- Evolucao do Professor
- Relatorios
- Lista de Presenca
- Historico de Presenca
- Usuarios (Gestao)
- Pendencias
- Perfil do Usuario

Botao "Exportar PDF" no topo que usa `html2canvas` + `jspdf` (ja instalados) para capturar o conteudo da pagina e gerar um PDF multi-pagina A4.

**2. Rota e menu**

- Adicionar rota `/manual` no `App.tsx`
- Adicionar item "Manual do Usuario" no menu lateral (Sidebar) para perfis admin e manager com icone `BookOpen` ou `HelpCircle`
- Adicionar `/manual` nas rotas permitidas de todos os tiers em `AppLayout.tsx`

### Detalhes tecnicos

- A pagina renderiza todo o conteudo do manual em um container com `ref`, que e capturado pelo `html2canvas` ao clicar "Exportar PDF"
- O PDF e gerado com `jspdf` adicionando cada "pagina" de canvas como imagem, respeitando proporcoes A4
- O conteudo usa estilos inline para garantir fidelidade na captura
- Cada secao do manual tera um card com borda, icone colorido, titulo e texto descritivo
- Cabecalho com logo "Parceiros da Educacao" e titulo "Manual do Usuario"
- Layout responsivo na tela, mas otimizado para A4 no PDF

