package br.gov.sp.etec.estacionamento.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Mantém as páginas de operação vinculadas ao login da sessão. */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
                    throws Exception {
                var session = request.getSession(false);
                if (session != null && session.getAttribute("usuarioLogado") != null) return true;
                response.sendRedirect(request.getContextPath() + "/login");
                return false;
            }
        }).addPathPatterns("/painel", "/veiculo/**");
    }
}
