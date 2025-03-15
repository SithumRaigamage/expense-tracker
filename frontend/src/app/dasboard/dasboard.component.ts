import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Metric } from '../models/Metric';
import { BadgeComponent } from './badge/badge.component';
import { MetricsComponent } from "./metrics/metrics.component";


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BadgeComponent, MetricsComponent],
  templateUrl: './dasboard.component.html',
  styleUrl: './dasboard.component.css'
})
export class DashboardComponent {
  metrics: Metric[] = [
    {
      icon: 'group',
      label: 'Customers',
      value: 3782,
      percentage: 11.01,
      trend: 'up'
    },
    {
      icon: 'box',
      label: 'Orders',
      value: 5359,
      percentage: 9.05,
      trend: 'down'
    }
  ];
}
