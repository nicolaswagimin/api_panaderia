package com.panaderia.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DetalleFacturaRequest {

    @NotNull
    private Long productoId;

    @NotNull @Min(1)
    private Integer cantidad;
}
