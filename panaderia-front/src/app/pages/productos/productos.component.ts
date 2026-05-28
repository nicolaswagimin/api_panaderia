import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProductoService } from '../../core/services/producto.service';
import { ToastService } from '../../core/services/toast.service';
import { Producto } from '../../core/models/producto.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-text">
          <h2>Inventario</h2>
          <p>{{ productos.length }} productos • {{ stockBajoCount }} con stock bajo</p>
        </div>
        <button (click)="abrirModal()" class="add-btn">
          <lucide-icon name="plus" [size]="18"></lucide-icon>
          Nuevo Producto
        </button>
      </div>

      <!-- Search -->
      <div class="search-row">
        <div class="search-field">
          <lucide-icon name="search" [size]="16"></lucide-icon>
          <input type="text" placeholder="Buscar producto..." (input)="buscar($event)">
        </div>
        <div class="filter-pills">
          <button (click)="filtro = 'todos'; aplicarFiltro()" class="pill" [class.active]="filtro === 'todos'">Todos</button>
          <button (click)="filtro = 'bajo'; aplicarFiltro()" class="pill" [class.active]="filtro === 'bajo'">Stock bajo</button>
          <button (click)="filtro = 'sin'; aplicarFiltro()" class="pill" [class.active]="filtro === 'sin'">Sin stock</button>
        </div>
      </div>

      <div class="inventory-list">
        <!-- Loading -->
        <div *ngIf="cargandoLista" class="loading-state">
          <div class="spinner"></div>
          <span>Cargando productos...</span>
        </div>

        <table *ngIf="!cargandoLista" class="simple-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Existencias</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of productosFiltrados" class="table-row">
              <td>
                <span class="product-name">{{ p.descripcion }}</span>
              </td>
              <td>
                <span class="price-tag">\${{ p.precio | number:'1.0-0' }}</span>
              </td>
              <td>
                <div class="stock-cell">
                  <span class="stock-number" [class.low]="(p.stockActual || 0) < 5 && (p.stockActual || 0) > 0" [class.empty]="(p.stockActual || 0) === 0">
                    {{ p.stockActual }} uds
                  </span>
                  <span class="stock-warn" *ngIf="(p.stockActual || 0) === 0">Sin stock</span>
                  <span class="stock-warn low" *ngIf="(p.stockActual || 0) > 0 && (p.stockActual || 0) < 5">Stock bajo</span>
                </div>
              </td>
              <td class="actions-cell">
                <button (click)="abrirStockModal(p)" class="action-btn stock" title="Ajustar stock">
                  <lucide-icon name="arrow-up" [size]="15"></lucide-icon>
                </button>
                <button (click)="editar(p)" class="action-btn edit" title="Editar">
                  <lucide-icon name="edit-2" [size]="15"></lucide-icon>
                </button>
                <button (click)="eliminar(p.id!)" class="action-btn delete" title="Eliminar">
                  <lucide-icon name="trash-2" [size]="15"></lucide-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="productosFiltrados.length === 0">
              <td colspan="4" class="empty-state">
                <lucide-icon name="package" [size]="32"></lucide-icon>
                <p>No se encontraron productos</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Producto Modal -->
    <div class="modal-backdrop" *ngIf="mostrarModal" (click)="cerrarModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editando ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
          <button (click)="cerrarModal()" class="close-btn">
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="guardar()" class="simple-form">
          <div class="form-group">
            <label>Descripción del Producto *</label>
            <input formControlName="descripcion" placeholder="Ej: Pan Blandito x10">
            <span class="field-error" *ngIf="campoInvalido('descripcion')">Campo obligatorio</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Precio de Venta *</label>
              <div class="input-icon">
                <span class="prefix">$</span>
                <input formControlName="precio" type="number" placeholder="0" min="0.01">
              </div>
              <span class="field-error" *ngIf="campoInvalido('precio')">Precio inválido</span>
            </div>
            <div class="form-group" *ngIf="!editando">
              <label>Cantidad Inicial</label>
              <input formControlName="stockInicial" type="number" placeholder="0" min="0">
            </div>
          </div>

          <div class="form-actions">
            <button type="button" (click)="cerrarModal()" class="btn-cancel">Cancelar</button>
            <button type="submit" [disabled]="cargando || form.invalid" class="btn-save">
              {{ cargando ? 'Guardando...' : 'Confirmar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Stock Modal -->
    <div class="modal-backdrop" *ngIf="mostrarStockModal" (click)="cerrarStockModal()">
      <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Ajustar Stock</h3>
          <button (click)="cerrarStockModal()" class="close-btn">
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>
        <p class="stock-product-name">{{ productoParaStock?.descripcion }}</p>
        <p class="stock-current">Stock actual: <strong>{{ productoParaStock?.stockActual }} unidades</strong></p>
        <div class="stock-controls">
          <div class="stock-type-tabs">
            <button (click)="tipoAjuste = 'agregar'" [class.active]="tipoAjuste === 'agregar'" class="tab-btn">
              <lucide-icon name="arrow-up" [size]="14"></lucide-icon> Agregar
            </button>
            <button (click)="tipoAjuste = 'reducir'" [class.active]="tipoAjuste === 'reducir'" class="tab-btn">
              <lucide-icon name="arrow-down" [size]="14"></lucide-icon> Reducir
            </button>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label>Cantidad a {{ tipoAjuste === 'agregar' ? 'agregar' : 'reducir' }}</label>
            <input [(ngModel)]="cantidadAjuste" type="number" min="1" placeholder="0" class="stock-input">
          </div>
        </div>
        <div class="form-actions">
          <button type="button" (click)="cerrarStockModal()" class="btn-cancel">Cancelar</button>
          <button (click)="confirmarAjusteStock()" [disabled]="cargandoStock || !cantidadAjuste || cantidadAjuste < 1" class="btn-save">
            {{ cargandoStock ? 'Guardando...' : 'Aplicar Ajuste' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .header-text h2 { margin: 0; font-size: 1.75rem; font-weight: 800; color: #2d2d2d; }
    .header-text p { margin: 0.25rem 0 0; color: #6b7280; font-size: 0.9rem; }

    .add-btn {
      background: #2d2d2d; color: white; border: none; padding: 0.7rem 1.25rem;
      border-radius: 0.875rem; font-weight: 600; cursor: pointer; display: flex;
      align-items: center; gap: 0.5rem; font-size: 0.9rem; transition: background 0.15s;
    }
    .add-btn:hover { background: #111827; }

    .search-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .search-field {
      display: flex; align-items: center; gap: 0.625rem; background: white;
      padding: 0.625rem 1rem; border-radius: 0.875rem; width: 260px;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); color: #9ca3af;
    }
    .search-field input { border: none; outline: none; width: 100%; font-size: 0.9rem; color: #2d2d2d; }

    .filter-pills { display: flex; gap: 0.5rem; }
    .pill {
      padding: 0.45rem 0.875rem; border-radius: 999px; border: 1px solid #e5e7eb;
      background: white; color: #6b7280; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .pill.active { background: #2d2d2d; color: white; border-color: #2d2d2d; }
    .pill:hover:not(.active) { border-color: #9ca3af; color: #374151; }

    .inventory-list { background: white; border-radius: 1.5rem; overflow: hidden; box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); }

    .loading-state { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 3rem; color: #9ca3af; font-weight: 600; }
    .spinner { width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #2d2d2d; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .simple-table { width: 100%; border-collapse: collapse; }
    .simple-table th { text-align: left; padding: 1rem 1.5rem; color: #9ca3af; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f3f4f6; }
    .table-row { border-bottom: 1px solid #f9fafb; transition: background 0.15s; }
    .table-row:last-child { border-bottom: none; }
    .table-row:hover { background: #fafafa; }
    .simple-table td { padding: 1rem 1.5rem; font-size: 0.9rem; }
    .text-right { text-align: right; }

    .product-name { font-weight: 700; color: #2d2d2d; }
    .price-tag { background: #f3f1ee; padding: 0.3rem 0.7rem; border-radius: 0.5rem; font-weight: 700; color: #2d2d2d; font-size: 0.875rem; }

    .stock-cell { display: flex; align-items: center; gap: 0.5rem; }
    .stock-number { font-weight: 700; color: #2d2d2d; }
    .stock-number.low { color: #d97706; }
    .stock-number.empty { color: #ef4444; }
    .stock-warn { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; background: #fef2f2; color: #ef4444; }
    .stock-warn.low { background: #fffbeb; color: #d97706; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 0.375rem; }
    .action-btn {
      width: 30px; height: 30px; border-radius: 7px; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s; background: transparent; color: #9ca3af;
    }
    .action-btn.stock:hover { background: #eff6ff; color: #2563eb; }
    .action-btn.edit:hover { background: #f3f1ee; color: #2d2d2d; }
    .action-btn.delete:hover { background: #fef2f2; color: #ef4444; }

    .empty-state { text-align: center; padding: 3.5rem; color: #9ca3af; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .empty-state p { margin: 0; font-weight: 600; }

    /* Modals */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .modal-content { background: white; width: 100%; max-width: 480px; border-radius: 2rem; padding: 2rem; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
    .modal-content.modal-sm { max-width: 380px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #2d2d2d; }
    .close-btn { background: none; border: none; cursor: pointer; color: #9ca3af; padding: 0.25rem; }
    .close-btn:hover { color: #2d2d2d; }

    .simple-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-weight: 600; font-size: 0.82rem; color: #4b5563; text-transform: uppercase; letter-spacing: 0.03em; }
    .form-group input { background: #f8f9fa; border: 1px solid #e5e7eb; padding: 0.75rem 1rem; border-radius: 0.75rem; font-size: 0.95rem; outline: none; transition: border-color 0.15s; }
    .form-group input:focus { border-color: #2d2d2d; }
    .input-icon { position: relative; }
    .prefix { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #9ca3af; font-weight: 700; }
    .input-icon input { padding-left: 1.75rem; }
    .field-error { color: #ef4444; font-size: 0.78rem; font-weight: 600; }

    .form-actions { display: flex; gap: 0.875rem; margin-top: 0.5rem; }
    .btn-cancel { flex: 1; padding: 0.875rem; border-radius: 0.875rem; border: none; background: #f3f1ee; font-weight: 600; cursor: pointer; color: #4b5563; }
    .btn-cancel:hover { background: #e5e7eb; }
    .btn-save { flex: 2; padding: 0.875rem; border-radius: 0.875rem; border: none; background: #2d2d2d; color: white; font-weight: 700; cursor: pointer; }
    .btn-save:hover:not(:disabled) { background: #111827; }
    .btn-save:disabled { opacity: 0.55; cursor: not-allowed; }

    /* Stock Modal */
    .stock-product-name { margin: 0 0 0.25rem; font-weight: 800; color: #2d2d2d; font-size: 1.05rem; }
    .stock-current { margin: 0 0 1.25rem; color: #6b7280; font-size: 0.9rem; }
    .stock-type-tabs { display: flex; gap: 0.5rem; }
    .tab-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      padding: 0.6rem; border-radius: 0.75rem; border: 1px solid #e5e7eb;
      background: white; color: #6b7280; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .tab-btn.active { background: #2d2d2d; color: white; border-color: #2d2d2d; }
    .stock-input { width: 100%; box-sizing: border-box; background: #f8f9fa; border: 1px solid #e5e7eb; padding: 0.75rem 1rem; border-radius: 0.75rem; font-size: 1rem; outline: none; }
    .stock-input:focus { border-color: #2d2d2d; }
  `]
})
export class ProductosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private toast = inject(ToastService);

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  form!: FormGroup;
  mostrarModal = false;
  mostrarStockModal = false;
  editando = false;
  editandoId?: number;
  cargando = false;
  cargandoLista = true;
  cargandoStock = false;
  filtro = 'todos';
  stockBajoCount = 0;
  productoParaStock?: Producto;
  tipoAjuste: 'agregar' | 'reducir' = 'agregar';
  cantidadAjuste: number = 1;

  ngOnInit(): void {
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      precio: [null, [Validators.required, Validators.min(0.01)]],
      stockInicial: [0, [Validators.min(0)]]
    });
    this.cargarDatos();
  }

  campoInvalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }

  cargarDatos(): void {
    this.cargandoLista = true;
    this.productoService.listar().pipe(
      finalize(() => (this.cargandoLista = false))
    ).subscribe({
      next: (p) => {
        this.productos = p;
        this.stockBajoCount = p.filter(x => (x.stockActual || 0) < 5).length;
        this.aplicarFiltro();
      },
      error: () => this.toast.error('Error al cargar los productos.')
    });
  }

  buscar(event: Event): void {
    const t = (event.target as HTMLInputElement).value.toLowerCase();
    const base = this.obtenerBase();
    this.productosFiltrados = t ? base.filter(p => p.descripcion.toLowerCase().includes(t)) : base;
  }

  aplicarFiltro(): void {
    this.productosFiltrados = this.obtenerBase();
  }

  private obtenerBase(): Producto[] {
    if (this.filtro === 'bajo') return this.productos.filter(p => (p.stockActual || 0) > 0 && (p.stockActual || 0) < 5);
    if (this.filtro === 'sin') return this.productos.filter(p => (p.stockActual || 0) === 0);
    return this.productos;
  }

  abrirModal(): void {
    this.editando = false;
    this.editandoId = undefined;
    this.form.reset({ stockInicial: 0 });
    this.mostrarModal = true;
  }

  editar(producto: Producto): void {
    this.editando = true;
    this.editandoId = producto.id;
    this.form.patchValue({ descripcion: producto.descripcion, precio: producto.precio });
    this.mostrarModal = true;
  }

  cerrarModal(): void { this.mostrarModal = false; }

  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.cargando) return;
    this.cargando = true;

    const payload: Producto = {
      descripcion: this.form.value.descripcion,
      precio: Number(this.form.value.precio),
      stockInicial: Number(this.form.value.stockInicial || 0)
    };

    const op = this.editando
      ? this.productoService.actualizar(this.editandoId!, payload)
      : this.productoService.crear(payload);

    op.pipe(finalize(() => (this.cargando = false))).subscribe({
      next: () => {
        this.toast.exito(this.editando ? 'Producto actualizado.' : 'Producto creado.');
        this.cerrarModal();
        this.cargarDatos();
      },
      error: () => this.toast.error('Error al guardar el producto.')
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productoService.eliminar(id).subscribe({
      next: () => {
        this.toast.exito('Producto eliminado.');
        this.cargarDatos();
      },
      error: () => this.toast.error('Error al eliminar el producto.')
    });
  }

  abrirStockModal(producto: Producto): void {
    this.productoParaStock = producto;
    this.tipoAjuste = 'agregar';
    this.cantidadAjuste = 1;
    this.mostrarStockModal = true;
  }

  cerrarStockModal(): void { this.mostrarStockModal = false; }

  confirmarAjusteStock(): void {
    if (!this.productoParaStock || !this.cantidadAjuste) return;
    this.cargandoStock = true;
    const delta = this.tipoAjuste === 'agregar' ? this.cantidadAjuste : -this.cantidadAjuste;

    this.productoService.actualizarStock(this.productoParaStock.id!, delta).pipe(
      finalize(() => (this.cargandoStock = false))
    ).subscribe({
      next: () => {
        this.toast.exito(`Stock ${this.tipoAjuste === 'agregar' ? 'aumentado' : 'reducido'} correctamente.`);
        this.cerrarStockModal();
        this.cargarDatos();
      },
      error: (err) => {
        const msg = err?.error?.mensaje || 'Error al ajustar el stock.';
        this.toast.error(msg);
      }
    });
  }
}
