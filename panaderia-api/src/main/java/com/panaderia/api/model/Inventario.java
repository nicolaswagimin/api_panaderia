package com.panaderia.api.model;

import com.panaderia.api.model.base.EntidadBase;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "inventario")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventario extends EntidadBase {

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false, unique = true)
    private Producto producto;

    @Column(name = "stock_actual", nullable = false)
    private Integer stockActual;

    public boolean tieneStockSuficiente(int cantidad) {
        return stockActual >= cantidad;
    }

    public void reducirStock(int cantidad) {
        if (!tieneStockSuficiente(cantidad)) {
            throw new RuntimeException("Stock insuficiente");
        }
        this.stockActual -= cantidad;
    }

    public void aumentarStock(int cantidad) {
        this.stockActual += cantidad;
    }

    @Override
    public String getDescripcionCompleta() {
        return String.format("Inventario de: %s | Stock: %d",
                producto.getDescripcion(), stockActual);
    }
}
