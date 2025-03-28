import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "./common/navbar/navbar.component";
import { SidemenuComponent } from "./common/sidemenu/sidemenu.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NavbarComponent,
    SidemenuComponent
  ],
  template: `
    <div class="flex h-screen overflow-hidden">
      <app-sidemenu></app-sidemenu>
      <div class="flex flex-col flex-1">
        <app-navbar></app-navbar>
        <main class="flex-1 overflow-y-auto bg-gray-100">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppComponent {
  title = 'nphDashboard';
}