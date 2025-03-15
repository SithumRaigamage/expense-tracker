import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DasboardComponent } from "./dasboard/dasboard.component";
import { MainLayoutComponent } from "./main-layout/main-layout.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DasboardComponent, MainLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
