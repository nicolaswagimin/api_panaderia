package com.panaderia.api.controller;

import com.panaderia.api.model.Cliente;
import com.panaderia.api.repository.ClienteRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteRepository clienteRepository;

    @GetMapping
    public List<Cliente> listar() {
        return clienteRepository.findAllActive();
    }

    @GetMapping("/buscar")
    public List<Cliente> buscar(@RequestParam String nombre) {
        return clienteRepository.buscarPorNombre(nombre);
    }

    @PostMapping
    public ResponseEntity<Cliente> crear(@Valid @RequestBody Cliente cliente) {
        cliente.setActivo(true);
        return ResponseEntity.ok(clienteRepository.save(cliente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> actualizar(@PathVariable Long id,
                                              @Valid @RequestBody Cliente request) {
        return clienteRepository.findById(id)
                .map(c -> {
                    c.setNombre(request.getNombre());
                    c.setDocumento(request.getDocumento());
                    c.setTelefono(request.getTelefono());
                    c.setEmail(request.getEmail());
                    return ResponseEntity.ok(clienteRepository.save(c));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        clienteRepository.findById(id).ifPresent(c -> {
            c.setActivo(false);
            clienteRepository.save(c);
        });
        return ResponseEntity.ok().build();
    }
}
