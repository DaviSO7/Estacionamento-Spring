package br.gov.sp.etec.estacionamento.controller;

import br.gov.sp.etec.estacionamento.model.Usuario;
import br.gov.sp.etec.estacionamento.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.ui.Model;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class LoginController {
    @Autowired
    UsuarioService service;

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/cadastro")
    public String cadastro() {
        return "cadastro";
    }

    @PostMapping("/efetuarCadastro")
    public String efetuarCadastro(Usuario usuario, Model model, RedirectAttributes redirect){
        if (usuario.getInputNomeCadastro() == null || usuario.getInputNomeCadastro().isBlank()
                || usuario.getInputEmailCadastro() == null || !usuario.getInputEmailCadastro().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")
                || usuario.getInputSenhaCadastro() == null || usuario.getInputSenhaCadastro().isBlank()
                || usuario.getInputCPFCadastro() == null || !usuario.getInputCPFCadastro().matches("[0-9]{11}")
                || usuario.getInputTelefone() == null || !usuario.getInputTelefone().matches("[0-9]{10,11}")
                || usuario.getInputDataNascimentoCadastro() == null) {
            model.addAttribute("erroCadastro", "Confira os campos: nome, e-mail, senha, CPF, telefone e data de nascimento são obrigatórios.");
            return "cadastro";
        }
        if (service.buscaUsuarioPorEmail(usuario.getInputEmailCadastro()) != null) {
            model.addAttribute("erroCadastro", "Este e-mail já tem cadastro. Acesse sua conta na tela de login.");
            return "cadastro";
        }
        service.cadastrarUsuario(usuario);
        redirect.addFlashAttribute("sucesso", "Conta criada. Entre com seu e-mail e senha.");
        return "redirect:/login";
    }
    @PostMapping ("/autenticar")
    public String autenticar(String inputEmail, String inputSenha, HttpServletRequest request){
        Usuario user = service.buscaUsuarioPorEmail(inputEmail);
        if (user != null && inputSenha != null && inputSenha.equals(user.getInputSenhaCadastro())){
            request.getSession();
            request.changeSessionId();
            request.getSession().setAttribute("usuarioLogado", user.getInputEmailCadastro());
            return "redirect:/painel";
        }
        else {
            return "erro";
        }
    }

    @PostMapping("/sair")
    public String sair(HttpServletRequest request) {
        if (request.getSession(false) != null) request.getSession(false).invalidate();
        return "redirect:/login";
    }
}


