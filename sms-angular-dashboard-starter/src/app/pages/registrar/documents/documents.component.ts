import { Component } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { documentRequirements } from '../../../core/data/registrar.mock';
import { DocumentRequirement } from '../../../core/models/registrar.models';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent {
  readonly documents = documentRequirements;

  statusClass(status: string): string {
    if (status === 'Verified') return 'bg-emerald-50 text-emerald-700';
    if (status === 'For Verification') return 'bg-blue-50 text-blue-700';
    if (status === 'Missing') return 'bg-amber-50 text-amber-700';
    if (status === 'Rejected') return 'bg-rose-50 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  }

  trackDocument(_: number, item: DocumentRequirement): string {
    return item.id;
  }
}
