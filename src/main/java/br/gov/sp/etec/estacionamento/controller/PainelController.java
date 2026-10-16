package br.gov.sp.etec.estacionamento.controller;

import br.gov.sp.etec.estacionamento.service.VeiculoService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.servlet.http.HttpSession;
import java.util.UUID;

@Controller
public class PainelController {
    private final VeiculoService veiculoService;

    public PainelController(VeiculoService veiculoService) {
        this.veiculoService = veiculoService;
    }

    @GetMapping("/painel")
    public String painel(Model model, HttpSession session) {
        synchronized (session) {
            if (session.getAttribute("tokenMovimentacaoVeiculo") == null) {
                session.setAttribute("tokenMovimentacaoVeiculo", UUID.randomUUID().toString());
            }
            model.addAttribute("tokenMovimentacao", session.getAttribute("tokenMovimentacaoVeiculo"));
        }
        model.addAttribute("veiculos", veiculoService.listarVeiculos());
        return "painel";
    }
}
