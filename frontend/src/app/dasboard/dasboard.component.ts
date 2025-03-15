import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Metric } from '../models/Metric';
import { BadgeComponent } from './badge/badge.component';
import { MetricsComponent } from "./metrics/metrics.component";
import { MonthlyTargetComponent } from "../monthly-target/monthly-target.component";
import { MonthlyStatComponent } from "../monthly-stat/monthly-stat.component";


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BadgeComponent, MetricsComponent, MonthlyTargetComponent, MonthlyStatComponent],
  templateUrl: './dasboard.component.html',
  styleUrl: './dasboard.component.css'
})
export class DashboardComponent {
}
