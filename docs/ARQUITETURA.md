# Guia para continuar o projeto na escola

## Separação das responsabilidades

```text
src/main/
├── java/br/gov/sp/etec/estacionamento/
│   ├── config/        proteção das rotas de operação pela sessão
│   ├── controller/    URLs, formulários, redirecionamentos e modelos das telas
│   ├── service/       regras de negócio e conversão entre model/entity
│   ├── repository/    consultas ao H2 com Spring Data
│   ├── entity/        entidades persistidas
│   └── model/         dados recebidos dos formulários
└── resources/
    ├── templates/    HTML renderizado pelo Thymeleaf
    │   └── fragments/ componentes compartilhados
    └── static/
        ├── css/       base, apresentação e sistema
        ├── js/        movimento e interação dos formulários
        └── images/    arquivos locais usados pelo navegador
```

Fluxo de uma entrada: formulário → `PainelVeiculoController` → `VeiculoService` → `VeiculoRepository` → H2. Depois de salvar, o controller redireciona para `/painel`, que carrega a listagem do serviço. Atualizar a página do painel não repete o POST.

`HomeController` cuida apenas da apresentação pública. `PainelController` carrega o painel. Assim, mudanças nas regras Java não dependem do código das animações. Os nomes dos campos existentes nos formulários foram preservados.

## Ajustes Java feitos para a interface funcionar

- Nova rota pública `/`; login explicitamente em `/login`.
- Nova rota `/painel`, antes referenciada por links sem implementação.
- Listagem usa o método `listarVeiculos()` que já existia.
- Sessão após autenticar, renovação do identificador da sessão e logout via POST.
- `/painel` e `/veiculo/**` verificam a sessão por um interceptor.
- Consulta de usuário inexistente retorna `null`, evitando `NullPointerException`.
- CPF e telefone passaram de `Integer` para `String`: CPF tem 11 dígitos, pode começar com zero e não é uma quantidade numérica; telefone brasileiro também ultrapassa o limite de `Integer`.
- Validação básica no servidor, identificação de e-mail já cadastrado e mensagens de retorno.
- Removido o log do objeto de cadastro e a senha de `toString()`.

## Banco existente e evolução do esquema

A configuração original `ddl-auto=update` permanece. O Hibernate converte as colunas de CPF e telefone para texto ao executar com o esquema antigo. Os testes automatizados e a prévia usam banco em memória; a verificação específica do esquema usou cópias em `target/migration-check/`. Ao final do trabalho, o arquivo H2 local também foi observado com as duas colunas em texto e seus quatro usuários e quatro veículos presentes. O estado atual foi mantido, sem restaurar versões antigas do banco. Faça uma cópia do banco com a aplicação desligada antes de futuras mudanças de esquema. Zeros que já tenham sido perdidos quando um dado era `Integer` não podem ser recuperados automaticamente.

Para evoluir além do exercício, adote migrações versionadas. A validação de CPF atual verifica o formato de 11 dígitos, não o cálculo dos dígitos verificadores. A verificação de e-mail duplicado é didática; uma restrição única no banco deve ser considerada junto da migração de dados e do tratamento de concorrência.

## Próxima implementação: saída

1. Adicionar horário de saída e, se necessário, estado do registro em `VeiculoEntity`.
2. Definir a regra na interface `VeiculoService` e implementá-la em `VeiculoServiceImpl`.
3. Criar a rota de formulário e a operação POST no controller.
4. Criar o template reutilizando `base.css`, `system.css` e os fragmentos.
5. Substituir a indicação “Em desenvolvimento” do painel pelo link real.
6. Cobrir o fluxo em testes, incluindo tentativa de registrar duas saídas.

Tarifas e pagamentos só devem aparecer na interface quando suas regras forem realmente implementadas.

## Movimento e acessibilidade

A narrativa usa SVG editável, `position: sticky`, `requestAnimationFrame` acionado por eventos e `IntersectionObserver`. Não há biblioteca de animação, engine 3D, vídeo automático ou loop contínuo. A posição do carro é calculada pelo progresso da rolagem e volta pelo mesmo caminho.

O pin só é habilitado com largura de pelo menos 1000 px e altura de pelo menos 720 px. Em telas menores, as etapas aparecem em fluxo normal. `prefers-reduced-motion` remove pin, parallax e revelações; o conteúdo continua completo. Sem JavaScript, links e formulários continuam funcionando e todos os textos permanecem visíveis.

As fontes são locais do sistema (Arial/Helvetica e Georgia), evitando solicitações externas. Os formulários têm labels, autocomplete e estados de foco; tabelas permitem rolagem horizontal dentro de uma região acessível.
