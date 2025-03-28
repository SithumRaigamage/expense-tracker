import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface Metric {
  icon: IconDefinition;
  label: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down';
  currency: string;
}
