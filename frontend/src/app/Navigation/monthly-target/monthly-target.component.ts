import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faPencil, faTrash, faBullseye } from '@fortawesome/free-solid-svg-icons';
import { RadialChartComponent } from '../../radialchart/radialchart.component';

interface MonthlyTarget {
  id: number;
  month: Date;
  targetAmount: number;
  currentSavings: number;
}

@Component({
  selector: 'app-monthly-target',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RadialChartComponent
  ],
  templateUrl: './monthly-target.component.html',
  styleUrl: './monthly-target.component.css'
})
export class MonthlyTargetComponent implements OnInit {
  faPlus = faPlus;
  faPencil = faPencil;
  faTrash = faTrash;
  faTarget = faBullseye;

  monthlyTargets: MonthlyTarget[] = [];
  isDrawerOpen = false;
  selectedTarget: MonthlyTarget | null = null;
  targetForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.targetForm = this.createForm();
  }

  ngOnInit() {
    // Initialize with sample data or fetch from service
    this.monthlyTargets = [
      {
        id: 1,
        month: new Date(),
        targetAmount: 150000,
        currentSavings: 112500
      }
    ];
  }

  createForm(): FormGroup {
    return this.fb.group({
      month: ['', Validators.required],
      targetAmount: ['', [Validators.required, Validators.min(0)]],
      currentSavings: ['', [Validators.required, Validators.min(0)]]
    });
  }

  openDrawer(target?: MonthlyTarget) {
    this.selectedTarget = target || null;
    if (target) {
      this.targetForm.patchValue({
        month: this.formatDateForInput(target.month),
        targetAmount: target.targetAmount,
        currentSavings: target.currentSavings
      });
    } else {
      this.targetForm.reset();
    }
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedTarget = null;
    this.targetForm.reset();
  }

  onSubmit() {
    if (this.targetForm.valid) {
      const formValue = this.targetForm.value;
      if (this.selectedTarget) {
        // Update existing target
        const index = this.monthlyTargets.findIndex(t => t.id === this.selectedTarget!.id);
        this.monthlyTargets[index] = {
          ...this.selectedTarget,
          ...formValue
        };
      } else {
        // Add new target
        this.monthlyTargets.push({
          id: this.monthlyTargets.length + 1,
          ...formValue
        });
      }
      this.closeDrawer();
    }
  }

  deleteTarget(id: number) {
    this.monthlyTargets = this.monthlyTargets.filter(target => target.id !== id);
  }

  get formIsValid(): boolean {
    return this.targetForm.valid;
  }

  get monthErrors() {
    const control = this.targetForm.get('month');
    return {
      required: control?.errors?.['required'] && control.touched
    };
  }

  get targetAmountErrors() {
    const control = this.targetForm.get('targetAmount');
    return {
      required: control?.errors?.['required'] && control.touched,
      min: control?.errors?.['min'] && control.touched
    };
  }

  get currentSavingsErrors() {
    const control = this.targetForm.get('currentSavings');
    return {
      required: control?.errors?.['required'] && control.touched,
      min: control?.errors?.['min'] && control.touched
    };
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().substring(0, 7);
  }
}
