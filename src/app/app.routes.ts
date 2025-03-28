import { Routes } from '@angular/router';

export const routes: Routes = [
  // Dashboard General
  {
    path: 'dashboard',
    title: 'Dashboard General',
    loadComponent: () =>
      import('./components/pages/dashboard/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },

  // Módulo Asistencias
  {
    path: 'modulo-asistencias',
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard Asistencias',
        loadComponent: () =>
          import('./components/pages/asistencias/dashboard/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
    ],
  },

  // Módulo Reportes
  {
    path: 'modulo-reportes',
    children: [
      {
        path: 'reportes',
        title: 'Reportes Trimestrales',
        loadComponent: () =>
          import('./components/pages/reportes/report/report.component').then(
            (m) => m.ReportComponent
          ),
      },
    ],
  },

  // Módulo Personas
  {
    path: 'modulo-personas',
    children: [
      {
        path: 'personas',
        title: 'Dashboard Personas',
        loadComponent: () =>
          import('./components/pages/personas/reports-table/reports-table.component').then(
            (m) => m.ReportsTableComponent
          ),
      },
    ],
  },

  // Módulo Familia
  {
    path: 'modulo-familia',
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard Familia',
        loadComponent: () =>
          import('./components/pages/familia/dashboard/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
    ],
  },

  // Redirecciones
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];