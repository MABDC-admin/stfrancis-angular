import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { StatCard } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  @Input({ required: true }) stat!: StatCard;
}
