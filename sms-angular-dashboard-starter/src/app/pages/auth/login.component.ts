import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { loadRememberedEmail, saveRememberedEmail } from './login-remember.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative min-h-screen flex items-center justify-center md:items-start md:justify-end p-4 md:p-8 overflow-hidden bg-slate-900">
      <!-- Video Background -->
      <video 
        autoplay 
        loop 
        [muted]="true"
        playsinline
        class="absolute inset-0 w-full h-full object-cover z-0"
        src="assets/login-bg.mp4">
      </video>
      
      <!-- Overlay to ensure readability -->
      <div class="absolute inset-0 bg-black/10 z-0 mix-blend-multiply"></div>

      <!-- Loading Indicator -->
      <div class="absolute inset-0 z-10 flex flex-col items-center justify-center text-white/80 gap-3 pointer-events-none transition-opacity duration-500"
           [class.opacity-100]="!showLogin" [class.opacity-0]="showLogin">
        <span class="material-icons animate-spin text-4xl drop-shadow-md">autorenew</span>
        <p class="text-sm font-semibold tracking-widest uppercase drop-shadow-md">Initializing Portal...</p>
      </div>

      <!-- Glassmorphism Login Bar (Responsive) -->
      <div class="relative z-20 w-full max-w-sm md:max-w-none md:w-auto p-6 md:p-5 bg-white/30 backdrop-blur-[10px] border border-white/40 rounded-xl md:rounded-lg shadow-2xl flex flex-col-reverse md:flex-row items-center gap-6 md:gap-8 transition-all duration-[800ms] ease-out transform"
           [class.translate-x-[150%]]="!showLogin"
           [class.opacity-0]="!showLogin"
           [class.translate-x-0]="showLogin"
           [class.opacity-100]="showLogin">
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full m-0 relative">
          
          <div *ngIf="error" class="absolute -top-12 sm:-bottom-12 left-0 right-0 bg-red-500/80 border border-red-500 text-white rounded-lg p-2 text-sm text-center backdrop-blur-md">
            {{ error }}
          </div>

          <div class="w-full sm:w-44">
            <label class="block text-emerald-800 text-xs font-bold mb-1 drop-shadow-sm" for="email">
              Email Address
            </label>
            <input 
              class="w-full bg-white/20 border border-emerald-500/30 rounded-lg py-3 sm:py-[6px] px-3 text-emerald-900 placeholder-emerald-700/50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm" 
              id="email" 
              type="email" 
              placeholder="name@domain.com"
              [(ngModel)]="credentials.email" 
              name="email" 
              required>
          </div>
          
          <div class="w-full sm:w-44">
            <label class="block text-emerald-800 text-xs font-bold mb-1 drop-shadow-sm" for="password">
              Password
            </label>
            <input 
              class="w-full bg-white/20 border border-emerald-500/30 rounded-lg py-3 sm:py-[6px] px-3 text-emerald-900 placeholder-emerald-700/50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm" 
              id="password" 
              type="password" 
              placeholder="••••••••"
              [(ngModel)]="credentials.password" 
              name="password" 
              required>
          </div>

          <div class="w-full sm:w-auto mt-2 sm:mt-0 signin-group">
            <button 
              class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 sm:py-[6px] px-4 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm" 
              type="submit"
              [disabled]="!loginForm.form.valid || isLoading">
              <span class="material-icons text-base" *ngIf="!isLoading">login</span>
              <span class="material-icons text-base animate-spin" *ngIf="isLoading">sync</span>
              <span class="hidden sm:inline">{{ isLoading ? 'Auth...' : 'Sign In' }}</span>
            </button>

            <label class="remember-option">
              <input
                class="remember-checkbox"
                type="checkbox"
                [(ngModel)]="rememberMe"
                name="rememberMe">
              <span class="remember-box">
                <span class="material-icons remember-check">check</span>
              </span>
              <span class="remember-text">Remember me</span>
            </label>
          </div>
        </form>

        <!-- Logo Section (First on mobile, last on desktop) -->
        <div class="flex flex-col md:flex-row items-center gap-3 md:border-l md:border-emerald-600/30 md:pl-5 w-full md:w-auto mb-4 md:mb-0 border-b border-emerald-600/20 pb-4 md:border-b-0 md:pb-0 shrink-0">
          <div class="text-center md:text-right">
            <h2 class="text-2xl md:text-xl font-extrabold text-emerald-800 tracking-tight leading-none drop-shadow-sm">SFXSAI</h2>
            <p class="text-emerald-700 font-bold text-sm md:text-xs mt-1 md:mt-1 drop-shadow-sm">Portal Login</p>
          </div>
          <img src="assets/logo.png" alt="SFXSAI Logo" class="w-20 h-20 md:w-16 md:h-16 object-contain drop-shadow-2xl shrink-0" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .signin-group {
      align-items: center;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .remember-option {
      align-items: center;
      color: rgb(6 95 70);
      cursor: pointer;
      display: flex;
      font-size: 0.78rem;
      font-weight: 800;
      gap: 0.45rem;
      justify-content: center;
      line-height: 1;
      min-height: 1.25rem;
      user-select: none;
      white-space: nowrap;
    }

    .remember-checkbox {
      height: 1px;
      opacity: 0;
      position: absolute;
      width: 1px;
    }

    .remember-box {
      align-items: center;
      background: rgb(255 255 255 / 0.26);
      border: 1px solid rgb(16 185 129 / 0.42);
      border-radius: 0.45rem;
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.28);
      display: flex;
      height: 1.25rem;
      justify-content: center;
      transition: all 160ms ease;
      width: 1.25rem;
    }

    .remember-check {
      color: white;
      font-size: 0.95rem;
      opacity: 0;
      transform: scale(0.75);
      transition: all 160ms ease;
    }

    .remember-checkbox:checked + .remember-box {
      background: rgb(16 185 129);
      border-color: rgb(5 150 105);
      box-shadow: 0 8px 20px rgb(16 185 129 / 0.25);
    }

    .remember-checkbox:checked + .remember-box .remember-check {
      opacity: 1;
      transform: scale(1);
    }

    .remember-checkbox:focus-visible + .remember-box {
      outline: 2px solid rgb(16 185 129);
      outline-offset: 2px;
    }

    .remember-text {
      filter: drop-shadow(0 1px 1px rgb(255 255 255 / 0.22));
    }

    @media (max-width: 639px) {
      .signin-group {
        align-items: stretch;
      }

      .remember-option {
        justify-content: center;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private readonly storage = window.localStorage;
  
  credentials = {
    email: '',
    password: ''
  };
  
  rememberMe = false;
  isLoading = false;
  showLogin = false;
  error = '';

  ngOnInit() {
    const rememberedEmail = loadRememberedEmail(this.storage);
    this.credentials.email = rememberedEmail;
    this.rememberMe = rememberedEmail.length > 0;

    setTimeout(() => {
      this.showLogin = true;
    }, 5000);
  }

  onSubmit() {
    this.isLoading = true;
    this.error = '';
    
    this.authService.login(this.credentials).subscribe({
      next: () => {
        saveRememberedEmail(this.storage, this.credentials.email, this.rememberMe);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Invalid credentials. Please try again.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}
