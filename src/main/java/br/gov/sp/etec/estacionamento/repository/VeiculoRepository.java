package br.gov.sp.etec.estacionamento.repository;

import br.gov.sp.etec.estacionamento.entity.VeiculoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VeiculoRepository extends JpaRepository<VeiculoEntity, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from tb_veiculo v where v.id = :id")
    int removerPorId(@Param("id") Long id);
}
