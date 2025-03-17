import { Component } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { HeaderComponent } from "../header/header.component";
import { ChartComponent } from "../chart/chart.component";
import { DashboardComponent } from '../dasboard/dasboard.component';

@Component({
  selector: 'app-main-layout',
  imports: [HeaderComponent, ChartComponent, DashboardComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

}
