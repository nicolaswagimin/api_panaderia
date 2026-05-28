package com.panaderia.api.controller;

import com.panaderia.api.dto.request.ProductoRequest;
import com.panaderia.api.dto.response.ProductoResponse;
import com.panaderia.api.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controlador REST para productos — Patrón MVC (Controller).
 * Expone los endpoints CRUD del inventario más ajuste de stock.
 * Delega la lógica al ProductoService → Separación de responsabilidades.
 */
@RestController
@RequestMapping("/api/v1/productos") // prefijo de todas las rutas de este controlador
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService; // inyección por constructor (Lombok)

    @PostMapping
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.ok(productoService.actualizar(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.buscarPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> listarTodos() {
        return ResponseEntity.ok(productoService.listarTodos());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<ProductoResponse>> buscarPorNombre(@RequestParam String nombre) {
        return ResponseEntity.ok(productoService.buscarPorNombre(nombre));
    }

    @GetMapping("/categoria/{categoriaId}")
    public ResponseEntity<List<ProductoResponse>> listarPorCategoria(@PathVariable Long categoriaId) {
        return ResponseEntity.ok(productoService.listarPorCategoria(categoriaId));
    }

    @GetMapping("/stock-bajo")
    public ResponseEntity<List<ProductoResponse>> obtenerStockBajo() {
        return ResponseEntity.ok(productoService.obtenerStockBajo());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ProductoResponse> actualizarStock(@PathVariable Long id,
                                                             @RequestParam int cantidad) {
        return ResponseEntity.ok(productoService.actualizarStock(id, cantidad));
    }
}
