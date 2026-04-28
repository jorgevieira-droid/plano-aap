## Adicionar ícone "Olhar Parceiro" para tela inicial (mobile)

Vou usar a imagem `ICONE_OLHAR.png` que você enviou para configurar o ícone que aparecerá quando o app for adicionado à tela inicial em iOS e Android.

### Etapas

1. **Copiar a imagem** para `public/` e gerar variantes nos tamanhos exigidos:
   - `apple-touch-icon.png` (180x180) — iOS
   - `icon-192.png` (192x192) — Android
   - `icon-512.png` (512x512) — Android (alta densidade)
   - Atualizar também `public/favicon.png` com a mesma arte

2. **Criar `public/manifest.webmanifest`** com:
   - `name` / `short_name`: "Olhar Parceiro"
   - `display`: `"standalone"` (abre como app, sem barra do navegador)
   - `theme_color` / `background_color`: branco (`#ffffff`) para combinar com o fundo da logo
   - Referências aos ícones 192 e 512

3. **Atualizar `index.html`** adicionando no `<head>`:
   - `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
   - `<link rel="manifest" href="/manifest.webmanifest">`
   - `<meta name="apple-mobile-web-app-title" content="Olhar Parceiro">`
   - `<meta name="apple-mobile-web-app-capable" content="yes">`
   - `<meta name="theme-color" content="#ffffff">`

### Observações importantes

- **Sem PWA / service worker.** Apenas manifest + ícones para tornar o app "instalável" — sem cache offline. Isso evita problemas conhecidos do service worker no preview do Lovable.
- **Só funciona após publicar.** Para testar: abra a URL publicada no Safari (iOS) ou Chrome (Android) → menu → "Adicionar à tela inicial". O ícone customizado aparecerá no lugar do screenshot genérico.
- **iOS aplica fundo branco** automaticamente em PNGs com transparência — como sua imagem já tem o fundo transparente e o ícone tem boas cores sobre branco, o resultado deve ficar consistente.
- **Cache do navegador:** se você já tinha adicionado o app à tela inicial antes, talvez precise remover e adicionar de novo para ver o novo ícone.
