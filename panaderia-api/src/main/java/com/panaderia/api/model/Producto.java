package com.panaderia.api.model;

import com.panaderia.api.model.base.EntidadBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

/**
 * Entidad Producto — Herencia de EntidadBase (POO).
 * Representa un artículo de la panadería con su precio de venta.
 * Tiene relación 1:1 con Inventario para controlar existencias.
 */
@Entity
@Table(name = "productos") // mapea esta clase a la tabla "productos" en PostgreSQL
@Getter @Setter           // Lombok genera getters y setters → Encapsulamiento
@NoArgsConstructor @AllArgsConstructor @Builder
public class Producto extends EntidadBase { // hereda id, fechas y activo

    @NotBlank(message = "La descripción del producto es obligatoria") // validación automática
    @Column(nullable = false)
    private String descripcion;

    @NotNull @DecimalMin(value = "0.0", inclusive = false)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    // Relación bidireccional 1:1 con Inventario
    @OneToOne(mappedBy = "producto", cascade = CascadeType.ALL)
    private Inventario inventario;

    // Polimorfismo: implementa el método abstracto de EntidadBase
    @Override
    public String getDescripcionCompleta() {
        return String.format("Producto: %s | Valor: $%.2f", descripcion, precio);
    }
}
