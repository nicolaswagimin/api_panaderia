package com.panaderia.api.model;

import com.panaderia.api.model.base.EntidadBase;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entidad Inventario — Encapsulamiento (POO).
 * Controla el stock disponible de cada producto.
 * Los métodos encapsulan las reglas de negocio del manejo de existencias.
 */
@Entity
@Table(name = "inventario")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Inventario extends EntidadBase {

    // Relación 1:1 con Producto (cada producto tiene un único registro de inventario)
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false, unique = true)
    private Producto producto;

    @Column(name = "stock_actual", nullable = false)
    private Integer stockActual;

    /** Verifica si hay suficiente stock antes de procesar una venta */
    public boolean tieneStockSuficiente(int cantidad) {
        return stockActual >= cantidad;
    }

    /** Descuenta unidades del stock al generar una factura */
    public void reducirStock(int cantidad) {
        if (!tieneStockSuficiente(cantidad)) {
            throw new RuntimeException("Stock insuficiente");
        }
        this.stockActual -= cantidad;
    }

    /** Reintegra unidades al stock al anular una factura */
    public void aumentarStock(int cantidad) {
        this.stockActual += cantidad;
    }

    @Override
    public String getDescripcionCompleta() {
        return String.format("Inventario de: %s | Stock: %d",
                producto.getDescripcion(), stockActual);
    }
}
