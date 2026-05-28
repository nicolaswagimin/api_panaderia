export interface Producto {
  id?: number;
  descripcion: string;
  precio: number;
  stockActual?: number;
  stockInicial?: number;
  activo?: boolean;
  fechaCreacion?: string;
}
