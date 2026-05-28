import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FacturaService } from '../../core/services/factura.service';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/models/producto.model';
import { interval, Subscription, forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="dashboard-container">
      <div class="dash-header">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen del negocio en tiempo real</p>
        </div>
        <button (click)="cargarDashboard()" class="refresh-btn" [class.spinning]="cargando">
          <lucide-icon name="refresh-cw" [size]="16"></lucide-icon>
          Actualizar
        </button>
      </div>

      <!-- Skeleton loader -->
      <div *ngIf="cargando && !resumen" class="skeleton-grid">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>

      <ng-container *ngIf="!cargando || resumen">
        <!-- Stats Row -->
        <div class="stat-grid">
          <div class="stat-card main">
            <div class="stat-label">Ventas de Hoy</div>
            <div class="stat-value">\${{ (resumen?.ventas_hoy || 0) | number:'1.0-0' }}</div>
            <div class="stat-details">
              <div class="detail-item">
                <span class="d-label">Facturas hoy</span>
                <span class="d-value">{{ resumen?.facturas_hoy || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="d-label">Ventas del mes</span>
                <span class="d-value">\${{ (resumen?.ventas_mes || 0) | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <div class="stat-card products-card">
            <div class="stat-label">Productos en Inventario</div>
            <div class="stat-value">{{ productos.length }}</div>
            <a routerLink="/productos" class="view-link">
              Ver inventario
              <lucide-icon name="arrow-up" [size]="14" style="transform: rotate(45deg)"></lucide-icon>
            </a>
          </div>

          <div class="stat-card stock-card" [class.alert]="stockBajoCount > 0">
            <div class="stat-label">Stock Bajo (< 5 uds)</div>
            <div class="stat-value" [class.text-red]="stockBajoCount > 0">{{ stockBajoCount }}</div>
            <a routerLink="/productos" class="view-link">Ver productos</a>
          </div>

          <div class="stat-card clients-card">
            <div class="stat-label">Productos sin Stock</div>
            <div class="stat-value text-red">{{ sinStockCount }}</div>
            <a routerLink="/facturacion" class="view-link">Ir a ventas</a>
          </div>
        </div>

        <!-- Products Table -->
        <div class="info-card">
          <div class="card-header">
            <h3>Últimos Productos</h3>
            <a routerLink="/productos" class="header-link">Ver todos</a>
          </div>
          <div class="products-table">
            <div *ngFor="let p of productos.slice(0, 6)" class="product-row">
              <div class="product-icon">
                <lucide-icon name="package" [size]="16"></lucide-icon>
              </div>
              <div class="product-info">
                <span class="p-name">{{ p.descripcion }}</span>
                <span class="p-price">\${{ p.precio | number:'1.0-0' }}</span>
              </div>
              <div class="stock-badge" [class.low]="(p.stockActual || 0) < 5" [class.empty]="(p.stockActual || 0) === 0">
                {{ p.stockActual }} uds
              </div>
            </div>
            <div *ngIf="productos.length === 0" class="empty-state">
              <lucide-icon name="package" [size]="32"></lucide-icon>
              <p>No hay productos registrados</p>
              <a routerLink="/productos" class="view-link">Agregar producto</a>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .dash-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .dash-header h2 { margin: 0; font-size: 1.75rem; font-weight: 800; color: #2d2d2d; }
    .dash-header p { margin: 0.25rem 0 0; color: #6b7280; font-size: 0.9rem; }

    .refresh-btn {
      display: flex; align-items: center; gap: 0.5rem; background: white; border: 1px solid #e5e7eb;
      padding: 0.6rem 1rem; border-radius: 0.75rem; cursor: pointer; font-weight: 600;
      font-size: 0.875rem; color: #4b5563; transition: background 0.15s;
    }
    .refresh-btn:hover { background: #f9fafb; }
    .refresh-btn.spinning lucide-icon { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Skeleton */
    .skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
    .skeleton-card { background: white; border-radius: 1.5rem; height: 140px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    /* Stat Cards */
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
    .stat-card {
      background: white; border-radius: 1.5rem; padding: 1.5rem;
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .stat-card.alert { border: 2px solid #fecaca; background: #fff5f5; }
    .stat-label { font-size: 0.8rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; }
    .stat-value { font-size: 2.25rem; font-weight: 900; color: #2d2d2d; letter-spacing: -1px; }
    .text-red { color: #ef4444; }

    .stat-details { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; border-top: 1px solid #f3f4f6; padding-top: 0.75rem; }
    .detail-item { display: flex; justify-content: space-between; align-items: center; }
    .d-label { font-size: 0.75rem; color: #9ca3af; font-weight: 600; }
    .d-value { font-size: 0.9rem; font-weight: 800; color: #2d2d2d; }

    .view-link {
      display: inline-flex; align-items: center; gap: 0.25rem;
      color: #6b7280; font-size: 0.8rem; font-weight: 600; text-decoration: none;
      margin-top: auto; transition: color 0.15s;
    }
    .view-link:hover { color: #2d2d2d; }

    /* Info Card */
    .info-card { background: white; border-radius: 1.5rem; padding: 1.5rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .card-header h3 { margin: 0; font-size: 1rem; font-weight: 800; color: #2d2d2d; }
    .header-link { font-size: 0.8rem; font-weight: 600; color: #9ca3af; text-decoration: none; }
    .header-link:hover { color: #2d2d2d; }

    .products-table { display: flex; flex-direction: column; gap: 0.5rem; }
    .product-row {
      display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem;
      border-radius: 1rem; transition: background 0.15s;
    }
    .product-row:hover { background: #f9fafb; }
    .product-icon { width: 32px; height: 32px; background: #f3f1ee; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; flex-shrink: 0; }
    .product-info { flex: 1; display: flex; flex-direction: column; }
    .p-name { font-weight: 700; color: #2d2d2d; font-size: 0.9rem; }
    .p-price { font-size: 0.78rem; color: #9ca3af; font-weight: 600; }

    .stock-badge {
      font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 999px;
      background: #f0fdf4; color: #15803d;
    }
    .stock-badge.low { background: #fffbeb; color: #d97706; }
    .stock-badge.empty { background: #fff5f5; color: #b91c1c; }

    .empty-state { text-align: center; padding: 2rem; color: #9ca3af; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .empty-state p { margin: 0; font-weight: 600; }

    @media (max-width: 1200px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .stat-grid, .skeleton-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private facturaService = inject(FacturaService);
  private productoService = inject(ProductoService);

  resumen: any = null;
  productos: Producto[] = [];
  cargando = true;
  stockBajoCount = 0;
  sinStockCount = 0;
  private refrescoSub?: Subscription;

  ngOnInit(): void {
    this.cargarDashboard();
    this.refrescoSub = interval(30000).subscribe(() => this.cargarDashboard());
  }

  ngOnDestroy(): void {
    this.refrescoSub?.unsubscribe();
  }

  cargarDashboard(): void {
    this.cargando = true;
    forkJoin({
      resumen: this.facturaService.resumenDiario(),
      productos: this.productoService.listar()
    }).subscribe({
      next: ({ resumen, productos }) => {
        this.resumen = resumen;
        this.productos = productos;
        this.stockBajoCount = productos.filter(p => (p.stockActual || 0) > 0 && (p.stockActual || 0) < 5).length;
        this.sinStockCount = productos.filter(p => (p.stockActual || 0) === 0).length;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }
}
