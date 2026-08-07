# Corrigir a miniatura ao compartilhar o link

Hoje, ao colar https://acompanhamento-aaps.org em WhatsApp, LinkedIn ou Slack, aparece a imagem padrão do Lovable. Isso acontece porque o `index.html` aponta `og:image` e `twitter:image` para uma imagem hospedada no lovable.dev.

## O que será feito

1. Criar uma imagem de compartilhamento (1200x630) com a identidade da plataforma — fundo azul institucional, logos Bússola + Parceiros da Educação e o nome "Olhar Parceiro — Plataforma de Acompanhamento Pedagógico" — salva em `public/og-image.png`.
2. Trocar `og:image` e `twitter:image` no `index.html` para a URL absoluta `https://acompanhamento-aaps.org/og-image.png`.
3. Adicionar `og:url`, `og:site_name`, `og:image:width/height` e `twitter:title`/`twitter:description` para o preview ficar completo.
4. Remover a referência `twitter:site` ao @Lovable e o `meta author` "Lovable".

## Detalhes técnicos

- Alterações apenas em `index.html` (head estático) e um novo arquivo em `public/`.
- Após publicar, redes sociais mantêm cache do preview antigo por algum tempo; o link só mostra a nova imagem depois que a plataforma reprocessa, ou forçando atualização no depurador de links (ex.: Facebook Sharing Debugger / LinkedIn Post Inspector).

## Observação

Não é possível usar literalmente um "print da tela de login" gerado automaticamente pelo crawler — a miniatura precisa ser um arquivo de imagem fixo. A arte proposta reproduz o visual da tela de login (logos e cores institucionais).
