import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ClienteService } from '../../core/services/cliente.service';
import { ToastService } from '../../core/services/toast.service';
import { Cliente } from '../../core/models/cliente.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-text">
          <h2>Clientes</h2>
          <p>{{ clientes.length }} clientes registrados</p>
        </div>
        <button (click)="abrirModal()" class="add-btn">
          <lucide-icon name="plus" [size]="18"></lucide-icon>
          Nuevo Cliente
        </button>
      </div>

      <!-- Search -->
      <div class="search-row">
        <div class="search-field">
          <lucide-icon name="search" [size]="16"></lucide-icon>
          <input type="text" placeholder="Buscar por nombre..." (input)="buscar($event)">
        </div>
      </div>

      <div class="inventory-list">
        <!-- Loading -->
        <div *ngIf="cargandoLista" class="loading-state">
          <div class="spinner"></div>
          <span>Cargando clientes...</span>
        </div>

        <table *ngIf="!cargandoLista" class="simple-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clientesFiltrados" class="table-row">
              <td>
                <div class="client-cell">
                  <div class="client-avatar">{{ c.nombre.charAt(0).toUpperCase() }}</div>
                  <span class="client-name">{{ c.nombre }}</span>
                </div>
              </td>
              <td class="text-muted">{{ c.documento || '—' }}</td>
              <td class="text-muted">{{ c.telefono || '—' }}</td>
              <td class="text-muted">{{ c.email || '—' }}</td>
              <td class="actions-cell">
                <button (click)="editar(c)" class="action-btn edit" title="Editar">
                  <lucide-icon name="edit-2" [size]="16"></lucide-icon>
                </button>
                <button (click)="eliminar(c.id!)" class="action-btn delete" title="Eliminar">
                  <lucide-icon name="trash-2" [size]="16"></lucide-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="clientesFiltrados.length === 0 && !cargandoLista">
              <td colspan="5" class="empty-state">
                <lucide-icon name="users" [size]="32"></lucide-icon>
                <p>No se encontraron clientes</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-backdrop" *ngIf="mostrarModal" (click)="cerrarModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editandoId ? 'Editar Cliente' : 'Nuevo Cliente' }}</h3>
          <button (click)="cerrarModal()" class="close-btn">
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>
        <form [formGroup]="form" (ngSubmit)="guardar()" class="simple-form">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input formControlName="nombre" placeholder="Ej: Juan Pérez">
            <span class="field-error" *ngIf="campoInvalido('nombre')">Campo obligatorio</span>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Documento / NIT</label>
              <input formControlName="documento" placeholder="CC o NIT">
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input formControlName="telefono" placeholder="Número de contacto">
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input formControlName="email" type="email" placeholder="correo@ejemplo.com">
            <span class="field-error" *ngIf="campoInvalido('email')">Email inválido</span>
          </div>
          <div class="form-actions">
            <button type="button" (click)="cerrarModal()" class="btn-cancel">Cancelar</button>
            <button type="submit" [disabled]="form.invalid || cargando" class="btn-save">
              {{ cargando ? 'Guardando...' : (editandoId ? 'Actualizar' : 'Guardar Cliente') }}
            </button>
          </div>
        </form>
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

    .search-row { display: flex; align-items: center; gap: 1rem; }
    .search-field {
      display: flex; align-items: center; gap: 0.625rem; background: white;
      padding: 0.625rem 1rem; border-radius: 0.875rem; width: 280px;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); color: #9ca3af;
    }
    .search-field input { border: none; outline: none; width: 100%; font-size: 0.9rem; color: #2d2d2d; }

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
    .text-muted { color: #6b7280; }

    .client-cell { display: flex; align-items: center; gap: 0.75rem; }
    .client-avatar {
      width: 34px; height: 34px; border-radius: 50%; background: #f3f1ee;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.875rem; color: #4b5563; flex-shrink: 0;
    }
    .client-name { font-weight: 700; color: #2d2d2d; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 0.375rem; }
    .action-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s; background: transparent; color: #9ca3af;
    }
    .action-btn.edit:hover { background: #f3f1ee; color: #2d2d2d; }
    .action-btn.delete:hover { background: #fef2f2; color: #ef4444; }

    .empty-state { text-align: center; padding: 3.5rem; color: #9ca3af; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .empty-state p { margin: 0; font-weight: 600; font-size: 0.95rem; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .modal-content { background: white; width: 100%; max-width: 480px; border-radius: 2rem; padding: 2rem; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; }
    .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #2d2d2d; }
    .close-btn { background: none; border: none; cursor: pointer; color: #9ca3af; padding: 0.25rem; transition: color 0.15s; }
    .close-btn:hover { color: #2d2d2d; }

    .simple-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-weight: 600; font-size: 0.82rem; color: #4b5563; text-transform: uppercase; letter-spacing: 0.03em; }
    .form-group input { background: #f8f9fa; border: 1px solid #e5e7eb; padding: 0.75rem 1rem; border-radius: 0.75rem; font-size: 0.95rem; outline: none; transition: border-color 0.15s; }
    .form-group input:focus { border-color: #2d2d2d; }
    .field-error { color: #ef4444; font-size: 0.78rem; font-weight: 600; }

    .form-actions { display: flex; gap: 0.875rem; margin-top: 0.5rem; }
    .btn-cancel { flex: 1; padding: 0.875rem; border-radius: 0.875rem; border: none; background: #f3f1ee; font-weight: 600; cursor: pointer; color: #4b5563; transition: background 0.15s; }
    .btn-cancel:hover { background: #e5e7eb; }
    .btn-save { flex: 2; padding: 0.875rem; border-radius: 0.875rem; border: none; background: #2d2d2d; color: white; font-weight: 700; cursor: pointer; transition: background 0.15s; }
    .btn-save:hover:not(:disabled) { background: #111827; }
    .btn-save:disabled { opacity: 0.55; cursor: not-allowed; }
  `]
})
export class ClientesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private toast = inject(ToastService);

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  form!: FormGroup;
  mostrarModal = false;
  editandoId?: number;
  cargando = false;
  cargandoLista = true;

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      documento: [''],
      telefono: [''],
      email: ['', [Validators.email]]
    });
    this.cargarClientes();
  }

  campoInvalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }

  cargarClientes(): void {
    this.cargandoLista = true;
    this.clienteService.listar().pipe(
      finalize(() => (this.cargandoLista = false))
    ).subscribe({
      next: (c) => {
        this.clientes = c;
        this.clientesFiltrados = c;
      },
      error: () => this.toast.error('Error al cargar los clientes.')
    });
  }

  buscar(event: Event): void {
    const t = (event.target as HTMLInputElement).value.toLowerCase();
    this.clientesFiltrados = t
      ? this.clientes.filter(c => c.nombre.toLowerCase().includes(t))
      : this.clientes;
  }

  abrirModal(): void {
    this.editandoId = undefined;
    this.form.reset();
    this.mostrarModal = true;
  }

  editar(cliente: Cliente): void {
    this.editandoId = cliente.id;
    this.form.patchValue({
      nombre: cliente.nombre,
      documento: cliente.documento,
      telefono: cliente.telefono,
      email: cliente.email
    });
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardar(): void {
    if (this.form.invalid || this.cargando) return;
    this.form.markAllAsTouched();
    this.cargando = true;

    const datos: Cliente = this.form.value;
    const op = this.editandoId
      ? this.clienteService.actualizar(this.editandoId, datos)
      : this.clienteService.crear(datos);

    op.pipe(finalize(() => (this.cargando = false))).subscribe({
      next: () => {
        this.toast.exito(this.editandoId ? 'Cliente actualizado.' : 'Cliente creado.');
        this.cargarClientes();
        this.cerrarModal();
      },
      error: () => this.toast.error('Error al guardar el cliente.')
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar este cliente?')) return;
    this.clienteService.eliminar(id).subscribe({
      next: () => {
        this.toast.exito('Cliente eliminado.');
        this.cargarClientes();
      },
      error: () => this.toast.error('Error al eliminar el cliente.')
    });
  }
}
