package com.panaderia.api.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FacturaResponse {
    private Long id;
    private String numeroFactura;
    private String clienteNombre;
    private LocalDateTime fechaFactura;
    private BigDecimal total;
    private Boolean activo;
    private List<DetalleFacturaResponse> detalles;
}
