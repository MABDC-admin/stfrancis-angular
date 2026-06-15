import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-portal-video-backdrop',
  standalone: true,
  template: `
    <video class="portal-video" autoplay loop muted playsinline [muted]="true" [autoplay]="true" aria-hidden="true">
      <source src="/assets/topbar-flag-bg.mp4" type="video/mp4" />
    </video>
    <span class="portal-video-overlay" [class.portal-video-overlay--deep]="tone === 'deep'" aria-hidden="true"></span>
  `,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      border-radius: inherit;
      pointer-events: none;
    }

    .portal-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 42%;
      opacity: .48;
      filter: saturate(1.06) contrast(1.03);
    }

    .portal-video-overlay {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(255, 255, 255, .93) 0%, rgba(255, 255, 255, .78) 48%, rgba(255, 255, 255, .55) 100%),
        linear-gradient(135deg, rgba(15, 118, 110, .22), rgba(37, 99, 235, .14));
    }

    .portal-video-overlay--deep {
      background:
        linear-gradient(90deg, rgba(4, 70, 56, .9) 0%, rgba(4, 120, 87, .74) 50%, rgba(37, 99, 235, .5) 100%),
        linear-gradient(135deg, rgba(15, 118, 110, .42), rgba(37, 99, 235, .24));
    }
  `],
})
export class PortalVideoBackdropComponent {
  @Input() tone: 'light' | 'deep' = 'light';
}
