package com.panaderia.api.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.SecureDigestAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.Date;
import javax.crypto.SecretKey;

/**
 * ============================================================
 * JWT UTILITY - AUTENTICACION SIN SESION
 * ============================================================
 *
 * JWT = JSON Web Token. Es una cadena codificada que contiene
 * informacion del usuario y una firma digital para verificar
 * que no fue alterado.
 *
 * Estructura del token:
 *   HEADER.PAYLOAD.SIGNATURE
 *   eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.xyz
 *
 * El PAYLOAD contiene:
 *   - subject: el username del usuario (ej: "admin")
 *   - rol: el rol del usuario (ej: "ADMIN")
 *   - issuedAt: cuando se genero
 *   - expiration: cuando vence (24 horas)
 *
 * FLUJO:
 *   1. Usuario hace login con usuario/password
 *   2. AuthController llama a generarToken() -> retorna el JWT
 *   3. El frontend guarda ese token en localStorage
 *   4. En cada peticion, el frontend envia el token en el header:
 *      Authorization: Bearer eyJhbGci...
 *   5. JwtFilter llama a validarToken() para verificarlo
 *   6. Si es valido, Spring Security autoriza la peticion
 *
 * VENTAJA sobre sesiones tradicionales:
 *   El servidor NO guarda ninguna sesion. El token se valida
 *   matematicamente con la clave secreta. Esto es STATELESS.
 * ============================================================
 */
@Component
public class JwtUtil {

    // Algoritmo de firma: HMAC-SHA256
    private static final SecureDigestAlgorithm<SecretKey, SecretKey> JWT_ALGORITHM = Jwts.SIG.HS256;

    // Clave secreta leida desde application.properties
    // En produccion se inyecta desde variable de entorno JWT_SECRET
    @Value("${jwt.secret}")
    private String secret;

    // Tiempo de expiracion en milisegundos (86400000 = 24 horas)
    @Value("${jwt.expiration}")
    private long expiration;

    // Convierte el string secreto en una clave criptografica segura
    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Genera un token JWT firmado con la clave secreta.
     * Se llama una sola vez al hacer login exitoso.
     *
     * @param username nombre de usuario autenticado
     * @param rol      rol del usuario (ADMIN, CAJERO, BODEGUERO)
     * @return token JWT como string (se envia al frontend)
     */
    public String generarToken(String username, String rol) {
        return Jwts.builder()
                .subject(username)                                          // quien es el usuario
                .claim("rol", rol)                                          // dato extra en el token
                .issuedAt(new Date())                                       // cuando se creo
                .expiration(new Date(System.currentTimeMillis() + expiration)) // cuando vence
                .signWith(getKey(), JWT_ALGORITHM)                          // firma digital
                .compact();                                                 // convierte a String
    }

    /**
     * Extrae el username del token.
     * Se usa en JwtFilter para saber que usuario hizo la peticion.
     *
     * @param token el JWT recibido en el header Authorization
     * @return username guardado en el token
     */
    public String obtenerUsername(String token) {
        return Jwts.parser()
                .verifyWith(getKey())      // verifica la firma
                .build()
                .parseSignedClaims(token)  // decodifica el token
                .getPayload()
                .getSubject();             // retorna el campo "subject" (username)
    }

    /**
     * Verifica si un token es valido (firma correcta y no vencido).
     * Si el token fue alterado o vencio, lanza JwtException y retorna false.
     *
     * @param token el JWT a verificar
     * @return true si es valido, false si esta alterado o vencido
     */
    public boolean validarToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token); // lanza excepcion si es invalido
            return true;
        } catch (JwtException e) {
            return false; // token invalido, alterado o vencido
        }
    }
}
