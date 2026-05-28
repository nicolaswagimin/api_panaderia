package com.panaderia.api.service;

import com.panaderia.api.dto.request.ProductoRequest;
import com.panaderia.api.dto.response.ProductoResponse;
import java.util.List;

public interface ProductoService {
    ProductoResponse crear(ProductoRequest request);
    ProductoResponse actualizar(Long id, ProductoRequest request);
    ProductoResponse buscarPorId(Long id);
    List<ProductoResponse> listarTodos();
    List<ProductoResponse> buscarPorNombre(String nombre);
    List<ProductoResponse> listarPorCategoria(Long categoriaId);
    List<ProductoResponse> obtenerStockBajo();
    void eliminar(Long id);
    ProductoResponse actualizarStock(Long id, int cantidad);
}
