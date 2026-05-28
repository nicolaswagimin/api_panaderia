import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  token: string;
  username: string;
  rol: string;
  nombre: string;
}

/**
 * ============================================================
 * SERVICIO DE AUTENTICACION - PATRON OBSERVABLE (RxJS)
 * ============================================================
 *
 * Gestiona todo lo relacionado con la sesion del usuario:
 *   - Hacer login y guardar el token JWT
 *   - Cerrar sesion y limpiar el localStorage
 *   - Verificar si el usuario esta autenticado
 *   - Exponer los datos del usuario a los componentes
 *
 * BehaviorSubject<AuthResponse | null>:
 *   Es un Observable especial que:
 *   1. Siempre tiene un valor (el usuario actual o null)
 *   2. Emite el valor actual a cualquier componente que se suscriba
 *   3. Cuando el usuario hace login, emite los nuevos datos
 *   4. Cuando el usuario hace logout, emite null
 *
 * Esto es el PATRON OBSERVABLE: los componentes "observan" el estado
 * del usuario y reaccionan cuando cambia, sin necesidad de consultar
 * directamente al servidor.
 *
 * EJEMPLO DE USO EN COMPONENTES:
 *   // El LayoutComponent muestra el nombre del usuario reactivamente
 *   usuario$ = this.auth.usuario$;
 *   // En el HTML: {{ usuario$ | async as u }} -> {{ u.nombre }}
 *
 * FLUJO DE LOGIN:
 *   1. LoginComponent llama auth.login(usuario, password)
 *   2. Se hace POST /api/v1/auth/login al backend
 *   3. El backend valida y retorna { token, username, rol, nombre }
 *   4. Se guarda el token en localStorage (persiste aunque se recargue)
 *   5. Se emite el usuario por el BehaviorSubject
 *   6. El Router navega al Dashboard
 * ============================================================
 */
@Injectable({ providedIn: 'root' }) // singleton: una sola instancia en toda la app
export class AuthService {

  private apiUrl = `${environment.apiV1Url}/auth`;

  // BehaviorSubject: mantiene el ultimo valor emitido
  // Se inicializa con el usuario del localStorage (si hay sesion guardada)
  private usuarioSubject = new BehaviorSubject<AuthResponse | null>(this.cargarUsuario());

  // Observable publico: los componentes se suscriben aqui (solo lectura)
  usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Envia las credenciales al backend y guarda la sesion si son correctas.
   * Retorna un Observable para que el componente sepa cuando termina.
   */
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<Partial<AuthResponse>>(`${this.apiUrl}/login`, { username, password }).pipe(
      map((res) => {
        if (!res.token) throw new Error('Respuesta de login invalida');

        const usuario: AuthResponse = {
          token:    res.token,
          username: res.username || username,
          rol:      res.rol      || 'USUARIO',
          nombre:   res.nombre   || username
        };

        // Guarda en localStorage para que persista al recargar la pagina
        localStorage.setItem('token',   res.token);
        localStorage.setItem('usuario', JSON.stringify(usuario));

        // Notifica a todos los componentes suscritos que hay un usuario
        this.usuarioSubject.next(usuario);
        return usuario;
      }),
      catchError((error) => {
        this.limpiarSesion(); // si falla, limpia cualquier dato previo
        return throwError(() => error);
      })
    );
  }

  /** Cierra la sesion: borra el localStorage y navega al login */
  logout(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }

  /** Retorna el token JWT guardado en localStorage */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /** Verifica si hay token Y usuario activo en memoria */
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.usuarioSubject.value;
  }

  /** Retorna el objeto usuario actual (sin suscripcion) */
  getUsuario(): AuthResponse | null {
    return this.usuarioSubject.value;
  }

  /**
   * Carga el usuario desde localStorage al iniciar la app.
   * Si el usuario recarga la pagina, su sesion se recupera automaticamente.
   */
  private cargarUsuario(): AuthResponse | null {
    const data = localStorage.getItem('usuario');
    if (!data) return null;
    try {
      return JSON.parse(data) as AuthResponse;
    } catch {
      this.limpiarSesion();
      return null;
    }
  }

  /** Elimina token y usuario del localStorage y del BehaviorSubject */
  private limpiarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioSubject.next(null); // notifica que ya no hay usuario
  }
}
