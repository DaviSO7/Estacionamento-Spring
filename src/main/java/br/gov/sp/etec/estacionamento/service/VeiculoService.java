package br.gov.sp.etec.estacionamento.service;

import br.gov.sp.etec.estacionamento.entity.VeiculoEntity;
import br.gov.sp.etec.estacionamento.model.Veiculo;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface VeiculoService {
    // cadastrar
    // deletar
    // atualizar
    // listar
    void cadastrarVeiculo(Veiculo veiculo);
    List<VeiculoEntity> listarVeiculos();
    boolean excluirVeiculo(Long id);
    Optional<VeiculoEntity> buscarVeiculo(Long id);
    VeiculoEntity atualizarVeiculo(VeiculoEntity veiculoEntity);
    boolean registrarSaida(Long id, LocalDateTime entradaEsperada);
    boolean registrarRetorno(Long id, LocalDateTime entradaEsperada);
}
