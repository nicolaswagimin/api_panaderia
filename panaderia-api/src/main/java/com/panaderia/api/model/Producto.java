package com.panaderia.api.model;

import com.panaderia.api.model.base.EntidadBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "productos")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto extends EntidadBase {

    @NotBlank(message = "La descripción del producto es obligatoria")
    @Column(nullable = false)
    private String descripcion;

    @NotNull(message = "El valor es obligatorio")
    @DecimalMin(value = "0.0", inclusive = false, message = "El valor debe ser mayor a 0")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @OneToOne(mappedBy = "producto", cascade = CascadeType.ALL)
    private Inventario inventario;

    @Override
    public String getDescripcionCompleta() {
        return String.format("Producto: %s | Valor: $%.2f", descripcion, precio);
    }
}
