import { Component } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { HeaderComponent } from "../header/header.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dasboard',
  imports: [SidebarComponent, HeaderComponent, CommonModule],
  templateUrl: './dasboard.component.html',
  styleUrl: './dasboard.component.css'
})
export class DasboardComponent {
  darkMode: boolean = false;
  sidebarToggle: boolean = false;

  constructor() {
    const savedDarkMode = localStorage.getItem('darkMode');
    this.darkMode = savedDarkMode ? JSON.parse(savedDarkMode) : false;
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
  }
}
