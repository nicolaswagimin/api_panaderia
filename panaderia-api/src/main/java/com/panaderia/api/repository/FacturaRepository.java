package com.panaderia.api.repository;

import com.panaderia.api.model.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface FacturaRepository extends JpaRepository<Factura, Long> {

    Optional<Factura> findByNumeroFactura(String numeroFactura);

    @Query("SELECT f FROM Factura f WHERE f.activo = true OR f.activo IS NULL ORDER BY f.fechaFactura DESC")
    List<Factura> findAllActive();

    @Query(value = "SELECT COUNT(*) FROM facturas f WHERE CAST(f.fecha_factura AS date) = CURRENT_DATE AND (f.activo = true OR f.activo IS NULL)", nativeQuery = true)
    Long countFacturasHoy();

    @Query(value = "SELECT COALESCE(SUM(f.total), 0) FROM facturas f WHERE CAST(f.fecha_factura AS date) = CURRENT_DATE AND (f.activo = true OR f.activo IS NULL)", nativeQuery = true)
    java.math.BigDecimal sumVentasHoy();

    @Query(value = "SELECT COALESCE(SUM(f.total), 0) FROM facturas f WHERE DATE_PART('month', f.fecha_factura) = DATE_PART('month', CURRENT_DATE) AND DATE_PART('year', f.fecha_factura) = DATE_PART('year', CURRENT_DATE) AND (f.activo = true OR f.activo IS NULL)", nativeQuery = true)
    java.math.BigDecimal sumVentasMes();

    @Query("SELECT COALESCE(MAX(f.id), 0) FROM Factura f")
    Long findMaxId();
}
