package com.panaderia.api.model.base;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * ============================================================
 * CLASE BASE ABSTRACTA - PRINCIPIO DE HERENCIA (POO)
 * ============================================================
 *
 * Esta clase es la MADRE de todas las entidades del sistema.
 * Define los campos comunes que comparten Producto, Cliente,
 * Factura, Inventario, DetalleFactura y Usuario.
 *
 * HERENCIA: en lugar de repetir id, fechaCreacion y activo
 * en cada clase, los definimos aqui una sola vez y todas
 * las demas clases los heredan automaticamente.
 *
 * ABSTRACCION: es abstract porque no tiene sentido crear
 * un objeto de tipo EntidadBase directamente. Solo sirve
 * como molde para las clases hijas.
 *
 * POLIMORFISMO: el metodo getDescripcionCompleta() es abstracto,
 * lo que obliga a cada clase hija a definir su propia version.
 * Cada entidad se describe de forma diferente.
 *
 * @MappedSuperclass le dice a JPA que los campos de esta clase
 * se mapean en las tablas de las clases hijas, no en una tabla propia.
 * ============================================================
 */
@MappedSuperclass
@Getter @Setter  // Lombok genera automaticamente todos los getters y setters
public abstract class EntidadBase {

    // Clave primaria auto-incremental en la base de datos
    // Cada tabla hija (productos, clientes, etc.) tendra su propio id
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Se asigna automaticamente cuando se crea el registro
    // updatable=false impide que se modifique despues
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    // Se actualiza automaticamente cada vez que se modifica el registro
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // BORRADO LOGICO: en lugar de eliminar el registro de la BD,
    // se pone activo=false. Asi se conserva el historial.
    // Ejemplo: si se elimina un producto, sus facturas siguen mostrando sus datos.
    @Column(name = "activo")
    private Boolean activo = true;

    // @PrePersist: JPA ejecuta este metodo automaticamente
    // justo ANTES de hacer el INSERT en la base de datos
    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
        if (activo == null) activo = true;
    }

    // @PreUpdate: JPA ejecuta este metodo automaticamente
    // justo ANTES de hacer el UPDATE en la base de datos
    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    /**
     * METODO ABSTRACTO - POLIMORFISMO (POO)
     *
     * Al ser abstracto, OBLIGA a cada clase hija a implementar
     * su propia version. Cada entidad se describe diferente:
     *
     * Producto:      "Producto: Pan x10 | Valor: $2500"
     * Cliente:       "Cliente: Juan Perez | Doc: 12345678"
     * Factura:       "Factura: FAC-000001 | Total: $15000"
     * DetalleFactura:"Detalle: Pan x10 x2 @ $2500 = $5000"
     *
     * Esto es polimorfismo: el mismo metodo, comportamientos distintos.
     */
    public abstract String getDescripcionCompleta();
}
