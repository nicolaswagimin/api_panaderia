package com.panaderia.api.model;

import com.panaderia.api.model.base.EntidadBase;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidad Factura — Herencia + Composición (POO).
 * Agrupa los detalles de una venta. Tiene relación N:1 con Cliente
 * y 1:N con DetalleFactura (composición). El campo "activo" indica
 * si la factura está vigente o fue anulada.
 */
@Entity
@Table(name = "facturas")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Factura extends EntidadBase {

    @Column(name = "numero_factura", unique = true, nullable = false) // ej: FAC-000001
    private String numeroFactura;

    // Muchas facturas pueden pertenecer a un cliente (N:1)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Column(name = "fecha_factura", nullable = false)
    private LocalDateTime fechaFactura;

    @Column(name = "total", precision = 10, scale = 2)
    private BigDecimal total;

    // Una factura contiene muchos detalles (1:N) — Composición
    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<DetalleFactura> detalles;

    @Override
    public String getDescripcionCompleta() {
        return String.format("Factura: %s | Total: $%.2f", numeroFactura, total);
    }
}
