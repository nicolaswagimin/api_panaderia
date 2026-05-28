package com.panaderia.api.model;

import com.panaderia.api.model.base.EntidadBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "clientes")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente extends EntidadBase {

    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(unique = true)
    private String documento;

    private String telefono;

    private String email;

    @Override
    public String getDescripcionCompleta() {
        return String.format("Cliente: %s | Doc: %s", nombre, documento != null ? documento : "N/A");
    }
}
