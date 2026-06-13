import { Component } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { idQrRecords } from '../../../core/data/registrar.mock';
import { IdQrRecord } from '../../../core/models/registrar.models';

@Component({
  selector: 'app-id-qr-management',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './id-qr-management.component.html',
  styleUrl: './id-qr-management.component.scss'
})
export class IdQrManagementComponent {
  readonly records = idQrRecords;

  statusClass(status: string): string {
    if (status.includes('Generated') || status.includes('Printed')) return 'bg-emerald-50 text-emerald-700';
    if (status.includes('Printing')) return 'bg-blue-50 text-blue-700';
    if (status.includes('Pending')) return 'bg-amber-50 text-amber-700';
    if (status.includes('Blocked')) return 'bg-rose-50 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  }

  trackRecord(_: number, item: IdQrRecord): string {
    return item.id;
  }
}
