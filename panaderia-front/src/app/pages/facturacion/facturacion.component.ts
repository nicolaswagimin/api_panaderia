import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { FacturaService } from '../../core/services/factura.service';
import { ProductoService } from '../../core/services/producto.service';
import { ClienteService } from '../../core/services/cliente.service';
import { ToastService } from '../../core/services/toast.service';
import { FacturaRequest, FacturaResponse } from '../../core/models/factura.model';
import { Producto } from '../../core/models/producto.model';
import { Cliente } from '../../core/models/cliente.model';
import { LucideAngularModule } from 'lucide-angular';

interface ItemCarrito {
  productoId: number;
  descripcion: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  stockDisponible: number;
}

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-text">
          <h2>Punto de Venta</h2>
          <p>Genera facturas y registra ventas al instante</p>
        </div>
      </div>

      <div class="pos-grid">
        <!-- Products Column -->
        <div class="products-column">
          <div class="search-bar">
            <lucide-icon name="search" [size]="16"></lucide-icon>
            <input type="text" placeholder="Buscar producto..." (input)="buscarProducto($event)">
          </div>

          <div *ngIf="cargandoProductos" class="loading-state">
            <div class="spinner"></div>
            <span>Cargando productos...</span>
          </div>

          <div *ngIf="!cargandoProductos" class="products-grid">
            <button *ngFor="let p of productosFiltrados" (click)="agregarAlCarrito(p)"
                    [disabled]="(p.stockActual || 0) === 0"
                    class="product-card">
              <div class="card-info">
                <span class="p-name">{{ p.descripcion }}</span>
                <span class="p-stock" [class.low]="(p.stockActual || 0) < 5" [class.empty]="(p.stockActual || 0) === 0">
                  {{ (p.stockActual || 0) === 0 ? 'Sin stock' : 'Stock: ' + p.stockActual }}
                </span>
              </div>
              <div class="card-footer">
                <span class="p-price">\${{ p.precio | number:'1.0-0' }}</span>
                <lucide-icon name="plus-circle" [size]="18"></lucide-icon>
              </div>
            </button>
            <div *ngIf="productosFiltrados.length === 0" class="no-products">
              No se encontraron productos
            </div>
          </div>
        </div>

        <!-- Checkout Column -->
        <div class="checkout-column">
          <div class="cart-card">
            <div class="cart-header">
              <lucide-icon name="shopping-cart" [size]="18"></lucide-icon>
              <h3>Carrito ({{ carrito.length }})</h3>
              <button *ngIf="carrito.length > 0" (click)="limpiarCarrito()" class="clear-btn">
                <lucide-icon name="x" [size]="14"></lucide-icon> Limpiar
              </button>
            </div>

            <div class="cliente-selector">
              <label>Cliente</label>
              <select [(ngModel)]="clienteId" class="simple-select">
                <option [ngValue]="undefined">Consumidor Final</option>
                <option *ngFor="let c of clientes" [ngValue]="c.id">{{ c.nombre }}</option>
              </select>
            </div>

            <div class="cart-items">
              <div *ngFor="let i of carrito; let idx = index" class="cart-item">
                <div class="item-header">
                  <span class="item-name">{{ i.descripcion }}</span>
                  <button (click)="quitarItem(idx)" class="remove-btn">
                    <lucide-icon name="x" [size]="12"></lucide-icon>
                  </button>
                </div>
                <div class="item-footer">
                  <div class="qty-control">
                    <button (click)="reducirCantidad(idx)" class="qty-btn">
                      <lucide-icon name="minus" [size]="12"></lucide-icon>
                    </button>
                    <span class="qty-num">{{ i.cantidad }}</span>
                    <button (click)="aumentarCantidad(idx)" class="qty-btn"
                            [disabled]="i.cantidad >= i.stockDisponible">
                      <lucide-icon name="plus" [size]="12"></lucide-icon>
                    </button>
                  </div>
                  <span class="item-total">\${{ i.subtotal | number:'1.0-0' }}</span>
                </div>
              </div>

              <div *ngIf="carrito.length === 0" class="cart-empty">
                <lucide-icon name="shopping-cart" [size]="28"></lucide-icon>
                <p>Carrito vacío</p>
                <span>Selecciona productos de la izquierda</span>
              </div>
            </div>

            <div class="cart-footer">
              <div class="total-row">
                <span>Total</span>
                <span class="total-amount">\${{ total | number:'1.0-0' }}</span>
              </div>
              <button class="pay-btn" (click)="facturar()" [disabled]="cargando || carrito.length === 0">
                <lucide-icon *ngIf="!cargando" name="check-circle" [size]="18"></lucide-icon>
                <div *ngIf="cargando" class="spinner-sm"></div>
                {{ cargando ? 'Procesando...' : 'Finalizar Venta' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- History Section -->
      <div class="history-section">
        <div class="section-header">
          <h3>Ventas Recientes</h3>
          <button (click)="cargarFacturas()" class="refresh-small">
            <lucide-icon name="refresh-cw" [size]="14"></lucide-icon>
          </button>
        </div>
        <div *ngIf="cargandoFacturas" class="loading-state" style="padding: 2rem;">
          <div class="spinner"></div>
        </div>
        <table *ngIf="!cargandoFacturas" class="simple-table">
          <thead>
            <tr>
              <th>Nº Factura</th>
              <th>Fecha y Hora</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let f of facturas" class="table-row" [class.anulada]="f.activo === false">
              <td class="font-bold">#{{ f.numeroFactura }}</td>
              <td class="text-muted">{{ f.fechaFactura | date:'dd/MM HH:mm' }}</td>
              <td>{{ f.clienteNombre }}</td>
              <td class="font-bold">\${{ f.total | number:'1.0-0' }}</td>
              <td>
                <span class="estado-badge" [class.anulada-badge]="f.activo === false">
                  {{ f.activo === false ? 'Anulada' : 'Activa' }}
                </span>
              </td>
              <td class="actions-cell">
                <button (click)="verDetalle(f)" class="action-btn" title="Ver detalle">
                  <lucide-icon name="eye" [size]="15"></lucide-icon>
                </button>
                <button (click)="imprimirFacturaDirecta(f)" class="action-btn" title="Imprimir">
                  <lucide-icon name="printer" [size]="15"></lucide-icon>
                </button>
                <button *ngIf="f.activo !== false" (click)="anularFactura(f.id!)" class="action-btn delete" title="Anular">
                  <lucide-icon name="trash-2" [size]="15"></lucide-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="facturas.length === 0">
              <td colspan="6" class="empty-state">No hay ventas registradas.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Detalle Modal -->
      <div class="modal-backdrop" *ngIf="mostrarDetalleModal" (click)="cerrarDetalleModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Factura #{{ facturaSeleccionada?.numeroFactura }}</h3>
              <span class="estado-badge" [class.anulada-badge]="facturaSeleccionada?.activo === false">
                {{ facturaSeleccionada?.activo === false ? 'Anulada' : 'Activa' }}
              </span>
            </div>
            <button (click)="cerrarDetalleModal()" class="close-btn">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>
          <div class="factura-meta">
            <div class="meta-item"><span class="meta-label">Cliente</span><span>{{ facturaSeleccionada?.clienteNombre }}</span></div>
            <div class="meta-item"><span class="meta-label">Fecha</span><span>{{ facturaSeleccionada?.fechaFactura | date:'medium' }}</span></div>
          </div>
          <div class="detalle-table-wrap">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of facturaSeleccionada?.detalles">
                  <td>{{ d.productoDescripcion }}</td>
                  <td>{{ d.cantidad }}</td>
                  <td>\${{ d.precioUnitario | number:'1.0-0' }}</td>
                  <td class="text-right font-bold">\${{ d.subtotal | number:'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="total-final">Total: \${{ facturaSeleccionada?.total | number:'1.0-0' }}</div>
          <div class="modal-footer-btns">
            <button (click)="imprimirFacturaDirecta(facturaSeleccionada!)" class="btn-print">
              <lucide-icon name="printer" [size]="16"></lucide-icon> Imprimir
            </button>
            <button (click)="cerrarDetalleModal()" class="btn-cancel">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .header-text h2 { margin: 0; font-size: 1.75rem; font-weight: 800; color: #2d2d2d; }
    .header-text p { margin: 0.25rem 0 0; color: #6b7280; font-size: 0.9rem; }

    .pos-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 1.5rem; align-items: start; }

    /* Product panel */
    .search-bar {
      display: flex; align-items: center; gap: 0.625rem; background: white;
      padding: 0.75rem 1rem; border-radius: 0.875rem; margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); color: #9ca3af;
    }
    .search-bar input { border: none; outline: none; width: 100%; font-size: 0.9rem; color: #2d2d2d; }

    .loading-state { display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: #9ca3af; font-weight: 600; }
    .spinner { width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #2d2d2d; border-radius: 50%; animation: spin 0.7s linear infinite; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 0.875rem; }
    .product-card {
      background: white; border: none; padding: 1.25rem; border-radius: 1.25rem; cursor: pointer;
      display: flex; flex-direction: column; justify-content: space-between;
      gap: 1.25rem; transition: all 0.2s; text-align: left;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.06);
    }
    .product-card:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px -4px rgb(0 0 0 / 0.12); }
    .product-card:disabled { opacity: 0.45; cursor: not-allowed; }

    .card-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .p-name { font-weight: 700; font-size: 0.95rem; color: #2d2d2d; }
    .p-stock { font-size: 0.75rem; color: #9ca3af; font-weight: 600; }
    .p-stock.low { color: #d97706; }
    .p-stock.empty { color: #ef4444; }

    .card-footer { display: flex; justify-content: space-between; align-items: center; color: #9ca3af; }
    .p-price { font-weight: 800; font-size: 1.15rem; color: #2d2d2d; }

    .no-products { text-align: center; padding: 3rem; color: #9ca3af; font-style: italic; }

    /* Cart */
    .cart-card {
      background: white; border-radius: 1.5rem; padding: 1.5rem;
      display: flex; flex-direction: column; gap: 1.25rem; position: sticky; top: 1rem;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.06);
    }
    .cart-header { display: flex; align-items: center; gap: 0.625rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 1rem; }
    .cart-header h3 { margin: 0; font-size: 1rem; font-weight: 800; flex: 1; }
    .clear-btn { display: flex; align-items: center; gap: 0.3rem; background: #fef2f2; color: #ef4444; border: none; padding: 0.35rem 0.6rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; }

    .cliente-selector { display: flex; flex-direction: column; gap: 0.35rem; }
    .cliente-selector label { font-size: 0.75rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; }
    .simple-select { background: #f8f9fa; border: 1px solid #e5e7eb; padding: 0.6rem 0.75rem; border-radius: 0.75rem; outline: none; font-weight: 600; font-size: 0.875rem; width: 100%; }

    .cart-items { display: flex; flex-direction: column; gap: 0.625rem; max-height: 340px; overflow-y: auto; }
    .cart-item { background: #f8f9fa; padding: 0.875rem; border-radius: 0.875rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .item-header { display: flex; align-items: center; gap: 0.5rem; }
    .item-name { font-weight: 700; color: #2d2d2d; font-size: 0.875rem; flex: 1; }
    .remove-btn { background: none; border: none; cursor: pointer; color: #9ca3af; padding: 0.2rem; display: flex; }
    .remove-btn:hover { color: #ef4444; }

    .item-footer { display: flex; justify-content: space-between; align-items: center; }
    .qty-control { display: flex; align-items: center; gap: 0.625rem; background: white; padding: 0.2rem 0.4rem; border-radius: 0.5rem; }
    .qty-btn { background: none; border: none; cursor: pointer; color: #4b5563; display: flex; align-items: center; padding: 0.15rem; }
    .qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .qty-num { font-weight: 800; min-width: 18px; text-align: center; font-size: 0.875rem; }
    .item-total { font-weight: 800; color: #2d2d2d; font-size: 0.9rem; }

    .cart-empty { text-align: center; padding: 2rem 0; color: #9ca3af; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .cart-empty p { margin: 0; font-weight: 700; font-size: 0.95rem; }
    .cart-empty span { font-size: 0.8rem; }

    .cart-footer { border-top: 1px solid #f3f4f6; padding-top: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-row span { color: #6b7280; font-weight: 600; font-size: 0.875rem; }
    .total-amount { font-size: 1.75rem; font-weight: 900; color: #2d2d2d; }

    .pay-btn {
      background: #2d2d2d; color: white; border: none; padding: 1rem;
      border-radius: 1rem; font-weight: 800; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.625rem; transition: background 0.15s;
    }
    .pay-btn:hover:not(:disabled) { background: #111827; }
    .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* History */
    .history-section { background: white; border-radius: 1.5rem; overflow: hidden; box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); }
    .section-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 0.75rem; }
    .section-header h3 { margin: 0; font-size: 1rem; font-weight: 800; flex: 1; }
    .refresh-small { background: none; border: none; cursor: pointer; color: #9ca3af; padding: 0.3rem; display: flex; border-radius: 0.5rem; transition: background 0.15s; }
    .refresh-small:hover { background: #f3f1ee; color: #2d2d2d; }

    .simple-table { width: 100%; border-collapse: collapse; }
    .simple-table th { text-align: left; padding: 0.875rem 1.5rem; color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .table-row td { padding: 0.875rem 1.5rem; font-size: 0.875rem; border-bottom: 1px solid #f9fafb; }
    .table-row:hover td { background: #fafafa; }
    .table-row.anulada td { opacity: 0.5; }
    .text-right { text-align: right; }
    .text-muted { color: #9ca3af; }
    .font-bold { font-weight: 700; }

    .estado-badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; background: #f0fdf4; color: #15803d; }
    .anulada-badge { background: #fef2f2; color: #ef4444; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 0.3rem; }
    .action-btn { width: 28px; height: 28px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; color: #9ca3af; transition: all 0.15s; }
    .action-btn:hover { background: #f3f1ee; color: #2d2d2d; }
    .action-btn.delete:hover { background: #fef2f2; color: #ef4444; }

    .empty-state { text-align: center; padding: 3rem; color: #9ca3af; }

    /* Detail Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .modal-content { background: white; width: 100%; max-width: 520px; border-radius: 2rem; padding: 2rem; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .modal-header h3 { margin: 0 0 0.375rem; font-size: 1.25rem; font-weight: 800; }
    .close-btn { background: none; border: none; cursor: pointer; color: #9ca3af; }

    .factura-meta { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.25rem; padding: 0.875rem; background: #f8f9fa; border-radius: 0.875rem; }
    .meta-item { display: flex; gap: 0.75rem; font-size: 0.875rem; }
    .meta-label { font-weight: 700; color: #6b7280; min-width: 60px; }

    .detalle-table-wrap { border: 1px solid #f3f4f6; border-radius: 0.875rem; overflow: hidden; max-height: 240px; overflow-y: auto; margin-bottom: 1.25rem; }
    .total-final { text-align: right; font-size: 1.25rem; font-weight: 900; color: #2d2d2d; margin-bottom: 1.25rem; }
    .modal-footer-btns { display: flex; gap: 0.75rem; }
    .btn-print { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem; border-radius: 0.875rem; border: 2px solid #2d2d2d; background: white; color: #2d2d2d; font-weight: 700; cursor: pointer; }
    .btn-cancel { flex: 1; padding: 0.875rem; border-radius: 0.875rem; border: none; background: #f3f1ee; font-weight: 600; cursor: pointer; }

    @media (max-width: 1024px) { .pos-grid { grid-template-columns: 1fr; } }
  `]
})
export class FacturacionComponent implements OnInit {
  private facturaService = inject(FacturaService);
  private productoService = inject(ProductoService);
  private clienteService = inject(ClienteService);
  private toast = inject(ToastService);

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  facturas: FacturaResponse[] = [];
  clientes: Cliente[] = [];
  carrito: ItemCarrito[] = [];
  cargando = false;
  cargandoProductos = true;
  cargandoFacturas = true;
  total = 0;
  clienteId?: number;
  mostrarDetalleModal = false;
  facturaSeleccionada?: FacturaResponse;

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarFacturas();
    this.cargarClientes();
  }

  cargarDatos(): void {
    this.cargandoProductos = true;
    this.productoService.listar().pipe(
      finalize(() => (this.cargandoProductos = false))
    ).subscribe({
      next: (p) => {
        this.productos = p;
        this.productosFiltrados = p;
      },
      error: () => this.toast.error('Error al cargar los productos.')
    });
  }

  cargarFacturas(): void {
    this.cargandoFacturas = true;
    this.facturaService.listar().pipe(
      finalize(() => (this.cargandoFacturas = false))
    ).subscribe({
      next: (f) => (this.facturas = f),
      error: () => this.toast.error('Error al cargar las facturas.')
    });
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: (c) => (this.clientes = c)
    });
  }

  buscarProducto(event: Event): void {
    const t = (event.target as HTMLInputElement).value.toLowerCase();
    this.productosFiltrados = t
      ? this.productos.filter(p => p.descripcion.toLowerCase().includes(t))
      : this.productos;
  }

  agregarAlCarrito(producto: Producto): void {
    if ((producto.stockActual || 0) === 0) return;
    const existente = this.carrito.find(i => i.productoId === producto.id);
    if (existente) {
      if (existente.cantidad >= existente.stockDisponible) {
        this.toast.info('No hay más stock disponible para este producto.');
        return;
      }
      existente.cantidad++;
      existente.subtotal = existente.cantidad * existente.precio;
    } else {
      this.carrito.push({
        productoId: producto.id!,
        descripcion: producto.descripcion,
        precio: producto.precio,
        cantidad: 1,
        subtotal: producto.precio,
        stockDisponible: producto.stockActual || 0
      });
    }
    this.calcularTotales();
  }

  aumentarCantidad(i: number): void {
    const item = this.carrito[i];
    if (item.cantidad >= item.stockDisponible) return;
    item.cantidad++;
    item.subtotal = item.cantidad * item.precio;
    this.calcularTotales();
  }

  reducirCantidad(i: number): void {
    if (this.carrito[i].cantidad > 1) {
      this.carrito[i].cantidad--;
      this.carrito[i].subtotal = this.carrito[i].cantidad * this.carrito[i].precio;
    } else {
      this.carrito.splice(i, 1);
    }
    this.calcularTotales();
  }

  quitarItem(i: number): void {
    this.carrito.splice(i, 1);
    this.calcularTotales();
  }

  limpiarCarrito(): void {
    this.carrito = [];
    this.clienteId = undefined;
    this.calcularTotales();
  }

  calcularTotales(): void {
    this.total = this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }

  facturar(): void {
    if (this.carrito.length === 0 || this.cargando) return;
    this.cargando = true;
    const request: FacturaRequest = {
      clienteId: this.clienteId,
      detalles: this.carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad }))
    };
    this.facturaService.crear(request).pipe(
      finalize(() => (this.cargando = false))
    ).subscribe({
      next: (factura) => {
        this.toast.exito(`Venta registrada: Factura #${factura.numeroFactura}`);
        this.imprimirFacturaDirecta(factura);
        this.limpiarCarrito();
        this.cargarFacturas();
        this.cargarDatos();
      },
      error: (err) => {
        const msg = err?.error?.mensaje || err?.error?.message || 'Error al generar la factura.';
        this.toast.error(msg);
      }
    });
  }

  imprimirFacturaDirecta(factura: FacturaResponse): void {
    const fecha = new Date(factura.fechaFactura).toLocaleString('es-CO');
    const filas = (factura.detalles || []).map(d =>
      `<tr>
        <td style="padding:6px 8px;">${d.productoDescripcion}</td>
        <td style="padding:6px 8px;text-align:center;">${d.cantidad}</td>
        <td style="padding:6px 8px;text-align:right;">$${Number(d.precioUnitario).toLocaleString('es-CO')}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;">$${Number(d.subtotal).toLocaleString('es-CO')}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Factura #${factura.numeroFactura}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; max-width: 320px; margin: 0 auto; padding: 20px; font-size: 13px; }
    .header { text-align: center; margin-bottom: 16px; border-bottom: 2px dashed #000; padding-bottom: 12px; }
    .header h1 { font-size: 20px; font-weight: 900; }
    .header p { color: #444; font-size: 11px; margin-top: 4px; }
    .info { margin: 12px 0; display: flex; flex-direction: column; gap: 4px; }
    .info-row { display: flex; justify-content: space-between; }
    .info-row span:first-child { color: #666; }
    .info-row span:last-child { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    thead tr { border-bottom: 1px solid #000; }
    thead th { padding: 6px 8px; font-size: 11px; text-align: left; text-transform: uppercase; }
    thead th:not(:first-child) { text-align: right; }
    tbody tr { border-bottom: 1px dotted #ccc; }
    .total { text-align: right; font-size: 16px; font-weight: 900; border-top: 2px solid #000; padding-top: 10px; margin-top: 4px; }
    .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #666; border-top: 2px dashed #000; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🥖 PANADERÍA PRO</h1>
    <p>Sistema de Gestión</p>
  </div>
  <div class="info">
    <div class="info-row"><span>Factura</span><span>#${factura.numeroFactura}</span></div>
    <div class="info-row"><span>Fecha</span><span>${fecha}</span></div>
    <div class="info-row"><span>Cliente</span><span>${factura.clienteNombre}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center;">Cant.</th>
        <th style="text-align:right;">P.Unit</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="total">TOTAL: $${Number(factura.total).toLocaleString('es-CO')}</div>
  <div class="footer"><p>¡Gracias por su compra!</p><p>Vuelva pronto</p></div>
</body>
</html>`;

    const ventana = window.open('', '_blank', 'width=420,height=650,scrollbars=yes');
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      ventana.onload = () => ventana.print();
    }
  }

  verDetalle(factura: FacturaResponse): void {
    this.facturaSeleccionada = factura;
    this.mostrarDetalleModal = true;
  }

  cerrarDetalleModal(): void {
    this.mostrarDetalleModal = false;
    this.facturaSeleccionada = undefined;
  }

  anularFactura(id: number): void {
    if (!confirm('¿Anular esta factura? El stock de los productos será devuelto al inventario.')) return;
    this.facturaService.anular(id, 'Anulado desde punto de venta').subscribe({
      next: () => {
        this.toast.exito('Factura anulada y stock restituido.');
        this.cargarFacturas();
        this.cargarDatos();
      },
      error: (err) => {
        const msg = err?.error?.mensaje || 'Error al anular la factura.';
        this.toast.error(msg);
      }
    });
  }
}
