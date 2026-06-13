import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { registrarReports } from '../../../core/data/registrar.mock';
import { RegistrarReportCard } from '../../../core/models/registrar.models';

@Component({
  selector: 'app-registrar-reports',
  standalone: true,
  imports: [NgFor],
  templateUrl: './registrar-reports.component.html',
  styleUrl: './registrar-reports.component.scss'
})
export class RegistrarReportsComponent {
  readonly reports = registrarReports;

  trackReport(_: number, item: RegistrarReportCard): string {
    return item.title;
  }
}
