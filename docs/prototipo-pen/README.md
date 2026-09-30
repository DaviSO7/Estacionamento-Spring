# Protótipo visual no Pen

Oito telas editáveis: seis de acesso/operação e duas de apresentação, acompanhadas de direção visual, componentes, estados e storyboard. Os dados exibidos são exemplos. Este estudo não salva registros, não autentica contas e não possui navegação executável.

O documento nativo foi editado no Pen e salvo automaticamente em `C:/Users/davif/.pencil/documents/611116cf-ef11-4903-abd0-7fcfe774e6b4/pencil-new.pen`.

| Frame no Pen | Prévia |
| --- | --- |
| `00 • Direção e componentes` | [Cores e componentes](u9GT6.png) |
| `01 • Registros / Desktop` | [Painel](t4OIj.png) |
| `02 • Registrar entrada / Desktop` | [Formulário](tq7QC.png) |
| `03 • Acessar sistema / Desktop` | [Login](gHBGg.png) |
| `04 • Registros / Celular` | [Lista móvel](iikFf.png) |
| `05 • Registrar entrada / Celular` | [Entrada móvel](A5DwKE.png) |
| `06 • Criar conta / Desktop` | [Cadastro](J9miCy.png) |
| `07 • Estados e percurso` | [Vazio, erro, foco, envio e sucesso](iJhdC.png) |
| `08 • Landing page / Desktop` | [Landing completa](Hwf0j.png) |
| `09 • Landing page / Celular` | [Landing móvel](JhhuQ.png) |
| `10 • Landing / Storyboard Higgsfield e motion` | [Plano de animação](pRZEv.png) |

## Relação com as referências

- Interface móvel cinza: hierarquia compacta e ação principal facilmente localizável. A translucidez não foi adotada, pois a leitura dos registros é prioritária.
- Site de bicicletas: contraste editorial, tipografia expressiva e ritmo entre áreas claras e escuras. Não foram importadas fotos ou alegações comerciais.
- Dashboard escuro: divisórias finas, alinhamento de colunas e organização dos dados. Métricas e gráficos financeiros não se aplicam ao estacionamento.
- Vídeo: clareza dos blocos, continuidade visual e uso seletivo do azul. Foram examinados seis quadros distribuídos ao longo dos 47,5 segundos; a proposta de movimento está anotada, não animada.

Esses materiais são referências de interface. Não informam capacidade, vagas, acesso físico ou equipamentos da escola.

## Decisões do protótipo

Navegação grafite, superfície clara e azul para ações. Manrope para títulos e corpo; IBM Plex Mono para placas. A tabela do computador torna-se uma lista no celular. Nenhum indicador representa vagas livres ou ocupação atual.

Os campos e ações correspondem aos contratos existentes. O cadastro preserva CPF, telefone e nascimento porque são exigidos pelo backend atual; a necessidade de coletá-los continua pendente de validação. Estados por campo e feedback detalhado são propostas de UX, não recursos novos do Java.

Três componentes nativos reutilizáveis: botão primário, campo e mensagem de sucesso. Os onze frames entregues foram verificados por inspeção visual e consulta estrutural, sem cortes reportados. Java, banco e frontend de produção foram preservados.

## Landing e animação futura

A apresentação explica identificar o veículo, registrar a entrada e consultar o painel, usando os componentes do sistema. O conteúdo inclui abertura visual, fluxo em três etapas, demonstração de formulário, prévia de registros, dúvidas e acesso ao sistema. Os links e controles são representações visuais, sem execução neste protótipo.

O hero utiliza a imagem conceitual existente `hero-estacionamento.png`, identificada como provisória. Ela não comprova características físicas da escola. O documento Pen referencia essa imagem local; mantenha o arquivo disponível ao abrir o projeto. [Prévia da abertura](f5NCN.png).

- **H01 — Higgsfield:** produzir futuramente a cena de fundo a partir de uma imagem aprovada. Intenção de câmera: aproximação discreta de 6–8 segundos, desacelerando até parar, sem áudio ou loop automático. Preparar composição desktop e composição/recorte móvel, além dos posters. Modelo, duração suportada e parâmetros serão verificados quando a produção for solicitada.
- **H02 — Frontend:** apresentar formulário, confirmação e painel com transições curtas. Textos, números e controles permanecem elementos de interface, fora do vídeo gerado, para preservar legibilidade e edição.
- **H03 — Interações:** feedback de foco, hover e mudança de estado; proposta de 120–180 ms. Não animar métricas fictícias ou ocupação.

Estado inicial: poster. O controle ilustrado “Reproduzir cena” inicia a reprodução futura; prever pausar e repetir, sem reinício automático. A mídia deve parar fora da tela. Com movimento reduzido, manter imagem estática e conteúdo completo; sem mídia disponível, preservar o poster. A página precisa permitir acesso ao sistema sem depender de qualquer animação.

No celular, o texto aparece acima da cena para não disputar espaço com o assunto da imagem. Antes de integrar, validar cortes, contraste, peso, primeiro/último quadro e eventuais deformações. Nenhum vídeo foi gerado no Higgsfield nesta etapa.
