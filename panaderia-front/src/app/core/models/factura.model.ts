export interface DetalleFacturaRequest {
  productoId: number;
  cantidad: number;
}

export interface FacturaRequest {
  clienteId?: number;
  detalles: DetalleFacturaRequest[];
}

export interface DetalleFacturaResponse {
  id: number;
  productoId: number;
  productoDescripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface FacturaResponse {
  id: number;
  numeroFactura: string;
  clienteNombre: string;
  fechaFactura: string;
  total: number;
  activo?: boolean;
  detalles: DetalleFacturaResponse[];
}
