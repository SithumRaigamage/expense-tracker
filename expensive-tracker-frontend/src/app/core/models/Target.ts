export interface Target {
  id: number;
  month: Date;
  targetAmount: number;
  currentSavings: number;
  remainingDays?: number;
  dailyTarget?: number;
}
