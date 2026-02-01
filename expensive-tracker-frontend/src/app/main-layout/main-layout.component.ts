import { Component } from '@angular/core';
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { HeaderComponent } from "./components/header/header.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [HeaderComponent, SidebarComponent,RouterModule],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {

}
