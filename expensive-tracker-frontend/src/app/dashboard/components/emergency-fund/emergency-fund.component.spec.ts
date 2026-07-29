import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyFundComponent } from './emergency-fund.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockChartComponent } from '../../../shared/mocks/chart.mock';

describe('EmergencyFundComponent', () => {
  let component: EmergencyFundComponent;
  let fixture: ComponentFixture<EmergencyFundComponent>;

  /** A transaction dated `daysAgo` days back, in the shape the component holds. */
  function entry(type: 'deposit' | 'withdrawal', amount: number, daysAgo: number) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      date,
      amount,
      category: 'Savings',
      type,
      balance: 0,
      cumulativeIncome: 0,
      cumulativeExpense: 0
    };
  }

  /** Days elapsed this calendar month, so fixtures can land inside or before it. */
  function daysIntoMonth(): number {
    return new Date().getDate() - 1;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyFundComponent, MockChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmergencyFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('month-to-date change', () => {
    it('is zero when nothing moved this month', () => {
      component.transactions = [];
      expect(component.monthToDateChange).toBe(0);
      expect(component.monthToDatePercent).toBeNull();
    });

    it('nets deposits against withdrawals within the month', () => {
      component.transactions = [
        entry('deposit', 5000, 0),
        entry('withdrawal', 2000, 0)
      ];
      expect(component.monthToDateChange).toBe(3000);
    });

    it('ignores transactions from before the first of the month', () => {
      component.transactions = [entry('deposit', 5000, daysIntoMonth() + 1)];
      expect(component.monthToDateChange).toBe(0);
    });

    it('expresses the change against the balance the month opened with', () => {
      component.transactions = [entry('deposit', 2000, 0)];
      component.currentBalance = 12000; // opened at 10000

      expect(component.monthToDatePercent).toBeCloseTo(20, 5);
    });

    it('reports no percentage when the fund opened the month empty', () => {
      component.transactions = [entry('deposit', 2000, 0)];
      component.currentBalance = 2000; // opened at 0 — nothing to divide by

      expect(component.monthToDateChange).toBe(2000);
      expect(component.monthToDatePercent).toBeNull();
    });

    it('goes negative when more was withdrawn than deposited', () => {
      component.transactions = [entry('withdrawal', 1000, 0)];
      component.currentBalance = 9000;

      expect(component.monthToDateChange).toBe(-1000);
      expect(component.monthToDatePercent).toBeCloseTo(-10, 5);
    });
  });

  describe('months to target', () => {
    it('rounds up the contributions still needed', () => {
      component.currentBalance = 10000;
      component.targetGoal = 100000;
      component.monthlySaveGoal = 15000;

      expect(component.monthsToTarget).toBe(6);
      expect(component.hasReachedTarget).toBeFalse();
    });

    it('is null once the target is reached', () => {
      component.currentBalance = 100000;
      component.targetGoal = 100000;
      component.monthlySaveGoal = 5000;

      expect(component.monthsToTarget).toBeNull();
      expect(component.hasReachedTarget).toBeTrue();
    });

    it('is null when there is no monthly goal to divide by', () => {
      component.currentBalance = 10000;
      component.targetGoal = 100000;
      component.monthlySaveGoal = 0;

      expect(component.monthsToTarget).toBeNull();
    });
  });

  describe('monthly goal', () => {
    it('reports the shortfall when the month is behind', () => {
      component.monthlySaveGoal = 5000;
      component.transactions = [entry('deposit', 2000, 0)];

      expect(component.monthlyGoalShortfall).toBe(3000);
    });

    it('reports no shortfall once the goal is met', () => {
      component.monthlySaveGoal = 5000;
      component.transactions = [entry('deposit', 6000, 0)];

      expect(component.monthlyGoalShortfall).toBe(0);
    });
  });

  describe('progress', () => {
    it('is a share of the target', () => {
      component.currentBalance = 25000;
      component.targetGoal = 100000;

      expect(component.progressPercent).toBeCloseTo(25, 5);
    });

    it('is zero rather than NaN when no target is set', () => {
      component.currentBalance = 25000;
      component.targetGoal = 0;

      expect(component.progressPercent).toBe(0);
    });

    it('clamps above the target instead of overflowing the bar', () => {
      component.currentBalance = 150000;
      component.targetGoal = 100000;

      expect(component.progressPercent).toBe(100);
    });
  });
});
