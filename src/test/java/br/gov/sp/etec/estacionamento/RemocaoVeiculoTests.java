package br.gov.sp.etec.estacionamento;

import br.gov.sp.etec.estacionamento.entity.VeiculoEntity;
import br.gov.sp.etec.estacionamento.repository.VeiculoRepository;
import br.gov.sp.etec.estacionamento.service.VeiculoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.CountDownLatch;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RemocaoVeiculoTests {
    @Autowired MockMvc mvc;
    @Autowired VeiculoRepository veiculos;
    @Autowired VeiculoService service;
    VeiculoEntity alvo;
    MockHttpSession session;

    @BeforeEach
    void preparar() {
        veiculos.deleteAll();
        alvo = criar("ABC1D23");
        session = sessao();
    }

    private MockHttpSession sessao() {
        var sessao = new MockHttpSession();
        sessao.setAttribute("usuarioLogado", "operacao@example.com");
        return sessao;
    }

    private VeiculoEntity criar(String placa) {
        var veiculo = new VeiculoEntity();
        veiculo.setPlaca(placa);
        veiculo.setModelo("Modelo de teste");
        veiculo.setCor("Prata");
        veiculo.setObservacao("<script>alert('teste')</script>");
        veiculo.setHoraEntrada(LocalDateTime.now());
        return veiculos.save(veiculo);
    }

    private String rota(Long id) { return "/veiculo/" + id + "/remover"; }

    private String token() throws Exception {
        return (String) mvc.perform(get(rota(alvo.getId())).session(session))
                .andExpect(status().isOk()).andReturn().getModelAndView().getModel().get("tokenRemocao");
    }

    @Test
    void conferenciaNaoRemoveEExibeDetalhesComEscape() throws Exception {
        mvc.perform(get(rota(alvo.getId())).session(session))
                .andExpect(view().name("remover-veiculo"))
                .andExpect(model().attributeExists("tokenRemocao", "veiculo"))
                .andExpect(content().string(containsString("ABC1D23")))
                .andExpect(content().string(containsString("&lt;script&gt;")));
        assertTrue(veiculos.existsById(alvo.getId()));
        mvc.perform(get("/painel").session(session)).andExpect(status().isOk())
                .andExpect(content().string(containsString(rota(alvo.getId()))));
    }

    @Test
    void exigeLoginNaConferenciaENaRemocao() throws Exception {
        mvc.perform(get(rota(alvo.getId()))).andExpect(redirectedUrl("/login"));
        mvc.perform(post(rota(alvo.getId()))).andExpect(redirectedUrl("/login"));
        assertEquals(1, veiculos.count());
    }

    @Test
    void rejeitaTokenAusenteIncorretoEDeOutraSessao() throws Exception {
        String token = token();
        mvc.perform(post(rota(alvo.getId())).session(session))
                .andExpect(redirectedUrl("/painel")).andExpect(flash().attributeExists("erroRemocao"));
        mvc.perform(post(rota(alvo.getId())).session(session).param("_remocaoToken", "incorreto"))
                .andExpect(flash().attributeExists("erroRemocao"));
        mvc.perform(post(rota(alvo.getId())).session(sessao()).param("_remocaoToken", token))
                .andExpect(flash().attributeExists("erroRemocao"));
        assertTrue(veiculos.existsById(alvo.getId()));
    }

    @Test
    void removeSomenteOIdConfirmadoMesmoComPlacaRepetida() throws Exception {
        var outro = criar(alvo.getPlaca());
        String token = token();
        mvc.perform(post(rota(alvo.getId())).session(session).param("_remocaoToken", token))
                .andExpect(redirectedUrl("/painel")).andExpect(flash().attributeExists("sucesso"));
        assertFalse(veiculos.existsById(alvo.getId()));
        assertTrue(veiculos.existsById(outro.getId()));
        mvc.perform(post(rota(alvo.getId())).session(session).param("_remocaoToken", token))
                .andExpect(redirectedUrl("/painel")).andExpect(flash().attributeExists("erroRemocao"));
        assertEquals(1, veiculos.count());
    }

    @Test
    void inexistenteOuIdInvalidoNaoCausaErroInterno() throws Exception {
        String token = token();
        for (long id : new long[]{-1, 0, Long.MAX_VALUE}) {
            mvc.perform(get(rota(id)).session(session)).andExpect(redirectedUrl("/painel"))
                    .andExpect(flash().attributeExists("erroRemocao"));
            mvc.perform(post(rota(id)).session(session).param("_remocaoToken", token))
                    .andExpect(redirectedUrl("/painel")).andExpect(flash().attributeExists("erroRemocao"));
        }
        assertEquals(1, veiculos.count());
    }

    @Test
    void ultimaRemocaoMostraEstadoVazioSemRepetirAoAtualizar() throws Exception {
        mvc.perform(post(rota(alvo.getId())).session(session).param("_remocaoToken", token()))
                .andExpect(redirectedUrl("/painel"));
        for (int i = 0; i < 2; i++) {
            mvc.perform(get("/painel").session(session)).andExpect(status().isOk())
                    .andExpect(content().string(containsString("Nenhuma entrada registrada.")));
        }
        assertEquals(0, veiculos.count());
    }

    @Test
    void duasRemocoesConcorrentesGeramApenasUmSucesso() throws Exception {
        var inicio = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var primeira = executor.submit(() -> { inicio.await(); return service.excluirVeiculo(alvo.getId()); });
            var segunda = executor.submit(() -> { inicio.await(); return service.excluirVeiculo(alvo.getId()); });
            inicio.countDown();
            assertNotEquals(primeira.get(), segunda.get());
        }
        assertEquals(0, veiculos.count());
    }
}
