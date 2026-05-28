package com.panaderia.api.model;

import com.panaderia.api.model.base.EntidadBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Entidad Cliente — Herencia de EntidadBase (POO).
 * Almacena datos del comprador. El campo "activo" (de EntidadBase)
 * permite borrado lógico: no se elimina físicamente de la BD.
 */
@Entity
@Table(name = "clientes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Cliente extends EntidadBase {

    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(unique = true) // el documento/NIT no puede repetirse
    private String documento;

    private String telefono;
    private String email;

    // Polimorfismo: implementa el método abstracto de EntidadBase
    @Override
    public String getDescripcionCompleta() {
        return String.format("Cliente: %s | Doc: %s", nombre, documento != null ? documento : "N/A");
    }
}
