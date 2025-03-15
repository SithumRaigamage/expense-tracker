export interface Metric {
  icon: string;
  label: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down';
}
