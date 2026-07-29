import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AppUpdateComponent } from './shared/components/app-update/app-update.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, AppUpdateComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'expensive-tracker-frontend';
}
