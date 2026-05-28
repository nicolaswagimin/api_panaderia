import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP — Patrón Interceptor (Angular).
 * Se ejecuta automáticamente en CADA petición HTTP saliente.
 * Agrega el token JWT en el header Authorization antes de enviar,
 * para que el backend pueda autenticar la petición.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // El login no necesita token (es quien lo genera)
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getToken(); // obtiene JWT del localStorage

  if (token) {
    // Clona la petición (inmutable) y agrega el header de autenticación
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned); // continúa con la petición modificada
  }

  return next(req); // sin token: la petición sigue sin Authorization
};
