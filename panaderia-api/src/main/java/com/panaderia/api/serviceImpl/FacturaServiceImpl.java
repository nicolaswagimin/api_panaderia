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

@Service
@RequiredArgsConstructor
@Transactional
public class FacturaServiceImpl implements FacturaService {

    private final FacturaRepository facturaRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final ClienteRepository clienteRepository;

    @Override
    public FacturaResponse crear(FacturaRequest request, String usuarioCajero) {
        Cliente cliente = null;
        if (request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Cliente", request.getClienteId()));
        }

        List<DetalleFactura> detalles = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (DetalleFacturaRequest dr : request.getDetalles()) {
            Producto producto = productoRepository.findById(dr.getProductoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto", dr.getProductoId()));

            Inventario inventario = inventarioRepository.findByProductoId(dr.getProductoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Inventario", dr.getProductoId()));

            if (!inventario.tieneStockSuficiente(dr.getCantidad())) {
                throw new StockInsuficienteException(
                        producto.getDescripcion(), dr.getCantidad(), inventario.getStockActual());
            }

            DetalleFactura detalle = DetalleFactura.builder()
                    .producto(producto)
                    .cantidad(dr.getCantidad())
                    .precioUnitario(producto.getPrecio())
                    .build();
            detalle.calcularSubtotal();
            detalles.add(detalle);
            total = total.add(detalle.getSubtotal());

            // Update stock
            inventario.reducirStock(dr.getCantidad());
            inventarioRepository.save(inventario);
        }

        long consecutivo = facturaRepository.findMaxId() + 1;
        String numeroFactura = CalculadoraFactura.generarNumeroFactura(consecutivo);

        Factura factura = Factura.builder()
                .numeroFactura(numeroFactura)
                .cliente(cliente)
                .fechaFactura(LocalDateTime.now())
                .total(total)
                .build();
        factura.setActivo(true); // Asegurar que sea activa

        Factura facturaGuardada = facturaRepository.save(factura);

        for (DetalleFactura det : detalles) {
            det.setFactura(facturaGuardada);
        }
        facturaGuardada.setDetalles(detalles);
        facturaRepository.save(facturaGuardada); // Save details

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
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura con número " + numero));
        return mapearAResponse(f);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacturaResponse> listarTodas() {
        return facturaRepository.findAllActive().stream()
                .map(this::mapearAResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FacturaResponse anular(Long id, String motivo) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura", id));

        for (DetalleFactura det : factura.getDetalles()) {
            Inventario inv = inventarioRepository.findByProductoId(det.getProducto().getId())
                    .orElseThrow();
            inv.aumentarStock(det.getCantidad());
            inventarioRepository.save(inv);
        }

        factura.setActivo(false);
        Factura facturaGuardada = facturaRepository.save(factura);
        return mapearAResponse(facturaGuardada);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerResumenDiario() {
        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("facturas_hoy", facturaRepository.countFacturasHoy());
        resumen.put("ventas_hoy", facturaRepository.sumVentasHoy());
        resumen.put("ventas_mes", facturaRepository.sumVentasMes());
        return resumen;
    }

    private FacturaResponse mapearAResponse(Factura f) {
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
