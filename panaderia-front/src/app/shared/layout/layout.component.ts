import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  template: `
    <div class="layout-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-box">🥖</div>
          <span class="logo-text">Panadería</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <lucide-icon name="layout-dashboard" [size]="20"></lucide-icon>
            <span>Dashboard</span>
          </a>
          <a routerLink="/productos" routerLinkActive="active" class="nav-item">
            <lucide-icon name="shopping-bag" [size]="20"></lucide-icon>
            <span>Inventario</span>
          </a>
          <a routerLink="/clientes" routerLinkActive="active" class="nav-item">
            <lucide-icon name="users" [size]="20"></lucide-icon>
            <span>Clientes</span>
          </a>
          <a routerLink="/facturacion" routerLinkActive="active" class="nav-item">
            <lucide-icon name="receipt" [size]="20"></lucide-icon>
            <span>Facturación</span>
          </a>

          <div class="nav-spacer"></div>

          <a routerLink="/productos" class="nav-item secondary">
            <lucide-icon name="bell" [size]="20"></lucide-icon>
            <span>Stock Bajo</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" *ngIf="usuario$ | async as u">
            <div class="user-avatar">{{ u.nombre.charAt(0).toUpperCase() }}</div>
            <div class="user-details">
              <span class="user-name">{{ u.nombre }}</span>
              <span class="user-rol">{{ u.rol }}</span>
            </div>
          </div>
          <button (click)="logout()" class="logout-btn">
            <lucide-icon name="log-out" [size]="20"></lucide-icon>
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="content-wrapper">
          <router-outlet />
        </div>
      </main>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" *ngIf="(toasts$ | async)?.length">
      <div
        *ngFor="let t of toasts$ | async"
        class="toast"
        [class.toast-success]="t.tipo === 'success'"
        [class.toast-error]="t.tipo === 'error'"
        [class.toast-info]="t.tipo === 'info'"
        (click)="toastService.remove(t.id)"
      >
        <lucide-icon
          [name]="t.tipo === 'success' ? 'check-circle' : t.tipo === 'error' ? 'alert-circle' : 'info'"
          [size]="18"
        ></lucide-icon>
        <span>{{ t.mensaje }}</span>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      height: 100vh;
      background-color: #f3f1ee;
      padding: 1rem;
      gap: 1rem;
      box-sizing: border-box;
    }

    .sidebar {
      width: 240px;
      min-width: 240px;
      background: white;
      border-radius: 2rem;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.07);
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0.75rem;
      margin-bottom: 2rem;
    }

    .logo-box {
      width: 38px;
      height: 38px;
      background: #2d2d2d;
      color: white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .logo-text {
      font-weight: 800;
      font-size: 1.15rem;
      color: #2d2d2d;
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 0.875rem;
      border-radius: 0.875rem;
      color: #9ca3af;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.15s;
    }

    .nav-item:hover {
      background: #f9fafb;
      color: #4b5563;
    }

    .nav-item.active {
      background: #2d2d2d;
      color: white;
    }

    .nav-spacer { flex: 1; }

    .nav-item.secondary { font-size: 0.875rem; color: #b5bfc9; }
    .nav-item.secondary:hover { color: #6b7280; }

    .sidebar-footer {
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f3f1ee;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.875rem;
      color: #2d2d2d;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 700;
      font-size: 0.85rem;
      color: #2d2d2d;
    }

    .user-rol {
      font-size: 0.7rem;
      color: #9ca3af;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 0.875rem;
      border-radius: 0.875rem;
      color: #ef4444;
      background: transparent;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.95rem;
      transition: background 0.15s;
    }

    .logout-btn:hover { background: #fef2f2; }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0.5rem 0.5rem 0;
    }

    /* Toast styles */
    .toast-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      border-radius: 1rem;
      font-weight: 600;
      font-size: 0.9rem;
      min-width: 260px;
      max-width: 380px;
      box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.15);
      cursor: pointer;
      pointer-events: all;
      animation: slideIn 0.25s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .toast-error { background: #fff5f5; color: #b91c1c; border: 1px solid #fecaca; }
    .toast-info { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

    @media (max-width: 768px) {
      .sidebar { width: 72px; min-width: 72px; padding: 1.5rem 0.5rem; }
      .logo-text, .nav-item span, .logout-btn span, .user-info { display: none; }
      .nav-item { justify-content: center; }
      .logout-btn { justify-content: center; }
    }
  `]
})
export class LayoutComponent {
  private auth = inject(AuthService);
  toastService = inject(ToastService);

  usuario$ = this.auth.usuario$;
  toasts$ = this.toastService.toasts$;

  logout(): void {
    this.auth.logout();
  }
}
