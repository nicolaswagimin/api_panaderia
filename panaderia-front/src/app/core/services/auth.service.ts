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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiV1Url}/auth`;
  private usuarioSubject = new BehaviorSubject<AuthResponse | null>(this.cargarUsuario());
  usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<Partial<AuthResponse>>(`${this.apiUrl}/login`, { username, password }).pipe(
      map((res) => {
        if (!res.token) {
          throw new Error('Respuesta de login invalida');
        }
        const usuario: AuthResponse = {
          token: res.token,
          username: res.username || username,
          rol: res.rol || 'USUARIO',
          nombre: res.nombre || res.username || username
        };
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuarioSubject.next(usuario);
        return usuario;
      }),
      catchError((error) => {
        this.limpiarSesion();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.usuarioSubject.value;
  }

  getUsuario(): AuthResponse | null {
    return this.usuarioSubject.value;
  }

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

  private limpiarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioSubject.next(null);
  }
}
