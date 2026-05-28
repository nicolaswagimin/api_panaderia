package com.panaderia.api.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductoResponse {
    private Long id;
    private String descripcion;
    private BigDecimal precio;
    private Integer stockActual;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
}
