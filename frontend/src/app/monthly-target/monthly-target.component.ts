import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RadialChartComponent } from '../radialchart/radialchart.component';
import { TargetService } from '../services/target.service';

@Component({
  selector: 'app-monthly-target',
  standalone: true,
  imports: [CommonModule, RadialChartComponent],
  templateUrl: './monthly-target.component.html',
  styleUrl: './monthly-target.component.css'
})
export class MonthlyTargetComponent implements OnInit {
  averageTarget: number = 0;
  averageSavings: number = 0;
  previousMonthAverage: number = 0;

  constructor(private targetService: TargetService) {}

  ngOnInit() {
    // Get current average target and savings
    this.targetService.getAverageTarget().subscribe(average => {
      this.averageTarget = average.averageTarget;
      this.averageSavings = average.averageSavings;
    });

    // Get previous period average
    this.targetService.getPreviousPeriodAverage().subscribe(average => {
      this.previousMonthAverage = average;
    });
  }

  getAverageProgressPercentage(): number {
    return this.averageTarget > 0 ? (this.averageSavings / this.averageTarget) * 100 : 0;
  }

  getAverageChange(): number {
    return this.previousMonthAverage > 0 ?
      ((this.averageSavings - this.previousMonthAverage) / this.previousMonthAverage) * 100 : 0;
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString()}`;
  }
}
