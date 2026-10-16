# Saída, retorno e permanência

Implementa os requisitos anotados em `PainelVeiculoController` na branch `feature_a`:
status estacionado/não estacionado, registrar saída e volta sem apagar o veículo,
tempo de permanência e correção do horário três horas adiantado.

## Comportamento

- A entrada cria um registro estacionado. Registros anteriores sem saída também são tratados como estacionados; isso não comprova presença física. Registre a saída dos que já deixaram o local.
- **Registrar saída** guarda o horário e mantém placa, modelo, cor, observações e entrada. A permanência encerrada fica estável.
- **Registrar retorno** reutiliza o cadastro e inicia uma nova permanência. O painel mostra a visita atual ou a última encerrada; não há histórico de todas as visitas.
- A permanência de veículos estacionados é recalculada ao carregar o painel, sem atualização automática. Durações maiores que um dia continuam em horas (ex.: `27 h 30 min`).
- **Remover** mantém a conferência existente e continua sendo uma exclusão definitiva.

## Horários e dados existentes

Um `Clock` com `America/Sao_Paulo` fornece os horários de entrada, saída e retorno, independentemente do fuso do sistema operacional, inclusive no Render em UTC. O cliente não define o horário efetivo.

As colunas opcionais `hora_saida` e `horario_brasilia` são adicionadas pelo `ddl-auto=update` já existente. Nenhuma tabela/coluna é removida. Os horários anteriores são `LocalDateTime`, sem fuso de origem: registros produzidos em UTC e registros locais são indistinguíveis. Não é seguro subtrair três horas de todos eles. A implementação preserva os valores antigos, identifica seu fuso como não informado e não calcula duração para essas visitas. A saída continua disponível; o retorno inicia uma visita marcada como Brasília e restabelece o cálculo. Uma correção em lote depende de identificar a origem desses registros. Para visitas novas, um horário futuro inconsistente é identificado e a saída é rejeitada.

Não há mudanças em Dockerfile, render.yaml, dependências, perfil Render, banco versionado ou estrutura de pastas da aplicação. Os arquivos H2 incidentais da `feature_a` ficam fora do PR.

## Integridade

As rotas `POST /veiculo/{id}/saida` e `POST /veiculo/{id}/retorno` exigem login e token de movimentação da sessão. GET não altera registros. O formulário envia a entrada da visita que estava visível; o serviço compara esse valor sob bloqueio de escrita na transação. Envios concorrentes/repetidos e formulários de visitas anteriores não mudam a nova visita. Redirecionamento com confirmação ou erro evita repetir a operação ao atualizar o painel.

## Validação

Os testes usam H2 em memória e incluem o ciclo entrada/saída/retorno, duração encerrada e superior a um dia, fuso do servidor em UTC, proteção de sessão/token, repetição, concorrência e continuidade da remoção. Um teste sobe a aplicação com o esquema antigo, permite a evolução pelo Hibernate e verifica preservação dos dados.

Executar: `.\mvnw.cmd test`. A prévia de interface deve usar somente banco H2 em memória, conforme `VALIDACAO.md`.

## Resultado em 16/10/2026

- Build Maven concluído com 24 testes, nenhuma falha ou erro, com a JVM de testes em UTC. Usado JDK 26 local compilando para Java 25; a imagem Docker existente continua Java 25. O agente Mockito foi informado pela linha de comando para evitar o autoattach bloqueado pelo ambiente, sem alterar o POM.
- Suíte de interface validou saída, retorno, remoção, ausência de duplicação, escape e formulários sem JavaScript em 360, 390, 768 e 1440 px, usando somente H2 em memória.
- Suíte da landing passou em 320, 360, 390, 768, 1024 e 1440 px, sem escritas nem erros de navegador. Capturas desktop/mobile foram inspecionadas.
- Revisão com GPT Astra em high em dois eixos: padrões sem achados; especificação apontou a duração imprecisa de entradas legadas. O problema foi corrigido com marcação explícita do fuso e testes; a segunda revisão não encontrou pendências.
