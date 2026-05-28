import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FacturaRequest, FacturaResponse } from '../models/factura.model';

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private apiUrl = `${environment.apiV1Url}/facturas`;

  constructor(private http: HttpClient) {}

  crear(factura: FacturaRequest): Observable<FacturaResponse> {
    return this.http.post<FacturaResponse>(this.apiUrl, factura);
  }

  listar(): Observable<FacturaResponse[]> {
    return this.http.get<FacturaResponse[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<FacturaResponse> {
    return this.http.get<FacturaResponse>(`${this.apiUrl}/${id}`);
  }

  buscarPorNumero(numero: string): Observable<FacturaResponse> {
    return this.http.get<FacturaResponse>(`${this.apiUrl}/numero/${numero}`);
  }

  anular(id: number, motivo: string): Observable<FacturaResponse> {
    return this.http.patch<FacturaResponse>(`${this.apiUrl}/${id}/anular`, null, {
      params: new HttpParams().set('motivo', motivo)
    });
  }

  resumenDiario(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumen-diario`);
  }
}
