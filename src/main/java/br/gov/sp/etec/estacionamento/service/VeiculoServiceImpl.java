package br.gov.sp.etec.estacionamento.service;

import br.gov.sp.etec.estacionamento.entity.VeiculoEntity;
import br.gov.sp.etec.estacionamento.model.Veiculo;
import br.gov.sp.etec.estacionamento.repository.VeiculoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Clock;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Objects;

@Service
public class VeiculoServiceImpl implements VeiculoService {

    private final VeiculoRepository repository;
    private final Clock relogio;

    public VeiculoServiceImpl(VeiculoRepository repository, Clock relogio) {
        this.repository = repository;
        this.relogio = relogio;
    }

    @Override
    public void cadastrarVeiculo(Veiculo veiculo) {
        repository.save(toVeiculoEntity(veiculo));
    }

    @Override
    public List<VeiculoEntity> listarVeiculos() {
        List<VeiculoEntity> listaVeiculos = repository.findAll();
        var agora = agora();
        for (var veiculo : listaVeiculos) {
            var fim = veiculo.isEstacionado() ? agora : veiculo.getHoraSaida();
            if (!veiculo.isHorarioBrasilia()) {
                veiculo.setTempoPermanencia("Fuso da entrada não informado");
            } else if (veiculo.getHoraEntrada() == null || fim.isBefore(veiculo.getHoraEntrada())) {
                veiculo.setTempoPermanencia("Horário indisponível");
            } else {
                long minutos = Duration.between(veiculo.getHoraEntrada(), fim).toMinutes();
                veiculo.setTempoPermanencia((minutos / 60) + " h " + (minutos % 60) + " min");
            }
        }
        return listaVeiculos;
    }

    @Override
    @Transactional
    public boolean excluirVeiculo(Long id) {
        if (id == null || id <= 0) return false;
        // A contagem vem do mesmo DELETE: duas confirmações não indicam dois sucessos.
        return repository.removerPorId(id) == 1;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VeiculoEntity> buscarVeiculo(Long id) {
        if (id == null || id <= 0) return Optional.empty();
        return repository.findById(id);
    }

    @Override
    public VeiculoEntity atualizarVeiculo(VeiculoEntity veiculoEntity) {
        return repository.save(veiculoEntity);
    }

    @Override
    @Transactional
    public boolean registrarSaida(Long id, LocalDateTime entradaEsperada) {
        return movimentar(id, entradaEsperada, true);
    }

    @Override
    @Transactional
    public boolean registrarRetorno(Long id, LocalDateTime entradaEsperada) {
        return movimentar(id, entradaEsperada, false);
    }

    private boolean movimentar(Long id, LocalDateTime entradaEsperada, boolean saida) {
        if (id == null || id <= 0) return false;
        var registro = repository.buscarParaMovimentar(id);
        if (registro.isEmpty()) return false;
        var veiculo = registro.get();
        // O horário esperado identifica a visita: formulários antigos não alteram uma nova visita.
        if (veiculo.isEstacionado() != saida
                || !Objects.equals(veiculo.getHoraEntrada(), entradaEsperada)) return false;
        var agora = agora();
        var ultimoHorario = saida ? veiculo.getHoraEntrada() : veiculo.getHoraSaida();
        if (ultimoHorario != null && (!saida || veiculo.isHorarioBrasilia())
                && agora.isBefore(ultimoHorario)) return false;
        if (saida) {
            veiculo.setHoraSaida(agora);
        } else {
            // Garante uma identidade diferente mesmo em duas operações no mesmo microssegundo.
            if (Objects.equals(agora, entradaEsperada)) agora = agora.plusNanos(1000);
            veiculo.setHoraEntrada(agora);
            veiculo.setHoraSaida(null);
            veiculo.setHorarioBrasilia(true);
        }
        return true;
    }

    private LocalDateTime agora() {
        return LocalDateTime.now(relogio).truncatedTo(ChronoUnit.MICROS);
    }


    private VeiculoEntity toVeiculoEntity(Veiculo veiculo) {
        VeiculoEntity veiculoEntity = new VeiculoEntity();
        veiculoEntity.setHoraEntrada(agora());
        veiculoEntity.setHorarioBrasilia(true);
        veiculoEntity.setCor(veiculo.getCor());
        veiculoEntity.setModelo(veiculo.getModelo());
        veiculoEntity.setObservacao(veiculo.getObservacao());
        veiculoEntity.setPlaca(veiculo.getPlaca());
        return veiculoEntity;
    }

}
