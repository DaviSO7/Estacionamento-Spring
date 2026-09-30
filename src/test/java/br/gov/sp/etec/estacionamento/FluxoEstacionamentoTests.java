package br.gov.sp.etec.estacionamento;

import br.gov.sp.etec.estacionamento.repository.UsuarioRepository;
import br.gov.sp.etec.estacionamento.repository.VeiculoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class FluxoEstacionamentoTests {
    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired VeiculoRepository veiculos;

    @BeforeEach
    void limparBancoDeTeste() {
        veiculos.deleteAll();
        usuarios.deleteAll();
    }

    @Test
    void paginasPublicasERecursosSaoRenderizados() throws Exception {
        mvc.perform(get("/")).andExpect(status().isOk()).andExpect(view().name("index"))
                .andExpect(content().string(containsString("id=\"hero-title\"")));
        mvc.perform(get("/login")).andExpect(status().isOk());
        mvc.perform(get("/cadastro")).andExpect(status().isOk());
        mvc.perform(get("/css/landing.css")).andExpect(status().isOk());
        mvc.perform(get("/images/hero-estacionamento.webp")).andExpect(status().isOk());
    }

    @Test
    void acessoDesconhecidoNaoCausaErro500EOperacoesExigemLogin() throws Exception {
        mvc.perform(post("/autenticar").param("inputEmail", "ausente@example.com").param("inputSenha", "incorreta"))
                .andExpect(status().isOk()).andExpect(view().name("erro"));
        mvc.perform(get("/painel")).andExpect(redirectedUrl("/login"));
        mvc.perform(get("/veiculo/registrar-entrada")).andExpect(redirectedUrl("/login"));
        mvc.perform(post("/veiculo/cadastrar").param("placa", "ABC1D23"))
                .andExpect(redirectedUrl("/login"));
        assertEquals(0, veiculos.count());
    }

    @Test
    void cadastroLoginEntradaPainelESaidaDaContaFuncionam() throws Exception {
        mvc.perform(post("/efetuarCadastro")
                        .param("inputNomeCadastro", "Pessoa de Teste")
                        .param("inputCPFCadastro", "01234567890")
                        .param("inputTelefone", "11987654321")
                        .param("inputEmailCadastro", "teste@example.com")
                        .param("inputSenhaCadastro", "senha-teste")
                        .param("inputDataNascimentoCadastro", "2000-01-01"))
                .andExpect(redirectedUrl("/login"));
        var usuario = usuarios.findByInputEmailCadastro("teste@example.com");
        assertEquals("01234567890", usuario.getInputCPFCadastro());
        assertEquals("11987654321", usuario.getInputTelefone());
        mvc.perform(post("/autenticar").param("inputEmail", "teste@example.com").param("inputSenha", "errada"))
                .andExpect(view().name("erro"));
        var login = mvc.perform(post("/autenticar").param("inputEmail", "teste@example.com").param("inputSenha", "senha-teste"))
                .andExpect(redirectedUrl("/painel")).andReturn();
        var session = (MockHttpSession) login.getRequest().getSession(false);
        assertNotNull(session);
        mvc.perform(get("/painel").session(session)).andExpect(status().isOk())
                .andExpect(content().string(containsString("Nenhuma entrada registrada.")));
        mvc.perform(get("/veiculo/registrar-entrada").session(session)).andExpect(status().isOk());
        mvc.perform(post("/veiculo/cadastrar").session(session).param("placa", "ABC1D23")
                        .param("modelo", "Civic").param("cor", "Preto").param("observacao", "<script>alert(1)</script>"))
                .andExpect(redirectedUrl("/painel"));
        assertEquals(1, veiculos.count());
        assertNotNull(veiculos.findAll().getFirst().getHoraEntrada());
        mvc.perform(get("/painel").session(session)).andExpect(status().isOk())
                .andExpect(content().string(containsString("ABC1D23")))
                .andExpect(content().string(containsString("&lt;script&gt;")));
        mvc.perform(get("/painel").session(session)).andExpect(status().isOk());
        assertEquals(1, veiculos.count(), "Atualizar o painel não deve repetir o cadastro");
        mvc.perform(post("/sair").session(session)).andExpect(redirectedUrl("/login"));
        assertTrue(session.isInvalid());
    }

    @Test
    void camposObrigatoriosSaoValidadosNoServidor() throws Exception {
        mvc.perform(post("/efetuarCadastro")).andExpect(view().name("cadastro"))
                .andExpect(model().attributeExists("erroCadastro"));
        var session = new MockHttpSession();
        session.setAttribute("usuarioLogado", "teste@example.com");
        mvc.perform(post("/veiculo/cadastrar").session(session).param("placa", "  "))
                .andExpect(view().name("registrar-entrada")).andExpect(model().attributeExists("erroEntrada"));
        assertEquals(0, veiculos.count());
        assertEquals(0, usuarios.count());
    }
}
