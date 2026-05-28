import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * ============================================================
 * INTERCEPTOR HTTP - AGREGA EL TOKEN JWT A CADA PETICION
 * ============================================================
 *
 * Un interceptor es un middleware del cliente HTTP de Angular.
 * Se ejecuta AUTOMATICAMENTE antes de cada peticion HTTP
 * que haga cualquier servicio (ProductoService, FacturaService, etc.)
 *
 * SIN interceptor: cada servicio tendria que agregar el token manualmente
 *   this.http.get(url, { headers: { Authorization: 'Bearer ' + token } })
 *
 * CON interceptor: se agrega una sola vez aqui y aplica a TODAS las peticiones
 *
 * FLUJO DE UNA PETICION:
 *   1. ProductoService llama: this.http.get('/api/v1/productos')
 *   2. Angular pasa la peticion por este interceptor PRIMERO
 *   3. El interceptor lee el token del localStorage
 *   4. Clona la peticion y le agrega el header Authorization
 *   5. Envia la peticion modificada al servidor
 *   6. Spring Boot - JwtFilter recibe y valida el token
 *   7. Si el token es valido, el Controller responde con los datos
 *
 * NOTA: las peticiones al login NO llevan token porque es quien
 * genera el token. Si enviamos token en el login, podria causar
 * conflictos si hay un token vencido guardado.
 * ============================================================
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // El endpoint de login no necesita token (es publico)
  if (req.url.includes('/auth/login')) {
    return next(req); // deja pasar sin modificar
  }

  const authService = inject(AuthService);
  const token = authService.getToken(); // lee el JWT del localStorage

  if (token) {
    // Las peticiones HTTP son INMUTABLES en Angular
    // Por eso se "clona" la peticion con los nuevos headers
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
        // El servidor recibe: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
      }
    });
    return next(cloned); // envia la peticion con el token
  }

  // Si no hay token, la peticion sigue sin Authorization
  // El servidor respondera con HTTP 401 o 403
  return next(req);
};
