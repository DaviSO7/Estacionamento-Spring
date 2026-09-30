# Recursos visuais

## Referências e composição atual

Os quadros 00–10 do Pen orientam as telas: Manrope, navegação grafite, fundos claros, CTA azul, campos legíveis e registros responsivos. As referências externas foram usadas como linguagem visual, sem incorporar marcas ou textos de outros produtos.

O hero atual usa contornos e dispositivos desenhados em HTML/CSS a partir das molduras da Nexvyn, com telas ilustrativas do próprio sistema. Os efeitos foram adaptados do [Pixel Perfect](https://github.com/vansh-nagar/Pixel-Perfect); o mapeamento e as fontes estão em [LANDING.md](LANDING.md). Todos os títulos, números, formulários, estados e tabelas continuam em HTML real.

`hero-estacionamento.png` é a arte conceitual fornecida pelo usuário, preservada intacta na raiz. Ela e as cópias WebP não são mais exibidas no hero. Não representam fotografia da escola nem prova de infraestrutura. O vídeo Higgsfield não foi gerado; [HERO-VIDEO.md](HERO-VIDEO.md) conserva o prompt e a consulta anterior.

## Recursos locais

| Arquivo                                                        | Uso                                           |
| -------------------------------------------------------------- | --------------------------------------------- |
| `hero-estacionamento.png`                                      | Original conceitual preservado, sem uso ativo |
| `static/images/hero-estacionamento.webp`                       | Cópia 2048 × 1152 preservada, sem uso ativo   |
| `static/images/hero-estacionamento-mobile.webp`                | Cópia 960 × 540 preservada, sem uso ativo     |
| `static/images/favicon.svg`                                    | Ícone local                                   |
| HTML em `templates/index.html` e `static/css/hero-devices.css` | Laptop e celular, com telas reais em HTML     |
| `static/fonts/manrope-latin.woff2`                             | Fonte variável principal                      |
| `static/fonts/ibm-plex-mono-400.woff2`                         | Placas e identificação, peso regular          |
| `static/fonts/ibm-plex-mono-500.woff2`                         | Placas e identificação, peso médio            |
| `static/fonts/ibm-plex-mono-600.woff2`                         | Placas e identificação, peso semibold         |
| `static/fonts/OFL-Manrope.txt` e `OFL-IBMPlexMono.txt`         | Licenças SIL Open Font License                |

`static/` e `templates/` são relativos a `src/main/resources/`. As fontes foram obtidas da distribuição oficial do Google Fonts e são servidas localmente; a interface não solicita fontes, fotos ou componentes a terceiros durante o uso.
