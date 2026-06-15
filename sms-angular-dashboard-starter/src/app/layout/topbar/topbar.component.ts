import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { RegistrarApiService } from '../../core/services/registrar-api.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FinanceNotificationService } from '../../core/services/finance-notification.service';
import { GlobalSearchService } from '../../core/services/global-search.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, NgClass],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly api = inject(RegistrarApiService);
  readonly financeNotifications = inject(FinanceNotificationService);
  readonly globalSearch = inject(GlobalSearchService);

  readonly pageTitle = signal('Dashboard');
  readonly pageSubtitle = signal('Overview of registrar and finance operations');

  academicYears: any[] = [];
  selectedAyId: string = '';
  searchText = '';
  currentUser: any = null;
  isUploadingAvatar = false;
  avatarToast = {
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error'
  };

  constructor() {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(auth => {
      this.currentUser = auth?.user || null;
    });

    this.syncPageMeta();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncPageMeta());

    this.api.refreshAcademicYears();

    this.api.academicYears$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ays => {
      this.academicYears = ays;
    });

    this.api.activeAcademicYear$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ay => {
      if (ay) {
        this.selectedAyId = ay.id;
        this.financeNotifications.refreshAssessmentQueue();
      }
    });

    this.globalSearch.query$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(query => {
      this.searchText = query;
    });
  }

  onSearchChange(query: string) {
    this.globalSearch.setQuery(query);
  }

  onAyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const ay = this.academicYears.find(y => y.id === target.value);
    if (ay) {
      this.selectedAyId = ay.id;
      this.api.setActiveAcademicYear(ay);
      this.financeNotifications.refreshAssessmentQueue();
    }
  }

  private syncPageMeta(): void {
    let route = this.activatedRoute;

    while (route.firstChild) {
      route = route.firstChild;
    }

    this.pageTitle.set(route.snapshot?.data?.['pageTitle'] ?? 'Dashboard');
    this.pageSubtitle.set(route.snapshot?.data?.['pageSubtitle'] ?? 'Overview of registrar and finance operations');
  }

  logout() {
    this.authService.logout();
  }

  userInitials(): string {
    const source = this.currentUser?.email || 'SFXSAI';
    return source.slice(0, 2).toUpperCase();
  }

  onAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.isUploadingAvatar = true;
    this.api.uploadStaffAvatar(input.files[0]).subscribe({
      next: (file) => {
        this.authService.updateCurrentUser({ avatarUrl: file.publicUrl });
        this.isUploadingAvatar = false;
        input.value = '';
        this.showAvatarToast('Avatar saved', 'Staff profile photo was uploaded.', 'success');
      },
      error: () => {
        this.isUploadingAvatar = false;
        input.value = '';
        this.showAvatarToast('Upload failed', 'Use a PNG, JPG, WEBP, or PDF under 5 MB.', 'error');
      }
    });
  }

  private showAvatarToast(title: string, message: string, type: 'success' | 'error') {
    this.avatarToast = { show: true, title, message, type };
    setTimeout(() => {
      this.avatarToast = { ...this.avatarToast, show: false };
    }, 3500);
  }
}
