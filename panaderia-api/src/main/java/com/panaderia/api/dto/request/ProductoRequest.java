package com.panaderia.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductoRequest {

    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;

    @NotNull @DecimalMin("0.01")
    private BigDecimal precio;

    @NotNull @Min(0)
    private Integer stockInicial;
}
