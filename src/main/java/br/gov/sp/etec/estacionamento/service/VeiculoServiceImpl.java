package br.gov.sp.etec.estacionamento.service;

import br.gov.sp.etec.estacionamento.entity.VeiculoEntity;
import br.gov.sp.etec.estacionamento.model.Veiculo;
import br.gov.sp.etec.estacionamento.repository.VeiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class VeiculoServiceImpl implements VeiculoService {

    @Autowired
    VeiculoRepository repository;

    @Override
    public void cadastrarVeiculo(Veiculo veiculo) {
        repository.save(toVeiculoEntity(veiculo));
    }

    @Override
    public List<VeiculoEntity> listarVeiculos() {
        List<VeiculoEntity> listaVeiculos = repository.findAll();
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


    private VeiculoEntity toVeiculoEntity(Veiculo veiculo) {
        VeiculoEntity veiculoEntity = new VeiculoEntity();
        veiculoEntity.setHoraEntrada(LocalDateTime.now());
        veiculoEntity.setCor(veiculo.getCor());
        veiculoEntity.setModelo(veiculo.getModelo());
        veiculoEntity.setObservacao(veiculo.getObservacao());
        veiculoEntity.setPlaca(veiculo.getPlaca());
        return veiculoEntity;
    }

}
