package br.gov.sp.etec.estacionamento;

import br.gov.sp.etec.estacionamento.repository.VeiculoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:esquema-legado;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=update",
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:esquema-veiculo-legado.sql"
})
class EvolucaoEsquemaTests {
    @Autowired VeiculoRepository repository;

    @Test
    void adicionaSaidaAoEsquemaAnteriorSemPerderRegistroNemReescreverEntrada() {
        var legado = repository.findAll().getFirst();
        assertEquals(1, repository.count());
        assertEquals("OLD1A23", legado.getPlaca());
        assertEquals("Preservar registro", legado.getObservacao());
        assertEquals(LocalDateTime.of(2026, 10, 1, 9, 30), legado.getHoraEntrada());
        assertNull(legado.getHoraSaida());
        assertFalse(legado.isHorarioBrasilia());
        legado.setHoraSaida(LocalDateTime.of(2026, 10, 1, 10, 30));
        repository.save(legado);
        assertEquals(legado.getHoraSaida(), repository.findById(legado.getId()).orElseThrow().getHoraSaida());
    }
}
