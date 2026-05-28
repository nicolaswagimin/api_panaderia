package com.panaderia.api.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

/**
 * ============================================================
 * FILTRO JWT - INTERCEPTA CADA PETICION HTTP
 * ============================================================
 *
 * OncePerRequestFilter garantiza que este filtro se ejecute
 * UNA SOLA VEZ por cada peticion HTTP que llegue al servidor.
 *
 * ORDEN DE EJECUCION en cada peticion:
 *   1. El cliente envia: GET /api/v1/productos
 *      con header: Authorization: Bearer eyJhbGci...
 *
 *   2. JwtFilter intercepta ANTES de que llegue al Controller
 *
 *   3. Extrae el token del header Authorization
 *
 *   4. Llama a JwtUtil.validarToken() para verificarlo
 *
 *   5. Si es valido:
 *      - Extrae el username del token
 *      - Crea un objeto de autenticacion
 *      - Lo registra en el SecurityContext
 *      - Spring Security sabe que el usuario es valido
 *
 *   6. Si no es valido o no hay token:
 *      - No registra autenticacion
 *      - Spring Security bloqueara la peticion con HTTP 403
 *
 *   7. chain.doFilter() pasa la peticion al siguiente componente
 *      (ya sea el Controller o el bloqueo de seguridad)
 * ============================================================
 */
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {

        // Lee el header "Authorization" de la peticion HTTP
        String header = request.getHeader("Authorization");

        // El token debe venir con el prefijo "Bearer "
        // Ejemplo: "Bearer eyJhbGciOiJIUzI1NiJ9..."
        if (header != null && header.startsWith("Bearer ")) {
            // Elimina "Bearer " (7 caracteres) para quedarse solo con el token
            String token = header.substring(7);

            // Verifica que el token sea valido (no alterado, no vencido)
            if (jwtUtil.validarToken(token)) {
                // Extrae el username que esta guardado dentro del token
                String username = jwtUtil.obtenerUsername(token);

                // Crea el objeto de autenticacion que Spring Security entiende
                // null en el segundo parametro porque no necesitamos la contrasena
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER")));

                // Registra la autenticacion en el contexto de la peticion actual
                // Despues de esto, Spring Security permite el acceso
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        // Continua con el procesamiento de la peticion
        // (pasa al siguiente filtro o al Controller)
        chain.doFilter(request, response);
    }
}
