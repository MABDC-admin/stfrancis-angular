import { Component, DestroyRef, Injector, inject, signal, OnInit, HostListener, computed } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { RegistrarApiService } from '../../core/services/registrar-api.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FinanceNotificationService } from '../../core/services/finance-notification.service';
import { GlobalSearchService } from '../../core/services/global-search.service';
import { FloatingChatService } from '../../core/services/floating-chat.service';
import { TeacherPortalService } from '../../pages/teacher/teacher-portal.service';
import { StudentPortalService } from '../../pages/student/student-portal.service';
import { PrincipalPortalService } from '../../pages/principal/principal-portal.service';
import { buildTopbarNotifications, dismissTopbarNotification } from './topbar-notifications.util';
import type { TopbarNotification } from './topbar-notifications.util';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, NgClass, RouterModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly authService = inject(AuthService);
  private readonly api = inject(RegistrarApiService);
  readonly financeNotifications = inject(FinanceNotificationService);
  readonly globalSearch = inject(GlobalSearchService);
  readonly chat = inject(FloatingChatService);

  readonly pageTitle = signal('Dashboard');
  readonly pageSubtitle = signal('Overview of registrar and finance operations');
  private readonly currentUrl = signal(this.router.url);
  private readonly currentUserSignal = signal<any>(null);
  private readonly announcementCount = signal(0);
  private readonly dismissedStorageKey = 'sfxsai.topbar.dismissed-notifications.v1';
  readonly dismissedNotificationIds = signal<string[]>(this.loadDismissedNotificationIds());
  readonly isNotificationDropdownOpen = signal(false);
  readonly notificationItems = computed(() => buildTopbarNotifications({
    role: this.currentUserSignal()?.role,
    portal: this.portalSegment(),
    chatUnreadCount: this.chat.unreadCount(),
    announcementCount: this.resolvedAnnouncementCount(),
    dismissedIds: this.dismissedNotificationIds(),
  }));
  readonly notificationCount = computed(() =>
    this.notificationItems().reduce((total, item) => total + item.count, 0),
  );
  readonly hasNotifications = computed(() => this.notificationCount() > 0);

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

  // Search logic
  private searchSubject = new Subject<string>();
  searchResults: any[] = [];
  isSearchFocused = false;
  private teacherAnnouncementsBound = false;
  private studentAnnouncementsBound = false;
  private principalAnnouncementsBound = false;

  constructor() {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(auth => {
      this.currentUser = auth?.user || null;
      this.currentUserSignal.set(this.currentUser);
      this.bindAnnouncementSourceForRole(this.currentUser?.role);
    });

    this.syncPageMeta();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.syncPageMeta();
      });

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

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) {
          this.searchResults = [];
          return of([]);
        }
        return this.api.searchStudents(query.trim(), this.selectedAyId);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => {
      this.searchResults = results;
    });
  }

  onSearchChange(query: string) {
    this.globalSearch.setQuery(query);
    this.searchSubject.next(query);
  }

  onSearchFocus() {
    this.isSearchFocused = true;
    if (this.searchText) {
      this.searchSubject.next(this.searchText);
    }
  }

  onSearchBlur() {
    // Delay hiding dropdown so click events can register
    setTimeout(() => {
      this.isSearchFocused = false;
    }, 200);
  }

  clearSearch() {
    this.searchText = '';
    this.searchResults = [];
    this.isSearchFocused = false;
    this.globalSearch.setQuery('');
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeNotifications();
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      document.getElementById('global-search-input')?.focus();
    }
  }

  @HostListener('document:click')
  closeNotificationDropdownFromDocument(): void {
    this.closeNotifications();
  }

  toggleNotifications(): void {
    this.isNotificationDropdownOpen.update(isOpen => !isOpen);
  }

  closeNotifications(): void {
    this.isNotificationDropdownOpen.set(false);
  }

  selectNotification(notification: TopbarNotification): void {
    const dismissedIds = dismissTopbarNotification(this.dismissedNotificationIds(), notification.id);
    this.dismissedNotificationIds.set(dismissedIds);
    this.persistDismissedNotificationIds(dismissedIds);
    this.closeNotifications();
    
    if (notification.type === 'chat') {
      this.chat.open();
    } else {
      this.router.navigateByUrl(notification.destination);
    }
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

  private portalSegment(): string {
    const path = this.currentUrl().split('?')[0].split('#')[0];
    return path.split('/').filter(Boolean)[0] || (this.currentUserSignal()?.role || 'admin').toLowerCase();
  }

  private resolvedAnnouncementCount(): number {
    const role = (this.currentUserSignal()?.role || '').toUpperCase();
    if (role === 'FINANCE') {
      return this.financeNotifications.learnersNeedingAssessmentCount();
    }

    return this.announcementCount();
  }

  private bindAnnouncementSourceForRole(role?: string): void {
    const normalizedRole = (role || '').toUpperCase();

    if (normalizedRole === 'TEACHER' && !this.teacherAnnouncementsBound) {
      this.teacherAnnouncementsBound = true;
      this.injector.get(TeacherPortalService).state$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(state => {
          this.announcementCount.set(Array.isArray(state.announcements) ? state.announcements.length : 0);
        });
      return;
    }

    if (normalizedRole === 'STUDENT' && !this.studentAnnouncementsBound) {
      this.studentAnnouncementsBound = true;
      this.injector.get(StudentPortalService).state$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(state => {
          const unread = Array.isArray(state.announcements)
            ? state.announcements.filter(item => !item.read).length
            : 0;
          this.announcementCount.set(unread);
        });
      return;
    }

    if (normalizedRole === 'PRINCIPAL' && !this.principalAnnouncementsBound) {
      this.principalAnnouncementsBound = true;
      this.injector.get(PrincipalPortalService).state$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(state => {
          this.announcementCount.set(Array.isArray(state.announcements) ? state.announcements.length : 0);
        });
      return;
    }

    if (!['TEACHER', 'STUDENT', 'PRINCIPAL'].includes(normalizedRole)) {
      this.announcementCount.set(0);
    }
  }

  private loadDismissedNotificationIds(): string[] {
    try {
      const stored = localStorage.getItem(this.dismissedStorageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  private persistDismissedNotificationIds(ids: string[]): void {
    try {
      localStorage.setItem(this.dismissedStorageKey, JSON.stringify(ids));
    } catch {
      // Notification dismissal should never block navigation.
    }
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
