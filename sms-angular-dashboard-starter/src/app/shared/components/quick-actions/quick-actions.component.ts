import { Component, Input } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { QuickAction } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss'
})
export class QuickActionsComponent {
  @Input({ required: true }) actions: QuickAction[] = [];
}
