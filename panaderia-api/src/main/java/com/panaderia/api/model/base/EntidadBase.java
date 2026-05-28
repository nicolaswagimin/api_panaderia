package com.panaderia.api.model.base;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Clase base abstracta — Herencia (POO).
 * Centraliza campos comunes (id, fechas, activo) para todas las entidades.
 * Todas las entidades del sistema extienden esta clase.
 */
@MappedSuperclass  // JPA: los campos se mapean en las tablas hijas, no en una tabla propia
@Getter @Setter
public abstract class EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto-incremental en BD
    private Long id;

    @Column(name = "fecha_creacion", updatable = false) // se asigna solo al crear
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "activo")
    private Boolean activo = true; // borrado lógico: no se elimina de la BD

    // Se ejecuta automáticamente antes de persistir (INSERT)
    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
        if (activo == null) {
            activo = true;
        }
    }

    // Se ejecuta automáticamente antes de actualizar (UPDATE)
    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    /**
     * Método abstracto — Polimorfismo (POO).
     * Cada subclase define su propia representación en texto.
     */
    public abstract String getDescripcionCompleta();
}
