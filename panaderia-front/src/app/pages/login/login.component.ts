import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout, TimeoutError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-shell">
        <aside class="login-brand">
          <div class="logo-wrap">🥖</div>
          <h1>Panaderia Pro</h1>
          <p>Control de inventario y facturacion para panaderias. Rapido, visual y confiable.</p>
        </aside>

        <section class="login-card">
          <div class="login-header">
            <h2>Iniciar sesion</h2>
            <p>Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>

          <form [formGroup]="form" (ngSubmit)="onLogin()" novalidate>
            <div class="field">
              <label for="username">Usuario</label>
              <input id="username" formControlName="username" type="text" placeholder="Ej: admin" />
              <span class="error" *ngIf="campoInvalido('username')">Minimo 3 caracteres</span>
            </div>

            <div class="field">
              <label for="password">Contrasena</label>
              <input id="password" formControlName="password" type="password" placeholder="********" />
              <span class="error" *ngIf="campoInvalido('password')">Minimo 3 caracteres</span>
            </div>

            <button type="submit" [disabled]="cargando || form.invalid">
              {{ cargando ? 'Validando...' : 'Ingresar al panel' }}
            </button>
          </form>

          <p class="helper">Backend esperado en http://localhost:8080.</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .login-container { min-height: 100vh; padding: 22px; background: linear-gradient(160deg, #eef2ff 0%, #f8fafc 40%, #f5e9dd 100%); display: flex; align-items: center; justify-content: center; }
    .login-shell { width: 100%; max-width: 980px; background: #fff; border-radius: 22px; border: 1px solid #e5e7eb; box-shadow: 0 24px 50px rgba(15, 23, 42, 0.14); display: grid; grid-template-columns: 0.95fr 1.25fr; overflow: hidden; }
    .login-brand { background: linear-gradient(180deg, #1f2937, #111827); color: #f8fafc; padding: 38px 30px; display: flex; flex-direction: column; justify-content: center; gap: 14px; }
    .logo-wrap { width: 68px; height: 68px; border-radius: 16px; background: rgba(255, 255, 255, 0.12); display: flex; align-items: center; justify-content: center; font-size: 34px; }
    .login-brand h1 { font-size: 30px; margin: 0; letter-spacing: -0.02em; }
    .login-brand p { color: #cbd5e1; margin: 0; line-height: 1.5; }
    .login-card { padding: 36px 34px; display: flex; flex-direction: column; justify-content: center; }
    .login-header { margin-bottom: 24px; }
    .login-header h2 { margin: 0; color: #111827; font-size: 28px; }
    .login-header p { margin: 7px 0 0; color: #6b7280; font-size: 14px; }
    .field { margin-bottom: 18px; }
    label { display: block; margin-bottom: 7px; color: #374151; font-size: 13px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; }
    input { width: 100%; border: 1px solid #d1d5db; border-radius: 10px; padding: 12px 13px; font-size: 15px; transition: border-color .2s, box-shadow .2s; background: #fcfdff; }
    input:focus { outline: none; border-color: #111827; box-shadow: 0 0 0 3px #dbeafe; }
    button { width: 100%; border: none; border-radius: 10px; padding: 12px; margin-top: 4px; background: #111827; color: #fff; font-weight: 600; font-size: 15px; cursor: pointer; transition: background .2s; }
    button:hover:not(:disabled) { background: #374151; }
    button:disabled { opacity: .65; cursor: not-allowed; }
    .error { color: #dc2626; font-size: 12px; margin-top: 6px; display: inline-block; }
    .error-msg { background: #fff5f5; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px; padding: 10px; margin-bottom: 15px; font-size: 13px; }
    .helper { margin-top: 14px; color: #6b7280; font-size: 12px; }
    @media (max-width: 860px) { .login-shell { grid-template-columns: 1fr; } .login-brand { padding: 26px; } .login-card { padding: 28px 24px; } }
  `]
})
export class LoginComponent {
  form: FormGroup;
  cargando = false;
  submitted = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  campoInvalido(nombreCampo: string): boolean {
    const campo = this.form.get(nombreCampo);
    return !!campo && campo.invalid && (campo.touched || this.submitted);
  }

  onLogin(): void {
    this.submitted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid || this.cargando) return;

    this.cargando = true;
    this.errorMsg = '';
    const { username, password } = this.form.getRawValue();

    this.auth.login(username.trim(), password.trim()).pipe(
      timeout(8000),
      finalize(() => (this.cargando = false))
    ).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (error: unknown) => {
        if (error instanceof TimeoutError) {
          this.errorMsg = 'La API no respondio a tiempo. Verifica backend y CORS.';
          return;
        }

        const httpError = error as HttpErrorResponse;
        if (httpError?.status === 0) {
          this.errorMsg = 'No se pudo conectar con el backend en puerto 8080.';
          return;
        }
        if (httpError?.status === 401) {
          this.errorMsg = 'Credenciales invalidas. Intenta nuevamente.';
          return;
        }
        this.errorMsg = 'Error inesperado durante el login.';
      }
    });
  }
}
