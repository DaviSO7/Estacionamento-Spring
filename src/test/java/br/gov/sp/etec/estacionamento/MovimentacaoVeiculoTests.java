package br.gov.sp.etec.estacionamento;

import br.gov.sp.etec.estacionamento.entity.VeiculoEntity;
import br.gov.sp.etec.estacionamento.repository.VeiculoRepository;
import br.gov.sp.etec.estacionamento.service.VeiculoService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import br.gov.sp.etec.estacionamento.config.RelogioConfig;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class MovimentacaoVeiculoTests {
    @Autowired MockMvc mvc;
    @Autowired VeiculoRepository repository;
    @Autowired VeiculoService service;
    @Autowired RelogioTeste relogio;
    MockHttpSession session;
    VeiculoEntity alvo;

    static class RelogioTeste extends Clock {
        Instant instante = Instant.parse("2026-10-16T15:00:00Z");
        @Override public ZoneId getZone() { return ZoneId.of("America/Sao_Paulo"); }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(instante, zone); }
        @Override public Instant instant() { return instante; }
    }

    @TestConfiguration
    static class Config {
        @Bean @Primary RelogioTeste relogioTeste() { return new RelogioTeste(); }
    }

    @BeforeEach
    void preparar() throws Exception {
        repository.deleteAll();
        relogio.instante = Instant.parse("2026-10-16T15:00:00Z");
        session = new MockHttpSession();
        session.setAttribute("usuarioLogado", "operacao@example.com");
        mvc.perform(post("/veiculo/cadastrar").session(session)
                .param("placa", "ABC1D23").param("modelo", "Civic").param("cor", "Prata"))
                .andExpect(redirectedUrl("/painel"));
        alvo = repository.findAll().getFirst();
        mvc.perform(get("/painel").session(session)).andExpect(status().isOk());
    }

    private String rota(String acao) { return "/veiculo/" + alvo.getId() + "/" + acao; }

    private void enviar(String acao, LocalDateTime entrada, String resultado) throws Exception {
        mvc.perform(post(rota(acao)).session(session)
                .param("_movimentacaoToken", (String) session.getAttribute("tokenMovimentacaoVeiculo"))
                .param("entradaEsperada", entrada.toString()))
                .andExpect(redirectedUrl("/painel")).andExpect(flash().attributeExists(resultado));
    }

    @Test
    void registraSaidaSemExcluirEConservaPermanenciaEncerrada() throws Exception {
        relogio.instante = relogio.instante.plusSeconds(7260);
        enviar("saida", alvo.getHoraEntrada(), "sucesso");
        var salvo = repository.findById(alvo.getId()).orElseThrow();
        assertFalse(salvo.isEstacionado());
        assertEquals(LocalDateTime.of(2026, 10, 16, 14, 1), salvo.getHoraSaida());
        assertEquals(alvo.getHoraEntrada(), salvo.getHoraEntrada());
        relogio.instante = relogio.instante.plusSeconds(3600);
        mvc.perform(get("/painel").session(session))
                .andExpect(content().string(containsString("Não estacionado")))
                .andExpect(content().string(containsString("2 h 1 min")))
                .andExpect(content().string(containsString("Registrar retorno")))
                .andExpect(content().string(containsString("16/10/2026 14:01")));
        assertEquals(1, repository.count());
    }

    @Test
    void retornoReiniciaPermanenciaSemDuplicarCadastroERejeitaFormularioAntigo() throws Exception {
        enviar("saida", alvo.getHoraEntrada(), "sucesso");
        relogio.instante = relogio.instante.plusSeconds(3600);
        enviar("retorno", alvo.getHoraEntrada(), "sucesso");
        var salvo = repository.findById(alvo.getId()).orElseThrow();
        assertTrue(salvo.isEstacionado());
        assertNull(salvo.getHoraSaida());
        assertNotEquals(alvo.getHoraEntrada(), salvo.getHoraEntrada());
        enviar("saida", alvo.getHoraEntrada(), "erroMovimentacao");
        enviar("retorno", alvo.getHoraEntrada(), "erroMovimentacao");
        relogio.instante = relogio.instante.plusSeconds(600);
        assertEquals("0 h 10 min", service.listarVeiculos().getFirst().getTempoPermanencia());
        assertEquals(1, repository.count());
    }

    @Test
    void rejeitaTransicoesRepetidasEMantemRemocaoDefinitiva() throws Exception {
        enviar("retorno", alvo.getHoraEntrada(), "erroMovimentacao");
        enviar("saida", alvo.getHoraEntrada(), "sucesso");
        enviar("saida", alvo.getHoraEntrada(), "erroMovimentacao");
        assertTrue(service.excluirVeiculo(alvo.getId()));
        enviar("retorno", alvo.getHoraEntrada(), "erroMovimentacao");
        assertEquals(0, repository.count());
    }

    @Test
    void exigeLoginTokenDaSessaoEPost() throws Exception {
        for (String acao : new String[]{"saida", "retorno"}) {
            mvc.perform(post(rota(acao))).andExpect(redirectedUrl("/login"));
            mvc.perform(get(rota(acao)).session(session)).andExpect(status().isMethodNotAllowed());
            mvc.perform(post(rota(acao)).session(session))
                    .andExpect(flash().attributeExists("erroMovimentacao"));
            mvc.perform(post(rota(acao)).session(session).param("_movimentacaoToken", "invalido"))
                    .andExpect(flash().attributeExists("erroMovimentacao"));
            var outra = new MockHttpSession();
            outra.setAttribute("usuarioLogado", "outra@example.com");
            mvc.perform(post(rota(acao)).session(outra).param("_movimentacaoToken",
                    (String) session.getAttribute("tokenMovimentacaoVeiculo")))
                    .andExpect(flash().attributeExists("erroMovimentacao"));
        }
        assertTrue(repository.findById(alvo.getId()).orElseThrow().isEstacionado());
    }

    @Test
    void usaBrasiliaMesmoComServidorEmUtcEIgnoraHorarioEnviadoPeloCliente() throws Exception {
        assertEquals(ZoneId.of("America/Sao_Paulo"), new RelogioConfig().relogioEstacionamento().getZone());
        mvc.perform(post("/veiculo/cadastrar").session(session)
                .param("placa", "XYZ9A00").param("modelo", "Teste").param("cor", "Azul")
                .param("horaEntrada", "2099-01-01T00:00"))
                .andExpect(redirectedUrl("/painel"));
        assertTrue(repository.findAll().stream().allMatch(v ->
                v.getHoraEntrada().equals(LocalDateTime.of(2026, 10, 16, 12, 0))));
    }

    @Test
    void entradaLegadaNaoInventaDuracaoESaidaERetornoRestabelecemFuso() throws Exception {
        alvo.setHorarioBrasilia(null);
        alvo.setHoraEntrada(LocalDateTime.of(2026, 10, 16, 15, 0));
        repository.save(alvo);
        mvc.perform(get("/painel").session(session))
                .andExpect(content().string(containsString("Entrada antiga: fuso não informado")))
                .andExpect(content().string(containsString("Fuso da entrada não informado")));
        enviar("saida", alvo.getHoraEntrada(), "sucesso");
        assertEquals("Fuso da entrada não informado", service.listarVeiculos().getFirst().getTempoPermanencia());
        enviar("retorno", alvo.getHoraEntrada(), "sucesso");
        assertTrue(repository.findById(alvo.getId()).orElseThrow().isHorarioBrasilia());
        assertEquals("0 h 0 min", service.listarVeiculos().getFirst().getTempoPermanencia());
    }

    @Test
    void retornoNoMesmoMicrossegundoInvalidaFormularioAnterior() throws Exception {
        enviar("saida", alvo.getHoraEntrada(), "sucesso");
        enviar("retorno", alvo.getHoraEntrada(), "sucesso");
        var salvo = repository.findById(alvo.getId()).orElseThrow();
        assertEquals(alvo.getHoraEntrada().plusNanos(1000), salvo.getHoraEntrada());
        enviar("saida", alvo.getHoraEntrada(), "erroMovimentacao");
    }

    @Test
    void doisRetornosConcorrentesGeramSomenteUmSucesso() throws Exception {
        enviar("saida", alvo.getHoraEntrada(), "sucesso");
        relogio.instante = relogio.instante.plusSeconds(3600);
        var inicio = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var primeira = executor.submit(() -> { inicio.await(); return service.registrarRetorno(alvo.getId(), alvo.getHoraEntrada()); });
            var segunda = executor.submit(() -> { inicio.await(); return service.registrarRetorno(alvo.getId(), alvo.getHoraEntrada()); });
            inicio.countDown();
            assertNotEquals(primeira.get(), segunda.get());
        }
        assertTrue(repository.findById(alvo.getId()).orElseThrow().isEstacionado());
    }

    @Test
    void calculaPermanenciaAcimaDeUmDiaEAtravessandoMeiaNoite() {
        relogio.instante = relogio.instante.plusSeconds(27 * 3600 + 1800);
        assertEquals("27 h 30 min", service.listarVeiculos().getFirst().getTempoPermanencia());
    }

    @Test
    void duasSaidasConcorrentesGeramSomenteUmSucesso() throws Exception {
        var inicio = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var primeira = executor.submit(() -> { inicio.await(); return service.registrarSaida(alvo.getId(), alvo.getHoraEntrada()); });
            var segunda = executor.submit(() -> { inicio.await(); return service.registrarSaida(alvo.getId(), alvo.getHoraEntrada()); });
            inicio.countDown();
            assertNotEquals(primeira.get(), segunda.get());
        }
        assertNotNull(repository.findById(alvo.getId()).orElseThrow().getHoraSaida());
    }

    @Test
    void naoInventaPermanenciaNegativaParaHorariosLegadosInconsistentes() {
        alvo.setHoraEntrada(LocalDateTime.of(2026, 10, 16, 15, 0));
        repository.save(alvo);
        assertEquals("Horário indisponível", service.listarVeiculos().getFirst().getTempoPermanencia());
        assertFalse(service.registrarSaida(alvo.getId(), alvo.getHoraEntrada()));
    }
}
