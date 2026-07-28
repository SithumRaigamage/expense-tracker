import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  /** Keep the item type through the filter so callers do not lose it. */
  transform<T>(items: T[], field: keyof T, value: T[keyof T]): T[] {
    if (!items) return [];
    if (!value || !field) return items;

    return items.filter(item => item[field] === value);
  }
}
