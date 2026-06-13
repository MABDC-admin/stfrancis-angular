import { Component, Input } from '@angular/core';
import { NgClass, NgFor, NgStyle } from '@angular/common';
import { ProgressItem } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-progress-summary',
  standalone: true,
  imports: [NgFor, NgClass, NgStyle],
  templateUrl: './progress-summary.component.html',
  styleUrl: './progress-summary.component.scss'
})
export class ProgressSummaryComponent {
  @Input({ required: true }) items: ProgressItem[] = [];
}
