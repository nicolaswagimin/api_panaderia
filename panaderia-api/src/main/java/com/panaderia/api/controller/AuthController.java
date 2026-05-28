package com.panaderia.api.controller;

import com.panaderia.api.config.JwtUtil;
import com.panaderia.api.model.Usuario;
import com.panaderia.api.repository.UsuarioRepository;
import lombok.*;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        String username = creds.get("username");
        String password = creds.get("password");

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElse(null);

        if (usuario == null || !passwordEncoder.matches(password, usuario.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "Credenciales inválidas"));
        }

        String token = jwtUtil.generarToken(username, usuario.getRol().name());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", username,
                "rol", usuario.getRol().name(),
                "nombre", usuario.getNombre()
        ));
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody Usuario request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Username ya existe"));
        }
        request.setPassword(passwordEncoder.encode(request.getPassword()));
        usuarioRepository.save(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Usuario registrado exitosamente"));
    }
}
