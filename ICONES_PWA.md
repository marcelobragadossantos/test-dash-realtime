# Ícones para PWA

## Ícones Necessários

Você precisa adicionar 2 ícones no diretório `/public`:

1. **icon-192.png** - Ícone de 192x192 pixels
2. **icon-512.png** - Ícone de 512x512 pixels

## Como Criar os Ícones

### Opção 1: Usar ferramenta online (Recomendado)

1. Acesse: https://www.pwabuilder.com/imageGenerator
2. Faça upload da imagem que você forneceu (sales icon)
3. Baixe os ícones gerados
4. Copie `icon-192.png` e `icon-512.png` para `/public`

### Opção 2: Usar ImageMagick (linha de comando)

Se você tem o ImageMagick instalado:

```bash
# Converter para 192x192
convert sua-imagem.png -resize 192x192 public/icon-192.png

# Converter para 512x512
convert sua-imagem.png -resize 512x512 public/icon-512.png
```

### Opção 3: Usar ferramenta gráfica

Use qualquer editor de imagem (Photoshop, GIMP, Figma, etc.) para:

1. Redimensionar a imagem para 192x192 pixels → salvar como `icon-192.png`
2. Redimensionar a imagem para 512x512 pixels → salvar como `icon-512.png`
3. Copiar os arquivos para o diretório `/public`

## Cores

A imagem fornecida já está em vermelho, que é a cor principal do app. Perfeito! ✅

## Verificação

Após adicionar os ícones, verifique se eles estão no lugar certo:

```
/public
├── icon-192.png
├── icon-512.png
├── manifest.json
└── sw.js
```

## Testando o PWA

1. Faça o build: `npm run build`
2. Sirva o build: `npm run preview`
3. Abra no navegador
4. Você deverá ver um botão "Instalar app" ou similar
5. No mobile, abra o menu e escolha "Adicionar à tela inicial"

## Características do PWA

✅ **Instalável** - Pode ser instalado no desktop e mobile
✅ **Ícone personalizado** - Aparece com o ícone vermelho de vendas
✅ **Tema vermelho** - Cores atualizadas para vermelho (#dc2626)
✅ **Funciona offline** - Service Worker cacheia os assets
✅ **Splash screen** - No mobile, mostra tela de carregamento com o ícone
