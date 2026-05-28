package com.panaderia.api.repository;

import com.panaderia.api.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    @Query("SELECT c FROM Cliente c WHERE c.activo = true OR c.activo IS NULL")
    List<Cliente> findAllActive();

    @Query("SELECT c FROM Cliente c WHERE LOWER(c.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) AND (c.activo = true OR c.activo IS NULL)")
    List<Cliente> buscarPorNombre(@Param("nombre") String nombre);

    boolean existsByDocumento(String documento);
}
