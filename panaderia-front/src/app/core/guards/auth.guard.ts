import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de rutas — Protección de acceso (Angular).
 * Se ejecuta antes de activar una ruta protegida.
 * Si el usuario no está autenticado, redirige al login.
 * Definido en app.routes.ts con canActivate: [authGuard].
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true; // permite el acceso a la ruta
  }

  return router.createUrlTree(['/login']); // redirige al login si no hay sesión
};
