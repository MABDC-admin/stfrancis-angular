import { Component, Input } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { QueueItem } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-work-queue-card',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './work-queue-card.component.html',
  styleUrl: './work-queue-card.component.scss'
})
export class WorkQueueCardComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) subtitle = '';
  @Input({ required: true }) items: QueueItem[] = [];
}
