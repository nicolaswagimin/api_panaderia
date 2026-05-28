package com.panaderia.api.model;

import com.panaderia.api.model.base.EntidadBase;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

/**
 * Entidad DetalleFactura — Línea de venta dentro de una Factura.
 * Relación N:1 con Factura (pertenece a una factura) y
 * N:1 con Producto (referencia el artículo vendido).
 */
@Entity
@Table(name = "detalles_factura")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class DetalleFactura extends EntidadBase {

    // Cada detalle pertenece a una factura (N:1)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "factura_id", nullable = false)
    private Factura factura;

    // Referencia al producto vendido (N:1)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario; // precio en el momento de la venta

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    /** Calcula subtotal = precioUnitario × cantidad */
    public void calcularSubtotal() {
        this.subtotal = precioUnitario.multiply(new BigDecimal(cantidad));
    }

    @Override
    public String getDescripcionCompleta() {
        return String.format("Detalle: %s x%d @ $%.2f = $%.2f",
                producto.getDescripcion(), cantidad, precioUnitario, subtotal);
    }
}
