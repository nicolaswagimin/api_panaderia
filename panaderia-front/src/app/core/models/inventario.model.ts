export interface Inventario {
  id?: number;
  productoNombre?: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  ubicacion?: string;
}

export interface MovimientoRequest {
  productoId: number;
  cantidad: number;
  motivo: string;
}
