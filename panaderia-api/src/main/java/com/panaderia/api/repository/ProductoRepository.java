package com.panaderia.api.repository;

import com.panaderia.api.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @Query("SELECT p FROM Producto p WHERE p.activo = true OR p.activo IS NULL")
    List<Producto> findAllActive();

    @Query("SELECT p FROM Producto p WHERE LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :nombre, '%')) AND (p.activo = true OR p.activo IS NULL)")
    List<Producto> buscarPorNombre(@Param("nombre") String nombre);
}
