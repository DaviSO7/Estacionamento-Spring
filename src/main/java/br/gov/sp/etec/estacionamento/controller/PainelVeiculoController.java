package br.gov.sp.etec.estacionamento.controller;

import br.gov.sp.etec.estacionamento.model.Veiculo;
import br.gov.sp.etec.estacionamento.service.VeiculoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.ui.Model;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import jakarta.servlet.http.HttpSession;
import org.springframework.dao.DataAccessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

@Controller
@RequestMapping("veiculo")
public class PainelVeiculoController {
    private static final String TOKEN_REMOCAO = "tokenRemocaoVeiculo";
    private static final Logger LOG = LoggerFactory.getLogger(PainelVeiculoController.class);

    @Autowired
    VeiculoService service;

    @PostMapping("cadastrar")
    public String cadastrarVeiculo(Veiculo veiculo, Model model, RedirectAttributes redirect) {
        if (veiculo.getPlaca() == null || veiculo.getPlaca().isBlank()
                || veiculo.getModelo() == null || veiculo.getModelo().isBlank()
                || veiculo.getCor() == null || veiculo.getCor().isBlank()
                || veiculo.getPlaca().length() > 10 || veiculo.getModelo().length() > 100
                || veiculo.getCor().length() > 40
                || (veiculo.getObservacao() != null && veiculo.getObservacao().length() > 255)) {
            model.addAttribute("erroEntrada", "Confira placa, modelo e cor. As observações aceitam até 255 caracteres.");
            return "registrar-entrada";
        }
        service.cadastrarVeiculo(veiculo);
        redirect.addFlashAttribute("sucesso", "Entrada registrada. O veículo já aparece no painel.");
        return "redirect:/painel";
    }

    @GetMapping("registrar-entrada")
    public String registrarEntrada() {
        return "registrar-entrada";
    }

    @PostMapping("{id}/saida")
    public String registrarSaida(@PathVariable Long id,
            @RequestParam(name = "_movimentacaoToken", required = false) String token,
            @RequestParam(name = "entradaEsperada", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime entradaEsperada,
            HttpSession session, RedirectAttributes redirect) {
        return movimentar(id, token, entradaEsperada, session, redirect, true);
    }

    @PostMapping("{id}/retorno")
    public String registrarRetorno(@PathVariable Long id,
            @RequestParam(name = "_movimentacaoToken", required = false) String token,
            @RequestParam(name = "entradaEsperada", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime entradaEsperada,
            HttpSession session, RedirectAttributes redirect) {
        return movimentar(id, token, entradaEsperada, session, redirect, false);
    }

    private String movimentar(Long id, String token, LocalDateTime entradaEsperada,
            HttpSession session, RedirectAttributes redirect, boolean saida) {
        var esperado = (String) session.getAttribute("tokenMovimentacaoVeiculo");
        if (esperado == null || token == null || !MessageDigest.isEqual(
                esperado.getBytes(StandardCharsets.UTF_8), token.getBytes(StandardCharsets.UTF_8))) {
            redirect.addFlashAttribute("erroMovimentacao", "Não foi possível confirmar a solicitação. Atualize o painel e tente novamente.");
            return "redirect:/painel";
        }
        try {
            boolean alterado = saida ? service.registrarSaida(id, entradaEsperada)
                    : service.registrarRetorno(id, entradaEsperada);
            if (alterado) {
                redirect.addFlashAttribute("sucesso", saida
                        ? "Saída registrada. O veículo permanece na lista para consulta e retorno."
                        : "Retorno registrado. Uma nova permanência foi iniciada.");
            } else {
                redirect.addFlashAttribute("erroMovimentacao", "Registro alterado, removido ou com horário inconsistente. Atualize o painel antes de tentar novamente.");
            }
        } catch (DataAccessException e) {
            LOG.warn("Falha ao movimentar registro de veículo {}", id, e);
            redirect.addFlashAttribute("erroMovimentacao", "Não foi possível registrar a movimentação agora. Tente novamente em instantes.");
        }
        return "redirect:/painel";
    }

    @GetMapping("{id}/remover")
    public String confirmarRemocao(@PathVariable Long id, Model model, HttpSession session,
                                  RedirectAttributes redirect) {
        var veiculo = service.buscarVeiculo(id);
        if (veiculo.isEmpty()) {
            redirect.addFlashAttribute("erroRemocao", "Este registro não existe ou já foi removido.");
            return "redirect:/painel";
        }
        // Token de sessão restrito a esta operação; não depende de JavaScript.
        synchronized (session) {
            if (session.getAttribute(TOKEN_REMOCAO) == null) {
                session.setAttribute(TOKEN_REMOCAO, UUID.randomUUID().toString());
            }
            model.addAttribute("tokenRemocao", session.getAttribute(TOKEN_REMOCAO));
        }
        model.addAttribute("veiculo", veiculo.get());
        return "remover-veiculo";
    }

    @PostMapping("{id}/remover")
    public String removerVeiculo(@PathVariable Long id,
                                @RequestParam(name = "_remocaoToken", required = false) String token,
                                HttpSession session, RedirectAttributes redirect) {
        var esperado = (String) session.getAttribute(TOKEN_REMOCAO);
        if (esperado == null || token == null || !MessageDigest.isEqual(
                esperado.getBytes(StandardCharsets.UTF_8), token.getBytes(StandardCharsets.UTF_8))) {
            redirect.addFlashAttribute("erroRemocao",
                    "Não foi possível confirmar a solicitação. Abra a remoção do veículo novamente.");
            return "redirect:/painel";
        }
        try {
            if (service.excluirVeiculo(id)) {
                redirect.addFlashAttribute("sucesso", "Veículo removido. A lista de registros foi atualizada.");
            } else {
                redirect.addFlashAttribute("erroRemocao", "Este registro não existe ou já foi removido.");
            }
        } catch (DataAccessException e) {
            LOG.warn("Falha ao remover registro de veículo {}", id, e);
            redirect.addFlashAttribute("erroRemocao",
                    "Não foi possível remover o veículo agora. Tente novamente em instantes.");
        }
        return "redirect:/painel";
    }

}
