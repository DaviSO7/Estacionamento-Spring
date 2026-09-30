# Estacionamento · Gestão em movimento

Aplicação escolar em **Java 25, Spring Boot 4.1, Thymeleaf e H2**, com apresentação pública, cadastro, login e registro de veículos. A interface roda no próprio Spring; não precisa de Node, React, conta Higgsfield ou serviço externo para funcionar.

## Executar

Com JDK 25 ou superior instalado e `JAVA_HOME` configurado:

```powershell
.\mvnw.cmd spring-boot:run
```

Abra [localhost:8080](http://localhost:8080). No IntelliJ, também é possível executar `EstacionamentoApplication` diretamente.

Se o wrapper do Windows não encontrar o Maven, use uma instalação local (`mvn spring-boot:run`) ou o Maven configurado no IntelliJ. O ambiente de validação usou JDK 26 e Maven 3.9.16.

## Onde alterar

| O que você quer modificar                | Pasta / arquivo                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Regras do estacionamento                 | `src/main/java/br/gov/sp/etec/estacionamento/service/`                    |
| Rotas e dados enviados às telas          | `src/main/java/br/gov/sp/etec/estacionamento/controller/`                 |
| Dados persistidos no H2                  | `src/main/java/br/gov/sp/etec/estacionamento/entity/`                     |
| Acesso ao banco                          | `src/main/java/br/gov/sp/etec/estacionamento/repository/`                 |
| Objetos recebidos dos formulários        | `src/main/java/br/gov/sp/etec/estacionamento/model/`                      |
| Controle da sessão de login              | `src/main/java/br/gov/sp/etec/estacionamento/config/WebConfig.java`       |
| Conteúdo da apresentação                 | `src/main/resources/templates/index.html`                                 |
| Formulários e painel                     | `src/main/resources/templates/`                                           |
| Cabeçalho, marca e rodapé compartilhados | `src/main/resources/templates/fragments/layout.html`                      |
| Cores, botões e estilos compartilhados   | `src/main/resources/static/css/base.css`                                  |
| Aparência da apresentação                | `src/main/resources/static/css/landing.css`                               |
| Aparência de login, cadastro e painel    | `src/main/resources/static/css/system.css`                                |
| Demonstração local e navegação           | `src/main/resources/static/js/landing.js`                                 |
| Efeitos de texto e contornos             | `src/main/resources/static/js/pixel-effects.js` e `css/pixel-effects.css` |
| Mostrar senha e feedback de envio        | `src/main/resources/static/js/ui.js`                                      |
| Imagens otimizadas e ícone               | `src/main/resources/static/images/`                                       |
| Manrope, IBM Plex Mono e licenças        | `src/main/resources/static/fonts/`                                        |

O PNG original permanece em `hero-estacionamento.png`, na raiz. A imagem foi retirada da abertura, conforme solicitado, e substituída por contornos animados e prévias do sistema em um laptop e um celular.

A interface segue os quadros 00–10 do Pen: Manrope local, navegação em grafite, áreas claras e CTA azul. Login, cadastro, registros, entrada e estados também foram implementados em desktop e celular. Consulte [as instruções da interface](docs/LANDING.md) para o mapeamento dos componentes e das prévias Nexvyn, os arquivos e os recursos de acessibilidade.

## Funcionalidades disponíveis

- `/`: apresentação com fundo de contornos, laptop e celular com três prévias selecionáveis e parallax suave, três efeitos tipográficos ligados à rolagem, etapas, recursos, demonstração local, FAQ e CTA final. Há pausa manual e suporte a movimento reduzido. O vídeo Higgsfield não foi gerado; seu [prompt e histórico](docs/HERO-VIDEO.md) estão preservados.
- `/cadastro`: cadastro de usuário.
- `/login`: autenticação; e-mail desconhecido retorna uma mensagem, sem erro interno.
- `/painel`: listagem real dos veículos, acessível depois do login.
- `/veiculo/registrar-entrada`: placa, modelo, cor e observação; horário registrado pelo serviço Java.
- `/veiculo/{id}/remover`: conferência e remoção permanente, com confirmação cancelável e proteção de sessão.
- `/sair`: encerramento da sessão, via POST.

O painel lista todos os veículos cadastrados no estacionamento. A demonstração da landing altera somente o HTML no navegador, sem enviar requisições nem salvar dados, e usa o horário fictício **08:00**. As telas nos dispositivos usam dados de exemplo e não alteram o sistema. Reserva, pagamento, disponibilidade e registro de saída não foram simulados. O registro de saída permanece **indisponível** no backend atual. A remoção de veículos agora está disponível e altera apenas o registro selecionado; confira [o fluxo, as referências useLayouts e os testes](docs/REMOCAO-VEICULOS.md). Ela não registra um horário de saída.

## Testes e próximos passos

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```

Os testes usam H2 em memória, isolado do arquivo `database/appdb.mv.db`. Consulte [a arquitetura](docs/ARQUITETURA.md), [a validação](docs/VALIDACAO.md) e [a origem dos recursos visuais](docs/ASSETS.md).

O login continua com o mecanismo didático de comparação de senha do projeto original. Antes de uso público, a evolução necessária é Spring Security, hash de senha, proteção CSRF e autorização apropriada; o interceptor de sessão atual não substitui isso. O console H2 original também continua configurado para desenvolvimento.
