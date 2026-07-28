import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { WalletService } from '../../../services/wallet.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-expense-breakdown',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, NgxEchartsModule, EmptyStateComponent, SkeletonComponent],
  templateUrl: './expense-breakdown.component.html',
})
export class ExpenseBreakdownComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  faChartPie = faChartPie;
  breakdownTab: 'sankey' | 'sunburst' = 'sankey';
  isBreakdownLoading = true;
  sankeyOptions: EChartsOption = {};
  sunburstOptions: EChartsOption = {};
  rawData: any;
  hasFlowData = false;

  constructor(private walletService: WalletService, private currencyService: CurrencyService) {}

  ngOnInit() {
    this.walletService.getExpenseFlow().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.rawData = data;
        this.updateCharts();
      },
      error: () => { this.isBreakdownLoading = false; }
    });

    this.currencyService.activeCurrency$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.rawData) this.updateCharts();
    });
  }

  updateCharts() {
    const data = this.rawData;

    // The API still returns every category as a node before any money moves. Rendering a
    // sankey with nodes but no links stacks all labels on top of each other, so treat
    // "no links" as no data and show the placeholder instead.
    this.hasFlowData = !!data?.links?.length;
    if (!this.hasFlowData) {
      this.sankeyOptions = {};
      this.sunburstOptions = {};
      this.isBreakdownLoading = false;
      return;
    }

    const currency = this.currencyService.getActiveCurrency();
    const convert = (val: number) => this.currencyService.convert(val, 'LKR', currency);

    // Sankey options
    const nodes = data.nodes.map((n: any) => ({ name: n.name, itemStyle: { color: n.color } }));
    const links = data.links.map((l: any) => ({
      source: l.source,
      target: l.target,
      value: convert(l.value),
      lineStyle: { color: l.color, opacity: 0.4 }
    }));

    this.sankeyOptions = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            return `${params.data.source} → ${params.data.target}: ${currency} ${Number(params.data.value).toLocaleString()}`;
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
      totals[key] = { value: prev.value + convert(l.value), color: prev.color };
    });
    const children = Object.entries(totals).map(([name, info]) => ({ name, value: info.value, itemStyle: { color: info.color } }));
    const root = { name: 'Expenses', children } as any;
    
    this.sunburstOptions = {
      tooltip: { formatter: (p: any) => `${p.name}: ${currency} ${Number(p.value).toLocaleString()}` },
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
  }

  setBreakdownTab(tab: 'sankey' | 'sunburst') {
    this.breakdownTab = tab;
  }

  get breakdownSubtitle(): string {
    return this.breakdownTab === 'sankey' ? 'Income → Wallets → Categories' : 'Categories share';
  }
}
