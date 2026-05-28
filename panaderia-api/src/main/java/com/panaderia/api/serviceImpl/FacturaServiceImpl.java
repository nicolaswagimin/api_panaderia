package com.panaderia.api.serviceImpl;

import com.panaderia.api.dto.request.*;
import com.panaderia.api.dto.response.*;
import com.panaderia.api.exception.*;
import com.panaderia.api.model.*;
import com.panaderia.api.repository.*;
import com.panaderia.api.service.FacturaService;
import com.panaderia.api.util.CalculadoraFactura;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ============================================================
 * SERVICIO DE FACTURACION - LOGICA DE NEGOCIO PRINCIPAL
 * ============================================================
 *
 * Esta clase implementa la interfaz FacturaService (ABSTRACCION).
 * Contiene toda la logica del proceso de venta:
 *
 * FLUJO DE CREAR UNA FACTURA:
 *   1. Recibe el request con clienteId (opcional) y lista de productos
 *   2. Busca el cliente en la BD (si se indico uno)
 *   3. Por cada producto en el carrito:
 *      a. Verifica que existe en la BD
 *      b. Busca su inventario
 *      c. Valida que hay stock suficiente
 *      d. Construye el DetalleFactura con precio actual
 *      e. Descuenta el stock del inventario
 *   4. Genera un numero de factura unico (FAC-000001)
 *   5. Guarda la Factura y sus detalles en la BD
 *   6. Retorna un FacturaResponse con todos los datos
 *
 * FLUJO DE ANULAR UNA FACTURA:
 *   1. Busca la factura por id
 *   2. Por cada detalle: devuelve las unidades al inventario
 *   3. Pone activo=false en la factura (borrado logico)
 *
 * @Transactional: si algo falla en el medio (ej: un producto
 * no tiene stock), toda la operacion se revierte automaticamente.
 * No queda la BD en un estado inconsistente.
 * ============================================================
 */
@Service
@RequiredArgsConstructor
@Transactional
public class FacturaServiceImpl implements FacturaService {

    // Los repositorios se inyectan por constructor gracias a @RequiredArgsConstructor
    private final FacturaRepository facturaRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final ClienteRepository clienteRepository;

    /**
     * Crea una nueva factura y descuenta el stock correspondiente.
     * Si cualquier producto no tiene stock suficiente, se lanza
     * StockInsuficienteException y la transaccion se revierte.
     */
    @Override
    public FacturaResponse crear(FacturaRequest request, String usuarioCajero) {

        // PASO 1: Buscar el cliente (es opcional: puede ser "Consumidor Final")
        Cliente cliente = null;
        if (request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Cliente", request.getClienteId()));
        }

        // PASO 2: Procesar cada producto del carrito
        List<DetalleFactura> detalles = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (DetalleFacturaRequest dr : request.getDetalles()) {

            // Busca el producto. Si no existe, lanza excepcion (HTTP 404)
            Producto producto = productoRepository.findById(dr.getProductoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto", dr.getProductoId()));

            // Busca el inventario de ese producto
            Inventario inventario = inventarioRepository.findByProductoId(dr.getProductoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Inventario", dr.getProductoId()));

            // Verifica stock: si no hay suficiente lanza excepcion (HTTP 409 Conflict)
            // La transaccion se revierte y ningun cambio queda guardado
            if (!inventario.tieneStockSuficiente(dr.getCantidad())) {
                throw new StockInsuficienteException(
                        producto.getDescripcion(), dr.getCantidad(), inventario.getStockActual());
            }

            // Construye la linea del detalle con el precio ACTUAL del producto
            // (el precio puede cambiar en el futuro, pero la factura conserva el historico)
            DetalleFactura detalle = DetalleFactura.builder()
                    .producto(producto)
                    .cantidad(dr.getCantidad())
                    .precioUnitario(producto.getPrecio())
                    .build();

            detalle.calcularSubtotal();        // subtotal = precio * cantidad
            detalles.add(detalle);
            total = total.add(detalle.getSubtotal());

            // Descuenta las unidades vendidas del inventario
            inventario.reducirStock(dr.getCantidad());
            inventarioRepository.save(inventario);
        }

        // PASO 3: Generar numero unico de factura
        // Usa el MAX(id) + 1 en lugar de COUNT() para evitar duplicados
        // cuando hay facturas anuladas (COUNT no baja al anular)
        long consecutivo = facturaRepository.findMaxId() + 1;
        String numeroFactura = CalculadoraFactura.generarNumeroFactura(consecutivo);

        // PASO 4: Construir y guardar la factura
        Factura factura = Factura.builder()
                .numeroFactura(numeroFactura)
                .cliente(cliente)
                .fechaFactura(LocalDateTime.now())
                .total(total)
                .build();
        factura.setActivo(true);

        Factura facturaGuardada = facturaRepository.save(factura);

        // Asociar cada detalle a la factura guardada
        for (DetalleFactura det : detalles) {
            det.setFactura(facturaGuardada);
        }
        facturaGuardada.setDetalles(detalles);
        facturaRepository.save(facturaGuardada);

        // PASO 5: Retornar el response (DTO que el frontend recibe)
        return mapearAResponse(facturaGuardada);
    }

    @Override
    @Transactional(readOnly = true)
    public FacturaResponse buscarPorId(Long id) {
        Factura f = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura", id));
        return mapearAResponse(f);
    }

    @Override
    @Transactional(readOnly = true)
    public FacturaResponse buscarPorNumero(String numero) {
        Factura f = facturaRepository.findByNumeroFactura(numero)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura con numero " + numero));
        return mapearAResponse(f);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacturaResponse> listarTodas() {
        // Solo retorna facturas activas (activo=true), no las anuladas
        return facturaRepository.findAllActive().stream()
                .map(this::mapearAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Anula una factura y devuelve el stock al inventario.
     * No elimina la factura de la BD, solo pone activo=false (borrado logico).
     */
    @Override
    public FacturaResponse anular(Long id, String motivo) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura", id));

        // Devuelve las unidades al stock por cada producto de la factura
        for (DetalleFactura det : factura.getDetalles()) {
            Inventario inv = inventarioRepository.findByProductoId(det.getProducto().getId())
                    .orElseThrow();
            inv.aumentarStock(det.getCantidad()); // restaura el stock
            inventarioRepository.save(inv);
        }

        // Borrado logico: la factura queda en BD pero marcada como inactiva
        factura.setActivo(false);
        return mapearAResponse(facturaRepository.save(factura));
    }

    /**
     * Retorna estadisticas del dia y del mes para el Dashboard.
     * Las queries estan en FacturaRepository usando @Query nativo SQL.
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerResumenDiario() {
        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("facturas_hoy", facturaRepository.countFacturasHoy());
        resumen.put("ventas_hoy",   facturaRepository.sumVentasHoy());
        resumen.put("ventas_mes",   facturaRepository.sumVentasMes());
        return resumen;
    }

    /**
     * Convierte una entidad Factura en un DTO FacturaResponse.
     * El DTO es lo que el frontend recibe como JSON.
     * Se usa DTO para no exponer directamente la entidad JPA.
     */
    private FacturaResponse mapearAResponse(Factura f) {
        // Convierte cada DetalleFactura en DetalleFacturaResponse
        List<DetalleFacturaResponse> detallesResp = f.getDetalles() == null ? List.of() :
                f.getDetalles().stream().map(d -> DetalleFacturaResponse.builder()
                        .id(d.getId())
                        .productoId(d.getProducto().getId())
                        .productoDescripcion(d.getProducto().getDescripcion())
                        .cantidad(d.getCantidad())
                        .precioUnitario(d.getPrecioUnitario())
                        .subtotal(d.getSubtotal())
                        .build()
                ).collect(Collectors.toList());

        return FacturaResponse.builder()
                .id(f.getId())
                .numeroFactura(f.getNumeroFactura())
                .clienteNombre(f.getCliente() != null ? f.getCliente().getNombre() : "Consumidor Final")
                .fechaFactura(f.getFechaFactura())
                .total(f.getTotal())
                .activo(f.getActivo())
                .detalles(detallesResp)
                .build();
    }
}
