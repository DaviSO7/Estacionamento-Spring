# Remoção de veículos e componentes useLayouts

## O que foi analisado

O remoto [DaviSO7/Estacionamento-Spring](https://github.com/DaviSO7/Estacionamento-Spring) foi consultado na revisão `60d9357ea7bdf2803b18d107e45d8c14ccc859cc`. O serviço já tinha `excluirVeiculo(Long id)`, mas não havia um fluxo de confirmação e exclusão no controlador. A tela `registrar-saida.html` apenas selecionava/exibia o veículo; não registrava horário de saída nem excluía dados.

A implementação foi integrada ao checkout local, preservando a interface e as alterações anteriores. Não foi feito pull sobre os arquivos modificados, nem commit/push para o GitHub.

## Como usar

1. Entre no sistema e abra **Registros**.
2. Escolha **Remover** na linha ou no cartão da placa.
3. Confira placa, modelo, cor, entrada e observações.
4. Escolha **Manter veículo** para voltar sem alterar nada, ou **Confirmar remoção**.
5. Com JavaScript ativo, o botão muda para **Cancelar remoção** durante 5 segundos. Clique nele ou pressione Escape para cancelar. Trocar de aba ou sair da página também cancela antes do envio.
6. Depois do POST, o servidor redireciona ao painel e informa o resultado. A contagem e o estado vazio refletem os dados do banco.

Sem JavaScript, a tela de conferência permanece disponível e o botão envia a confirmação imediatamente. Não há exclusão por GET. A remoção é permanente; não representa registro de saída nem preserva histórico do veículo removido. Nenhuma alteração de esquema de banco é necessária.

## Implementação

- `GET /veiculo/{id}/remover`: busca o registro e apresenta a conferência, sem alterar dados.
- `POST /veiculo/{id}/remover`: exige login e `_remocaoToken` válido, vinculado à sessão. O token protege esta operação contra envio externo sem confirmação de sessão; não substitui proteção global para os demais formulários do projeto.
- O serviço usa DELETE transacional por ID e verifica a quantidade de linhas removidas. Registros com a mesma placa continuam independentes. Em solicitações repetidas ou concorrentes, somente a primeira exclusão efetiva indica sucesso.
- ID ausente/inexistente, token inválido e falha de persistência têm retorno compreensível em português. Valores de tela usam escape do Thymeleaf.
- Todos os usuários já autorizados a operar o painel geral podem remover; não foi inventado um perfil de administrador.

## Referências aplicadas

| Referência                                                                                | Adaptação                                                                                                                    |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [Delete Button](https://uselayouts.com/docs/components/delete-button)                     | Botão de confirmação que muda para cancelar, com contagem e envio real ao final; o cancelamento acontece antes de excluir.   |
| [Get in Touch](https://uselayouts.com/docs/components/get-in-touch)                       | CTA final de acesso com transição em hover/foco, rótulos Acessar sistema, Você e Vamos começar; mantém a rota real de login. |
| [Perspective Text Scroll](https://uselayouts.com/docs/components/perspective-text-scroll) | Perspectiva ligada à rolagem no título de recursos, com deslocamento discreto e sem esconder conteúdo.                       |

Foram lidos os códigos publicados nas páginas oficiais. As adaptações usam CSS e JavaScript nativos para manter Thymeleaf e as fontes locais. Não adicionam React, Motion, Tailwind, fotos de terceiros ou um formulário de contato sem destino. O texto visível e acessível é português. Pausa global e movimento reduzido continuam funcionando; a contagem de confirmação permanece utilizável sem efeitos visuais.

## Arquivos principais

- `src/main/java/br/gov/sp/etec/estacionamento/controller/PainelVeiculoController.java`
- `src/main/java/br/gov/sp/etec/estacionamento/service/VeiculoService.java` e `VeiculoServiceImpl.java`
- `src/main/java/br/gov/sp/etec/estacionamento/repository/VeiculoRepository.java`
- `src/main/resources/templates/painel.html`, `remover-veiculo.html` e `index.html`
- `src/main/resources/static/js/remover-veiculo.js` e `layouts-effects.js`
- `src/main/resources/static/css/system.css` e `landing.css`
- `src/test/java/br/gov/sp/etec/estacionamento/RemocaoVeiculoTests.java`
- `src/test/java/br/gov/sp/etec/estacionamento/FluxoEstacionamentoTests.java`: duas expectativas de texto atualizadas para a interface existente.
- `scripts/validar-interface.cjs` e `scripts/validar-landing.cjs`

## Validação

A compilação e os 12 testes Java passaram com H2 em memória. Sete testes novos cobrem conferência sem exclusão, autenticação, tokens, ID inexistente, remoção por ID mesmo com placa repetida, estado vazio e concorrência.

Os testes de navegador são descritos em [VALIDACAO.md](VALIDACAO.md). Para esta entrega, a prévia usa a porta 8082 e `jdbc:h2:mem:removal_preview`. O teste operacional verifica essa condição no processo antes de enviar POSTs. Não execute testes de exclusão contra o banco persistido.

```powershell
java -jar target/estacionamento-0.0.1-SNAPSHOT.jar --server.port=8082 "--spring.datasource.url=jdbc:h2:mem:removal_preview;DB_CLOSE_DELAY=-1" --spring.jpa.hibernate.ddl-auto=create-drop --spring.h2.console.enabled=false --spring.thymeleaf.prefix=file:src/main/resources/templates/ --spring.thymeleaf.cache=false --spring.web.resources.static-locations=file:src/main/resources/static/
```

Em outro terminal, com Playwright e Chrome disponíveis:

```powershell
$env:PARKING_URL = 'http://localhost:8082'
node scripts/validar-interface.cjs
node scripts/validar-landing.cjs
```

As capturas ficam em `target/pixel-perfect/qa/`. A suíte de interface exige que não haja veículos no início; reinicie a prévia em memória se precisar repetir após uma execução interrompida antes da exclusão.

Resultado no navegador: as duas suítes passaram em 360, 390, 768 e 1440 px. O painel usa cartões até 1100 px para manter observações e ação de remoção legíveis junto à navegação lateral. As capturas de conferência, contagem, sucesso e registro inexistente foram revisadas. Os testes confirmaram cancelamento sem POST, envio único, lista vazia após exclusão e remoção sem JavaScript. Também passaram os efeitos reversíveis, pausa, movimento reduzido, sintaxe JavaScript e formatação.
