import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { Metric } from '../../models/Metric';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.css']
})
export class MetricsComponent {
  metrics: Metric[] = [
    {
      icon: 'group',
      label: 'Customers',
      value: 3782,
      percentage: 11.01,
      trend: 'up'
    },
    {
      icon: 'inventory_2',
      label: 'Orders',
      value: 5359,
      percentage: 9.05,
      trend: 'down'
    }
  ];
}
