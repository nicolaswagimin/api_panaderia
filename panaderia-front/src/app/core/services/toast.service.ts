import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(mensaje: string, tipo: ToastType = 'info', duracion = 3500): void {
    const id = ++this.counter;
    const toasts = [...this.toastsSubject.value, { id, mensaje, tipo }];
    this.toastsSubject.next(toasts);
    setTimeout(() => this.remove(id), duracion);
  }

  exito(mensaje: string): void { this.show(mensaje, 'success'); }
  error(mensaje: string): void { this.show(mensaje, 'error', 5000); }
  info(mensaje: string): void { this.show(mensaje, 'info'); }

  remove(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
