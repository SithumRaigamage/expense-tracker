export interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  status: 'Upcoming' | 'Due Today' | 'Overdue';
  iconUrl: string;
  provider: string;
  reminderSet?: boolean;
}
