import { Component } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { OnInit, inject, DestroyRef } from '@angular/core';
import { switchMap, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { DocumentRequest } from '../../../core/models/registrar.models';

@Component({
  selector: 'app-document-requests',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './document-requests.component.html',
  styleUrl: './document-requests.component.scss'
})
export class DocumentRequestsComponent implements OnInit {
  private api = inject(RegistrarApiService);
  private destroyRef = inject(DestroyRef);
  requests: DocumentRequest[] = [];

  ngOnInit() {
    this.api.activeAcademicYear$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(ay => !!ay),
      switchMap(ay => this.api.getDocumentRequests(ay.id))
    ).subscribe({
      next: (data) => this.requests = data,
      error: (err) => console.error('Failed to load data', err)
    });
  }

  statusClass(status: string): string {
    if (status.includes('Ready') || status.includes('Paid')) return 'bg-emerald-50 text-emerald-700';
    if (status.includes('Processing') || status.includes('Verification')) return 'bg-blue-50 text-blue-700';
    if (status.includes('Payment') || status.includes('Pending')) return 'bg-amber-50 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  }

  trackRequest(_: number, item: DocumentRequest): string {
    return item.id;
  }
}
