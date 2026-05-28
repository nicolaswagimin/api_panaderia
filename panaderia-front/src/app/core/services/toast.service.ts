import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: ToastType;
}

/**
 * Servicio de notificaciones no bloqueantes (Toasts).
 * Usa BehaviorSubject (patrón Observable) para emitir la lista
 * de toasts activos. El LayoutComponent se suscribe y los muestra.
 * Los toasts se eliminan automáticamente después de un tiempo.
 */
@Injectable({ providedIn: 'root' }) // singleton: una sola instancia en toda la app
export class ToastService {
  private counter = 0; // ID único por toast para poder eliminarlo
  private toastsSubject = new BehaviorSubject<Toast[]>([]); // estado reactivo
  toasts$ = this.toastsSubject.asObservable(); // expuesto como Observable (solo lectura)

  show(mensaje: string, tipo: ToastType = 'info', duracion = 3500): void {
    const id = ++this.counter;
    // Agrega el nuevo toast sin mutar el array anterior (inmutabilidad)
    this.toastsSubject.next([...this.toastsSubject.value, { id, mensaje, tipo }]);
    setTimeout(() => this.remove(id), duracion); // auto-elimina tras la duración
  }

  exito(mensaje: string): void { this.show(mensaje, 'success'); }
  error(mensaje: string): void { this.show(mensaje, 'error', 5000); }
  info(mensaje: string): void  { this.show(mensaje, 'info'); }

  remove(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
