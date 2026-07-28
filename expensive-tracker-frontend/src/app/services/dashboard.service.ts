import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface WidgetConfig {
  id: string;
  label: string;
  isVisible: boolean;
  order: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly STORAGE_KEY = 'dashboard_widget_config';
  
  private defaultWidgets: WidgetConfig[] = [
    { id: 'metrics', label: 'Key Metrics', isVisible: true, order: 1 },
    { id: 'monthlyStat', label: 'Monthly Statistics', isVisible: true, order: 2 },
    { id: 'expenseFlow', label: 'Fund Flow Analysis', isVisible: true, order: 3 },
    { id: 'expenseBreakdown', label: 'Expense Breakdown', isVisible: true, order: 4 },
    { id: 'statChart', label: 'Detailed Trend Chart', isVisible: true, order: 5 },
    { id: 'wallets', label: 'Wallet Management', isVisible: true, order: 6 },
    { id: 'recentTransactions', label: 'Recent Transactions', isVisible: true, order: 7 },
    { id: 'budgetPlanner', label: 'Budget Planner', isVisible: true, order: 8 },
    { id: 'upcomingBills', label: 'Upcoming Bills', isVisible: true, order: 9 },
    { id: 'emergencyFund', label: 'Emergency Fund', isVisible: true, order: 10 },
    { id: 'financialEducation', label: 'Financial Tips', isVisible: true, order: 11 }
  ];

  private widgetsSubject = new BehaviorSubject<WidgetConfig[]>(this.loadConfig());
  widgets$ = this.widgetsSubject.asObservable();

  constructor() {}

  private loadConfig(): WidgetConfig[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with default to ensure new widgets are added if app updates
        return this.defaultWidgets.map(def => {
          const found = parsed.find((p: any) => p.id === def.id);
          return found ? { ...def, isVisible: found.isVisible, order: found.order } : def;
        });
      } catch (e) {
        console.error('Error parsing dashboard config', e);
      }
    }
    return [...this.defaultWidgets];
  }

  saveConfig(configs: WidgetConfig[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    this.widgetsSubject.next([...configs]);
  }

  toggleWidget(id: string): void {
    const current = this.widgetsSubject.value;
    const updated = current.map(w => 
      w.id === id ? { ...w, isVisible: !w.isVisible } : w
    );
    this.saveConfig(updated);
  }

  resetToDefault(): void {
    this.saveConfig([...this.defaultWidgets]);
  }

  isWidgetVisible(id: string): boolean {
    const widget = this.widgetsSubject.value.find(w => w.id === id);
    return widget ? widget.isVisible : true;
  }
}
