import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Inventario, MovimientoRequest } from '../models/inventario.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private apiV1Url = `${environment.apiV1Url}/inventario`;
  private apiUrl = `${environment.apiUrl}/inventario`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(this.apiV1Url).pipe(
      catchError(() => this.http.get<Inventario[]>(this.apiUrl))
    );
  }

  obtenerPorProducto(productoId: number): Observable<Inventario> {
    return this.http.get<Inventario>(`${this.apiV1Url}/producto/${productoId}`).pipe(
      catchError(() => this.http.get<Inventario>(`${this.apiUrl}/producto/${productoId}`))
    );
  }

  entradaStock(req: MovimientoRequest): Observable<Inventario> {
    return this.http.post<Inventario>(`${this.apiV1Url}/entrada`, req).pipe(
      catchError(() => this.http.post<Inventario>(`${this.apiUrl}/entrada`, req))
    );
  }

  ajusteStock(req: MovimientoRequest): Observable<Inventario> {
    return this.http.post<Inventario>(`${this.apiV1Url}/ajuste`, req).pipe(
      catchError(() => this.http.post<Inventario>(`${this.apiUrl}/ajuste`, req))
    );
  }

  historialMovimientos(inventarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiV1Url}/movimientos/${inventarioId}`).pipe(
      catchError(() => this.http.get<any[]>(`${this.apiUrl}/movimientos/${inventarioId}`))
    );
  }
}
