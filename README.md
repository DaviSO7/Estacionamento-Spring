# Estacionamento Escolar

Sistema web para organizar os registros de entrada de veículos em um estacionamento escolar. O projeto reúne cadastro de usuários, login, painel de registros, formulário de entrada e remoção de veículos.

A aplicação usa Java e Spring Boot no servidor, com páginas renderizadas pelo Thymeleaf. O banco H2 é configurado para persistir os dados localmente durante a execução. A interface está em português e se adapta a computadores e celulares.

## Funcionalidades

- **Apresentação do sistema:** landing page com explicação do fluxo, dúvidas frequentes e acesso ao sistema.
- **Cadastro e login:** criação de conta e autenticação por e-mail e senha.
- **Registro de entrada:** cadastro de placa, modelo, cor e observação; a data e a hora são registradas pelo servidor.
- **Painel:** consulta dos veículos registrados, com horário de entrada e observações.
- **Remoção:** tela de conferência e confirmação antes de excluir um veículo. A remoção é permanente e não registra uma saída.
- **Interface adaptável:** páginas de operação e apresentação para telas maiores e menores.
- **Prévia visual:** as telas de Painel, Entrada e Remoção mostradas no laptop e no celular da landing page são exemplos visuais; não alteram os dados da aplicação.

## Tecnologias

- Java 25
- Spring Boot 4.1
- Spring MVC
- Spring Data JPA
- Thymeleaf
- H2
- Maven Wrapper
- HTML, CSS e JavaScript

A interface não exige Node.js, React ou serviços externos para executar.

## Requisitos

- JDK 25 ou superior
- O Maven Wrapper incluído no repositório

## Executar localmente

No Windows, abra o PowerShell na pasta do projeto e execute:

```powershell
.\mvnw.cmd spring-boot:run
```

No macOS ou Linux:

```bash
./mvnw spring-boot:run
```

Depois, abra [http://localhost:8080](http://localhost:8080). Crie uma conta pela página de cadastro para acessar o painel.

Por padrão, o H2 persiste os dados em `database/appdb.mv.db`. O arquivo é local ao projeto; encerre a aplicação antes de fazer uma cópia manual do banco.

## Páginas e rotas

| Caminho | Função |
| --- | --- |
| `/` | Apresentação pública do sistema |
| `/cadastro` | Formulário de cadastro |
| `/login` | Acesso à conta |
| `/painel` | Lista de veículos registrados; requer login |
| `/veiculo/registrar-entrada` | Formulário para registrar uma entrada; requer login |
| `/veiculo/{id}/remover` | Conferência e confirmação da remoção; requer login |

Os formulários de cadastro, autenticação, entrada, remoção e saída da conta usam solicitações `POST`, de acordo com a operação.

## Estrutura do projeto

```text
src/main/
├── java/br/gov/sp/etec/estacionamento/
│   ├── config/        proteção das rotas de operação pela sessão
│   ├── controller/    páginas, formulários e rotas
│   ├── entity/        entidades persistidas
│   ├── model/         dados recebidos dos formulários
│   ├── repository/    acesso ao banco com Spring Data
│   └── service/       regras e operações do sistema
└── resources/
    ├── templates/     páginas Thymeleaf e fragmentos
    └── static/
        ├── css/       estilos da apresentação e do sistema
        ├── fonts/     fontes locais
        ├── images/    recursos gráficos
        └── js/        interações e animações
```

Os testes automatizados ficam em `src/test/`. Os scripts de verificação visual do navegador ficam em `scripts/`.

## Executar os testes

No Windows:

```powershell
.\mvnw.cmd test
```

No macOS ou Linux:

```bash
./mvnw test
```

A configuração de testes usa um banco H2 em memória. Ela não deve apontar para o arquivo local `database/appdb.mv.db`.

Há também verificações de interface com Chrome e Playwright. As instruções para executá-las com uma instância isolada da aplicação estão em [`docs/VALIDACAO.md`](docs/VALIDACAO.md).

## Limites atuais e segurança

Este projeto é destinado a desenvolvimento e demonstração escolar. Antes de usá-lo com dados reais ou disponibilizá-lo publicamente como serviço, é necessário revisar a segurança e a configuração do ambiente.

- As senhas ainda não são protegidas por um algoritmo de hash.
- A proteção das páginas de operação usa a sessão da aplicação; não há Spring Security nem controle de permissões por perfil.
- A proteção contra CSRF não está configurada globalmente para todos os formulários.
- O console do H2 está habilitado na configuração local.
- A remoção apaga o registro e não mantém histórico nem horário de saída.
- Não há registro de saída, cobrança, pagamento ou controle de vagas.
- A validação do CPF verifica o formato, mas não calcula os dígitos verificadores.
- Não há licença de distribuição definida neste repositório.

Use apenas dados fictícios durante testes. Não exponha o console do H2 nem utilize este modo de autenticação em produção.

## Próximas etapas possíveis

Estas ideias ainda não estão implementadas:

- Registrar a saída do veículo sem apagar seu histórico de entrada.
- Proteger as contas com hash de senha, Spring Security e proteção CSRF.
- Definir permissões para diferentes tipos de usuário.
- Adotar migrações versionadas para o esquema do banco.
- Adicionar políticas de cópia de segurança e configuração para implantação.

## Documentação

- [Arquitetura e guia para continuar o projeto](docs/ARQUITETURA.md)
- [Interface, prévias dos dispositivos e movimento](docs/LANDING.md)
- [Fluxo de remoção de veículos](docs/REMOCAO-VEICULOS.md)
- [Como validar a aplicação e a interface](docs/VALIDACAO.md)
- [Recursos visuais e suas origens](docs/ASSETS.md)
- [Histórico e prompt do vídeo conceitual](docs/HERO-VIDEO.md)
- [Imagens do protótipo no Pen](docs/prototipo-pen/README.md)
