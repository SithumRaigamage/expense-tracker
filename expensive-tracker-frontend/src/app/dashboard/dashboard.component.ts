import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGear, faEye, faEyeSlash, faTimes, faArrowsRotate, faChartPie } from '@fortawesome/free-solid-svg-icons';
import { DashboardService, WidgetConfig } from '../services/dashboard.service';
import { MetricsComponent } from "./components/metrics/metrics.component";
import { MonthlyStatComponent } from "./components/monthly-stat/monthly-stat.component";
import { StatchartComponent } from "./components/statchart/statchart.component";
import { RecentTransactionsComponent } from "./components/recent-transactions/recent-transactions.component";
import { ManageWalletsComponent } from "./components/manage-wallets/manage-wallets.component";

import { BudgetPlannerComponent } from "./components/budget-planner/budget-planner.component";
import { UpcomingBillsComponent } from './components/upcoming-bills/upcoming-bills.component';
import { EmergencyFundComponent } from './components/emergency-fund/emergency-fund.component';
import { FinancialEducationComponent } from './components/financial-education/financial-education.component';
import { ExpenseFlowComponent } from './components/expense-flow/expense-flow.component';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { WalletService } from '../services/wallet.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    MetricsComponent,
    MonthlyStatComponent,
    StatchartComponent,
    RecentTransactionsComponent,
    ManageWalletsComponent,
    BudgetPlannerComponent,
    UpcomingBillsComponent,
    EmergencyFundComponent,
    FinancialEducationComponent,
    ExpenseFlowComponent,
    NgxEchartsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  faGear = faGear;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faTimes = faTimes;
  faArrowsRotate = faArrowsRotate;
  faChartPie = faChartPie;

  isCustomizing = false;
  widgets: WidgetConfig[] = [];
  breakdownTab: 'sankey' | 'sunburst' = 'sankey';
  isBreakdownLoading = true;
  sankeyOptions: EChartsOption = {};
  sunburstOptions: EChartsOption = {};

  constructor(private dashboardService: DashboardService, private walletService: WalletService) {}

  ngOnInit() {
    this.dashboardService.widgets$.subscribe(widgets => {
      this.widgets = widgets;
    });

    // Load flow data for Expense Breakdown charts
    this.walletService.getExpenseFlow().subscribe({
      next: (data) => {
        // Sankey options
        const nodes = data.nodes.map((n: any) => ({ name: n.name, itemStyle: { color: n.color } }));
        const links = data.links.map((l: any) => ({ source: l.source, target: l.target, value: l.value, lineStyle: { color: l.color, opacity: 0.4 } }));
        this.sankeyOptions = {
          tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove',
            formatter: (params: any) => {
              if (params.dataType === 'edge') {
                return `${params.data.source} → ${params.data.target}: LKR ${Number(params.data.value).toLocaleString()}`;
              }
              return `${params.name}`;
            }
          },
          series: [{
            type: 'sankey',
            data: nodes,
            links: links,
            emphasis: { focus: 'adjacency' },
            nodeGap: 12,
            nodeWidth: 12,
            label: { fontSize: 11, color: '#374151' },
            lineStyle: { curveness: 0.5 }
          }]
        } as EChartsOption;

        // Sunburst options
        const totals: Record<string, { value: number; color: string }> = {};
        data.links.forEach((l: any) => {
          const key = l.target;
          const prev = totals[key] || { value: 0, color: l.color || '#6366f1' };
          totals[key] = { value: prev.value + l.value, color: prev.color };
        });
        const children = Object.entries(totals).map(([name, info]) => ({ name, value: info.value, itemStyle: { color: info.color } }));
        const root = { name: 'Expenses', children } as any;
        this.sunburstOptions = {
          tooltip: { formatter: (p: any) => `${p.name}: LKR ${Number(p.value).toLocaleString()}` },
          series: [{
            type: 'sunburst',
            data: [root],
            radius: [0, '85%'],
            sort: undefined,
            emphasis: { focus: 'ancestor' },
            levels: [
              {},
              { r0: '0%', r: '30%', label: { rotate: 0, color: '#111827' } },
              { r0: '30%', r: '85%', label: { rotate: 'radial', color: '#374151', fontSize: 12 } }
            ]
          }]
        } as EChartsOption;

        this.isBreakdownLoading = false;
      },
      error: () => { this.isBreakdownLoading = false; }
    });
  }

  toggleDrawer() {
    this.isCustomizing = !this.isCustomizing;
  }

  toggleWidget(id: string) {
    this.dashboardService.toggleWidget(id);
  }

  resetWidgets() {
    this.dashboardService.resetToDefault();
  }

  isVisible(id: string): boolean {
    return this.dashboardService.isWidgetVisible(id);
  }

  setBreakdownTab(tab: 'sankey' | 'sunburst') {
    this.breakdownTab = tab;
  }

  get breakdownSubtitle(): string {
    return this.breakdownTab === 'sankey' ? 'Wallets → Categories' : 'Categories share';
  }
}
