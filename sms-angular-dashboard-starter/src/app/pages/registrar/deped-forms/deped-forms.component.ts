import { Component } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { OnInit, inject, DestroyRef } from '@angular/core';
import { switchMap, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { DepEdFormRecord } from '../../../core/models/registrar.models';

@Component({
  selector: 'app-deped-forms',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './deped-forms.component.html',
  styleUrl: './deped-forms.component.scss'
})
export class DepedFormsComponent implements OnInit {
  private api = inject(RegistrarApiService);
  private destroyRef = inject(DestroyRef);
  forms: DepEdFormRecord[] = [];

  ngOnInit() {
    this.api.activeAcademicYear$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(ay => !!ay),
      switchMap(ay => this.api.getDepedForms(ay.id))
    ).subscribe({
      next: (data) => this.forms = data,
      error: (err) => console.error('Failed to load data', err)
    });
  }

  statusClass(status: string): string {
    if (status.includes('Ready') || status.includes('Template')) return 'bg-emerald-50 text-emerald-700';
    if (status.includes('validation')) return 'bg-blue-50 text-blue-700';
    if (status.includes('Needs')) return 'bg-amber-50 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  }

  trackForm(_: number, item: DepEdFormRecord): string {
    return item.id;
  }
}
