package com.panaderia.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FacturaRequest {

    private Long clienteId;

    @NotEmpty(message = "La factura debe tener al menos un producto")
    private List<DetalleFacturaRequest> detalles;
}
