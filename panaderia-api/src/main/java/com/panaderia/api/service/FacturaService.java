package com.panaderia.api.service;

import com.panaderia.api.dto.request.FacturaRequest;
import com.panaderia.api.dto.response.FacturaResponse;
import java.util.List;
import java.util.Map;

public interface FacturaService {
    FacturaResponse crear(FacturaRequest request, String usuarioCajero);
    FacturaResponse buscarPorId(Long id);
    FacturaResponse buscarPorNumero(String numero);
    List<FacturaResponse> listarTodas();
    FacturaResponse anular(Long id, String motivo);
    Map<String, Object> obtenerResumenDiario();
}
