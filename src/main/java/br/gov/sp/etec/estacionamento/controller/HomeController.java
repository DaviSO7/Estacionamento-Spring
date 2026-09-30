package br.gov.sp.etec.estacionamento.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Apresentação pública, independente das regras do estacionamento. */
@Controller
public class HomeController {
    @GetMapping("/")
    public String index() {
        return "index";
    }
}
