import { Component, OnInit, DestroyRef, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { WalletService, ExpenseFlow, ExpenseFlowLink, ExpenseFlowNode } from '../../../services/wallet.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ThemeService } from '../../../core/services/theme.service';
import { SegmentedControlComponent, SegmentOption } from '../../../shared/components/segmented-control/segmented-control.component';

/**
 * The slices of echarts' tooltip callback params this component actually reads.
 * echarts types them as a broad union; naming just the fields used keeps the
 * formatters checked without dragging in the whole shape.
 */
interface SankeyTooltipParams {
  dataType?: string;
  name: string;
  data: { source?: string; target?: string; value?: number };
}

interface SunburstTooltipParams {
  name: string;
  value?: number;
}

@Component({
  selector: 'app-expense-breakdown',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, NgxEchartsModule, EmptyStateComponent, SkeletonComponent, SegmentedControlComponent],
  templateUrl: './expense-breakdown.component.html',
})
export class ExpenseBreakdownComponent implements OnInit {
  private walletService = inject(WalletService);
  private currencyService = inject(CurrencyService);
  private theme = inject(ThemeService);

  private readonly destroyRef = inject(DestroyRef);

  faChartPie = faChartPie;
  breakdownTab: 'sankey' | 'sunburst' = 'sankey';
  isBreakdownLoading = true;
  sankeyOptions: EChartsOption = {};
  sunburstOptions: EChartsOption = {};
  rawData?: ExpenseFlow;
  hasFlowData = false;

  readonly breakdownViews: SegmentOption<'sankey' | 'sunburst'>[] = [
    { value: 'sankey', label: 'Sankey' },
    { value: 'sunburst', label: 'Sunburst' }
  ];

  constructor() {
    // echarts paints label text into a canvas, so it cannot inherit the CSS
    // theme. The charts are rebuilt whenever the resolved theme flips, which is
    // what keeps their labels legible on both surfaces.
    effect(() => {
      this.theme.resolved();
      if (this.rawData) this.updateCharts();
    });
  }

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
    if (!data || !this.hasFlowData) {
      this.sankeyOptions = {};
      this.sunburstOptions = {};
      this.isBreakdownLoading = false;
      return;
    }

    const currency = this.currencyService.getActiveCurrency();
    const convert = (val: number) => this.currencyService.convert(val, 'LKR', currency);

    // Canvas text cannot read CSS custom properties, so the two label colours
    // are resolved from the current theme here.
    const isDark = this.theme.resolved() === 'dark';
    const labelColor = isDark ? '#cbd5e1' : '#334155';
    const labelStrong = isDark ? '#f1f5f9' : '#0f172a';

    // Sankey options
    const nodes = data.nodes.map((n: ExpenseFlowNode) => ({ name: n.name, itemStyle: { color: n.color } }));
    const links = data.links.map((l: ExpenseFlowLink) => ({
      source: l.source,
      target: l.target,
      value: convert(l.value),
      lineStyle: { color: l.color, opacity: 0.4 }
    }));

    this.sankeyOptions = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        confine: true,
        appendToBody: false,
        formatter: (params: SankeyTooltipParams) => {
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
        /*
          Labels were switched off entirely ("Hide labels to prevent text
          overlay"), which left a wall of anonymous coloured bars — the only way
          to identify a flow was to hover every node in turn. The overlap they
          were avoiding is a spacing problem, so it is solved with spacing:
          a wider node gap, a taller canvas (see the template), and room
          reserved on the right for the final column's labels. Long category
          names truncate rather than collide, and the tooltip still gives the
          full name.
        */
        nodeGap: 18,
        nodeWidth: 14,
        left: 8,
        right: 132,
        top: 16,
        bottom: 16,
        label: {
          show: true,
          position: 'right',
          color: labelColor,
          fontSize: 11,
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 500,
          width: 120,
          overflow: 'truncate'
        },
        lineStyle: { curveness: 0.5 }
      }]
    } as EChartsOption;

    // Sunburst options
    const totals: Record<string, { value: number; color: string }> = {};
    data.links.forEach((l: ExpenseFlowLink) => {
      const key = l.target;
      const prev = totals[key] || { value: 0, color: l.color || '#6366f1' };
      totals[key] = { value: prev.value + convert(l.value), color: prev.color };
    });
    const children = Object.entries(totals).map(([name, info]) => ({ name, value: info.value, itemStyle: { color: info.color } }));
    const root = { name: 'Expenses', children };
    
    this.sunburstOptions = {
      tooltip: { formatter: (p: SunburstTooltipParams) => `${p.name}: ${currency} ${Number(p.value).toLocaleString()}` },
      series: [{
        type: 'sunburst',
        data: [root],
        radius: [0, '85%'],
        sort: undefined,
        emphasis: { focus: 'ancestor' },
        // These two label colours were hardcoded to #111827 / #374151 — near
        // black, and effectively invisible against the dark surface once the
        // theme started working. They follow the theme now.
        levels: [
          {},
          { r0: '0%', r: '30%', label: { rotate: 0, color: labelStrong, fontFamily: 'Outfit, sans-serif', fontWeight: 600 } },
          { r0: '30%', r: '85%', label: { rotate: 'radial', color: labelColor, fontSize: 12, fontFamily: 'Outfit, sans-serif' } }
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
