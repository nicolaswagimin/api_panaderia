package com.panaderia.api.serviceImpl;

import com.panaderia.api.dto.request.ProductoRequest;
import com.panaderia.api.dto.response.ProductoResponse;
import com.panaderia.api.exception.RecursoNoEncontradoException;
import com.panaderia.api.model.*;
import com.panaderia.api.repository.*;
import com.panaderia.api.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;

    @Override
    public ProductoResponse crear(ProductoRequest request) {
        Producto producto = Producto.builder()
                .descripcion(request.getDescripcion())
                .precio(request.getPrecio())
                .build();
        producto.setActivo(true); // Asegurar que sea activo

        Producto guardado = productoRepository.save(producto);

        Inventario inventario = Inventario.builder()
                .producto(guardado)
                .stockActual(request.getStockInicial())
                .build();
        inventario.setActivo(true); // Asegurar que sea activo

        inventarioRepository.save(inventario);

        return mapearAResponse(guardado, inventario);
    }

    @Override
    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", id));

        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());

        Producto actualizado = productoRepository.save(producto);
        Inventario inventario = inventarioRepository.findByProductoId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Inventario del producto", id));

        return mapearAResponse(actualizado, inventario);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponse buscarPorId(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", id));
        Inventario inventario = inventarioRepository.findByProductoId(id).orElse(null);
        return mapearAResponse(producto, inventario);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> listarTodos() {
        return productoRepository.findAllActive().stream()
                .map(p -> {
                    Inventario inv = inventarioRepository.findByProductoId(p.getId()).orElse(null);
                    return mapearAResponse(p, inv);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> buscarPorNombre(String nombre) {
        return productoRepository.buscarPorNombre(nombre).stream()
                .map(p -> {
                    Inventario inv = inventarioRepository.findByProductoId(p.getId()).orElse(null);
                    return mapearAResponse(p, inv);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> listarPorCategoria(Long categoriaId) {
        return listarTodos(); // No category support anymore, just return all
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> obtenerStockBajo() {
        return listarTodos().stream()
                .filter(p -> p.getStockActual() != null && p.getStockActual() < 5)
                .collect(Collectors.toList());
    }

    @Override
    public void eliminar(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", id));
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    @Override
    public ProductoResponse actualizarStock(Long id, int cantidad) {
        Inventario inventario = inventarioRepository.findByProductoId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Inventario del producto", id));
        if (cantidad < 0 && !inventario.tieneStockSuficiente(Math.abs(cantidad))) {
            throw new com.panaderia.api.exception.StockInsuficienteException(
                    inventario.getProducto().getDescripcion(), Math.abs(cantidad), inventario.getStockActual());
        }
        inventario.setStockActual(inventario.getStockActual() + cantidad);
        inventarioRepository.save(inventario);
        return mapearAResponse(inventario.getProducto(), inventario);
    }

    private ProductoResponse mapearAResponse(Producto producto, Inventario inventario) {
        return ProductoResponse.builder()
                .id(producto.getId())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .stockActual(inventario != null ? inventario.getStockActual() : 0)
                .activo(producto.getActivo())
                .fechaCreacion(producto.getFechaCreacion())
                .build();
    }
}
