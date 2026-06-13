import { Component } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { AcademicRecord } from '../../../core/models/registrar.models';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-academic-records',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './academic-records.component.html',
  styleUrl: './academic-records.component.scss'
})
export class AcademicRecordsComponent implements OnInit {
  records: AcademicRecord[] = [];
  
  constructor(private api: RegistrarApiService) {}

  ngOnInit() {
    this.api.getAcademicRecords().subscribe(data => this.records = data);
  }

  statusClass(status: string): string {
    if (status === 'Validated') return 'bg-emerald-50 text-emerald-700';
    if (status === 'For Review') return 'bg-blue-50 text-blue-700';
    return 'bg-slate-100 text-slate-700';
  }

  trackRecord(_: number, item: AcademicRecord): string {
    return item.id;
  }
}
