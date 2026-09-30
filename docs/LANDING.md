# Interface do estacionamento

A interface mantém o padrão do projeto: templates Thymeleaf, CSS e JavaScript nativos servidos pelo Spring. A atualização usa os quadros 00–10 do Pen, incluindo login, cadastro, registros, entrada, estados e versões de celular. A etapa visual original preservou o backend. A atualização seguinte adiciona a [remoção real de veículos](REMOCAO-VEICULOS.md), com novas rotas e alterações pontuais no serviço e repositório.

## Telas

- `/`: apresentação, três etapas, recursos, demonstração local, FAQ e acesso.
- `/login` e `/cadastro`: formulários claros com apresentação grafite, validação, mostrar senha e feedback de envio.
- `/painel`: sidebar no desktop, cabeçalho compacto no celular, lista real de registros, estado vazio e confirmação de entrada.
- `/veiculo/registrar-entrada`: formulário com orientação, validação e cancelamento.
- `/veiculo/{id}/remover`: conferência do registro e confirmação cancelável da remoção.
- `erro.html`: retorno de erro de acesso, com ação para tentar novamente.

Manrope é a fonte principal; placas usam IBM Plex Mono. Ambas são locais. A paleta mantém grafite, áreas claras e CTA azul. O painel recebe somente os registros enviados pelo backend; não há ocupação, disponibilidade nem métricas inventadas. A saída de veículos continua indisponível no backend existente.

## Dispositivos e parallax

O cartão do carro foi substituído por um laptop e um celular com molduras adaptadas dos componentes [Laptop Mockup](https://ui.nexvyn.dev/components/laptop-mockup) e [Phone Mockup](https://ui.nexvyn.dev/components/phone-mockup) da Nexvyn. As telas usam HTML real e mostram três prévias em português: **Painel**, **Entrada** e **Remoção**. Os dados são ilustrativos; trocar de prévia não envia formulários nem remove registros. As abas funcionam com clique, setas, Home, End e Tab. Um resumo acessível evita a leitura duplicada das duas telas decorativas.

O parallax preserva a rolagem nativa. Fundo, laptop e celular se deslocam em profundidades diferentes, com interpolação baseada no tempo; a janela de demonstração recebe um movimento menor. A geometria é medida em mudanças de layout, e a atualização escreve apenas transformações. O ciclo termina quando as camadas chegam ao destino e fica suspenso fora da tela, com a aba oculta, na pausa manual ou com movimento reduzido. Não há captura de roda do mouse ou gestos de toque.

O CTA recebeu um reflexo discreto inspirado no [Specular Button](https://reactbits.dev/components/specular-button), feito em CSS sem outro contexto WebGL. A legenda recebe uma passagem única de brilho inspirada no [Shimmer Text](https://kokonutui.com/docs/texts/shimmer-text). Option Wheel, Type Writer e Marquee foram consultados, mas não adicionados para evitar controles concorrentes e movimento contínuo. Não foram adicionados React, Tailwind ou dependências de execução.

Arquivos específicos: `static/css/hero-devices.css` e `static/js/landing-motion.js`. A carga do CSS é limitada à landing. O backend e as operações reais permanecem iguais nesta etapa.

## Componentes Pixel Perfect preservados

Os componentes foram adaptados para HTML/CSS/JavaScript, preservando o projeto Thymeleaf. Os comandos `shadcn add` fornecidos apontam para componentes React; instalar uma segunda aplicação React não era necessário. Nenhum runtime React, GSAP ou Framer Motion foi adicionado.

| Componente pedido                    | Aplicação                                                              |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `text-scroll-fx2` — Stretch Rise     | Título das etapas, com subida e escala de caracteres ligadas ao scroll |
| `text-scroll-fx6` — Flip Up 3D       | Título da demonstração, com rotação dos caracteres                     |
| `text-scroll-fx16` — Tilt & Brighten | CTA final, com inclinação discreta e opacidade por palavra             |
| `contour-map-background`             | Fundo de contornos animados no hero                                    |
| `car-lock-drive-motion`              | Retirado nesta atualização, substituído pelos dispositivos Nexvyn      |

Na consulta feita nesta implementação, os três URLs `text-scroll-fx*.json` retornaram HTTP 404. Os efeitos correspondentes foram recuperados no [código oficial de tipografia](https://github.com/vansh-nagar/Pixel-Perfect/blob/main/registry/new-york/text/scroll-typography/effects.ts). Os registros de [contornos](https://www.pixel-perfect.space/r/contour-map-background.json) e [carro](https://www.pixel-perfect.space/r/car-lock-drive-motion.json) estavam disponíveis. A origem está também indicada no cabeçalho de `pixel-effects.js`.

Os títulos continuam como texto real: uma cópia completa acessível acompanha os caracteres visuais, ocultos de leitores de tela. Os três efeitos avançam e retrocedem com a rolagem. A amplitude foi ajustada para legibilidade.

O fundo usa o shader de contornos com limite de 30 desenhos por segundo e densidade máxima de 1,5. Ele para fora da tela, com aba oculta, pausa manual ou movimento reduzido. Sem WebGL, um fundo CSS estático mantém a composição. Os títulos só solicitam atualização quando há rolagem, redimensionamento ou mudança de preferência.

O botão **Pausar animações** interrompe o movimento decorativo e revela os textos. `prefers-reduced-motion` mantém a página estática, inclusive quando a preferência muda com a página aberta. Sem JavaScript, os textos, links, FAQ e formulários do sistema continuam disponíveis; somente as demonstrações interativas ficam desativadas.

## Demonstração e mídia

O formulário de demonstração altera apenas uma linha da tabela no navegador, sem API, POST ou armazenamento. Placas, veículos e o horário fixo 08:00 são exemplos identificados. Os valores usam `textContent`; reiniciar ou recarregar restaura a prévia.

A imagem conceitual foi retirada da abertura conforme autorizado no pedido seguinte e substituída pelos contornos e, nesta atualização, pelas prévias nos dispositivos. Seus arquivos originais foram preservados. Não há vídeo ativo nem download de MP4. O Higgsfield não gerou vídeo na verificação anterior por saldo insuficiente; o prompt e o histórico permanecem em [HERO-VIDEO.md](HERO-VIDEO.md).

## Arquivos

- `templates/index.html`, `static/css/landing.css`, `static/js/landing.js`: apresentação, navegação e demonstração local.
- `static/css/pixel-effects.css`, `static/js/pixel-effects.js`: tipografia, contornos e controle de movimento.
- `templates/login.html`, `cadastro.html`, `painel.html`, `registrar-entrada.html`, `erro.html`: telas operacionais.
- `templates/fragments/layout.html`, `static/css/base.css`, `static/css/system.css`, `static/js/ui.js`: estrutura compartilhada, aparência e interações dos formulários.
- `static/fonts/`: fontes e respectivas licenças.
- `scripts/validar-landing.cjs`, `scripts/validar-interface.cjs`: verificações de navegador.

Os caminhos acima são relativos a `src/main/resources/`, exceto `scripts/`. Consulte [VALIDACAO.md](VALIDACAO.md) para executar e testar, e [ASSETS.md](ASSETS.md) para a origem dos recursos.
