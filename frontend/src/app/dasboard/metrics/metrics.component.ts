import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { Metric } from '../../models/Metric';

@Component({
  selector: 'app-metrics',
  imports: [CommonModule, BadgeComponent],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.css']
})
export class MetricsComponent {
  metrics: Metric[] = [
    {
      icon: 'fa-users',
      label: 'Customers',
      value: 3782,
      percentage: 11.01,
      trend: 'up'
    },
    {
      icon: 'fa-box',
      label: 'Orders',
      value: 5359,
      percentage: 9.05,
      trend: 'down'
    }
  ];
}
