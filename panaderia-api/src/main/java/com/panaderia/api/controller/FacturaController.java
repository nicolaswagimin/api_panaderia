package com.panaderia.api.controller;

import com.panaderia.api.dto.request.FacturaRequest;
import com.panaderia.api.dto.response.FacturaResponse;
import com.panaderia.api.service.FacturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * Controlador REST de facturación — Punto de venta (POS).
 * Gestiona creación, consulta, anulación de facturas y resumen de ventas.
 * Obtiene el usuario autenticado desde el contexto de Spring Security.
 */
@RestController
@RequestMapping("/api/v1/facturas")
@RequiredArgsConstructor
public class FacturaController {

    private final FacturaService facturaService;

    /** Crea una nueva factura y descuenta el stock correspondiente */
    @PostMapping
    public ResponseEntity<FacturaResponse> crear(@Valid @RequestBody FacturaRequest request,
                                                  Authentication auth) {
        // Authentication viene del token JWT validado por JwtFilter
        String usuario = auth != null ? auth.getName() : "sistema";
        return ResponseEntity.status(HttpStatus.CREATED).body(facturaService.crear(request, usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacturaResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(facturaService.buscarPorId(id));
    }

    @GetMapping("/numero/{numero}")
    public ResponseEntity<FacturaResponse> buscarPorNumero(@PathVariable String numero) {
        return ResponseEntity.ok(facturaService.buscarPorNumero(numero));
    }

    @GetMapping
    public ResponseEntity<List<FacturaResponse>> listarTodas() {
        return ResponseEntity.ok(facturaService.listarTodas());
    }

    @PatchMapping("/{id}/anular")
    public ResponseEntity<FacturaResponse> anular(@PathVariable Long id,
                                                   @RequestParam String motivo) {
        return ResponseEntity.ok(facturaService.anular(id, motivo));
    }

    @GetMapping("/resumen-diario")
    public ResponseEntity<Map<String, Object>> resumenDiario() {
        return ResponseEntity.ok(facturaService.obtenerResumenDiario());
    }
}
