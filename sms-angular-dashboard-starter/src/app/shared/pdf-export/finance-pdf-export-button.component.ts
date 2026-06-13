import { DOCUMENT } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { buildPrintableHtml } from './pdf-export.util';

@Component({
  selector: 'app-finance-pdf-export-button',
  standalone: true,
  template: `
    <button class="pdf-export-button" type="button" (click)="exportPdf()">
      <span class="material-icons">picture_as_pdf</span>
      Export PDF
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .pdf-export-button {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: #fff;
      color: #0f766e;
      padding: .55rem .75rem;
      font-size: .76rem;
      font-weight: 950;
      cursor: pointer;
      box-shadow: 0 8px 18px rgba(15, 23, 42, .06);
    }

    .pdf-export-button:hover {
      border-color: #0f766e;
      background: #ecfeff;
    }

    .material-icons {
      font-size: 1rem;
    }
  `],
})
export class FinancePdfExportButtonComponent {
  private document = inject(DOCUMENT);

  @Input() title = 'Finance Export';
  @Input() subtitle = '';
  @Input() targetSelector = '.finance-page';

  exportPdf() {
    const target = this.document.querySelector(this.targetSelector);
    if (!target) return;

    const printWindow = this.document.defaultView?.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(buildPrintableHtml({
      title: this.title,
      subtitle: this.subtitle,
      contentHtml: target.outerHTML,
      styleLinks: this.collectStyleLinks(),
      inlineStyles: this.collectInlineStyles(),
    }));
    printWindow.document.close();
  }

  private collectStyleLinks() {
    return Array.from(this.document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .map((link) => link.href)
      .filter(Boolean);
  }

  private collectInlineStyles() {
    return Array.from(this.document.querySelectorAll<HTMLStyleElement>('style'))
      .map((style) => style.textContent || '')
      .filter(Boolean);
  }
}
