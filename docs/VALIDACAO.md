# Como validar

## Executar a interface

A aplicação continua usando o Spring existente:

```powershell
.\mvnw.cmd spring-boot:run
```

Abra `http://localhost:8080/`. Node e bibliotecas de animação não são necessários para executar o site.

## Prévia isolada para testes

Os testes de operação criam dados. Use um banco H2 novo em memória, sem apontar para `database/appdb.mv.db`. Execute na raiz do projeto, com o JAR compilado pelo processo de build existente:

```powershell
java -jar target/estacionamento-0.0.1-SNAPSHOT.jar --server.port=8081 "--spring.datasource.url=jdbc:h2:mem:landing_preview;DB_CLOSE_DELAY=-1" --spring.jpa.hibernate.ddl-auto=create-drop --spring.h2.console.enabled=false --spring.thymeleaf.prefix=file:src/main/resources/templates/ --spring.thymeleaf.cache=false --spring.web.resources.static-locations=file:src/main/resources/static/
```

Templates e arquivos estáticos são lidos do código atual, sem recompilar Java para cada ajuste visual. Reinicie essa prévia antes de repetir o teste operacional, para verificar o painel inicialmente vazio.

## Verificações de navegador

Com Node, Playwright e Chrome disponíveis:

```powershell
$env:PARKING_URL = 'http://localhost:8081'
node scripts/validar-landing.cjs
node scripts/validar-interface.cjs
```

Se necessário, configure `PLAYWRIGHT_MODULE` com o caminho absoluto para o módulo Playwright. As dependências são somente ferramentas de desenvolvimento. FFmpeg não é mais necessário, pois o hero atual não usa vídeo.

`validar-landing.cjs` bloqueia qualquer requisição de escrita. Verifica:

- Larguras 320, 360, 390, 768, 1024 e 1440 px, sem overflow horizontal.
- Três efeitos tipográficos, texto acessível e reversão na rolagem.
- Contornos visíveis, suspensão fora da tela, pausa e fallback sem WebGL.
- Laptop e celular com três prévias; abas por clique e teclado.
- Parallax interpolado, profundidades distintas, reversão e fim dos ciclos de atualização.
- Movimento reduzido inicial e alteração da preferência durante o uso.
- Menu e FAQ pelo teclado; demonstração local, validação, escape e reset.
- Conteúdo disponível sem JavaScript e ausência de erros de navegador/recursos.

`validar-interface.cjs` usa um bloqueio de segurança no Windows: verifica o processo que escuta a porta e exige explicitamente `jdbc:h2:mem:` antes de enviar qualquer POST. Verifica cadastro, erro de acesso, login, painel vazio real, entrada, confirmação, escape do conteúdo, logout, validação inline/nativa, mostrar senha pelo teclado e formulários sem JavaScript. As cinco telas são verificadas nas mesmas quatro larguras.

Capturas e resultados ficam em `target/pixel-perfect/qa/landing/` e `target/pixel-perfect/qa/interface/`, ignorados pelo Git. As capturas completas da landing usam a pausa manual para manter todos os títulos legíveis no mesmo quadro.

## Revisão manual

1. Na abertura, alterne **Painel**, **Entrada** e **Remoção**; confira a mudança nos dois dispositivos, também usando as setas do teclado.
2. Role para baixo e para cima: fundo, laptop e celular têm profundidades diferentes e voltam à posição inicial. Confira também os títulos e a janela de demonstração.
3. Use **Pausar animações**, depois retome. Ative também reduzir movimento nas preferências do sistema.
4. Navegue por Tab, Enter e Escape; confirme foco visível, menu e campos.
5. Confira login, cadastro, entrada e registros em desktop e celular. O painel apresenta dados reais enviados pelo backend.

Os testes usam Chrome headless. Não foram realizados testes em aparelhos físicos ou Safari/iOS nem uma auditoria formal de WCAG/Lighthouse.

## Histórico da atualização visual anterior

As duas suítes de navegador passaram nas quatro larguras. As capturas desktop e mobile foram inspecionadas e os ajustes de espaçamento e quebra dos títulos foram corrigidos. A suíte de movimento detectou e cobriu uma falha na troca dinâmica para movimento reduzido: o estado da preferência agora é atualizado pelo evento, sem consultar `MediaQueryList.matches` a cada frame. O carro para imediatamente e os contornos suspendem o processamento.

Também passaram a sintaxe dos três arquivos JavaScript e dos dois scripts de QA, a formatação Prettier e a verificação de espaços do diff dos templates. Os 16 arquivos Java da aplicação conservaram seus hashes. Todos os POSTs de teste usaram somente o processo de prévia com H2 em memória confirmado pelo script; o banco persistido não foi usado.

## Testes Java existentes

`.\mvnw.cmd test` executa a suíte existente com `src/test/resources/application.properties` e H2 em memória. Ela cobre sessão, validação e fluxo do backend. A implementação de remoção adiciona sete testes e atualiza duas expectativas de texto da suíte anterior. O build atual passou com 12 testes; consulte [REMOCAO-VEICULOS.md](REMOCAO-VEICULOS.md) para executar a prévia isolada e revisar as alterações.

## Validação da remoção

O teste de interface também verifica conferência sem POST, cancelamento pelo botão e Escape, cancelamento ao ocultar a aba, envio único, atualização da lista e estado vazio, registro já removido e exclusão sem JavaScript. A suíte da landing inclui o novo efeito de perspectiva reversível e o CTA de acesso, com pausa e movimento reduzido.

## Validação dos dispositivos e do parallax — 30/09/2026

A suíte da landing passou em 320, 360, 390, 768, 1024 e 1440 px, sem requisições de escrita nem erros de navegador/recursos. Foram verificadas as três prévias nos dois dispositivos, foco das abas, setas/Home/End/Tab, interpolação do parallax, reversão, profundidades diferentes, suspensão fora da tela e ausência de ciclos contínuos após a rolagem estabilizar. Pausa manual, alteração dinâmica de movimento reduzido, ausência de WebGL e ausência de JavaScript também passaram.

As capturas de desktop e celular, incluindo entrada e remoção, foram inspecionadas. Sintaxe JavaScript e formatação dos arquivos alterados passaram. Os 16 arquivos Java conservaram os hashes registrados no começo desta etapa; o login foi conferido para garantir que o CSS específico dos dispositivos só seja carregado na landing. A prévia desta etapa está em `http://localhost:8082/`, com H2 em memória. Os testes Java e as operações de escrita não foram repetidos, pois esta etapa só altera a apresentação.
