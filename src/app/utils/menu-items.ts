// Definimos una interfaz para el menú
interface MenuItem {
  title: string;
  path: string;
  icon?: string;
  children?: MenuItem[]; // Se asegura que siempre esté definida
}

export const MENU_ITEMS: MenuItem[] = [
  // Dashboard General
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    children: [],
  },

  // Módulo Asistencias
  {
    title: 'Módulo Asistencias',
    path: '/modulo-asistencias',
    children: [
      { title: 'Dashboard', path: '/modulo-asistencias/dashboard', children: [] },
    ],
  },

  // Módulo Reportes
  {
    title: 'Módulo Reportes',
    path: '/modulo-reportes',
    children: [
      { title: 'Reportes Trimestrales', path: '/modulo-reportes/reportes', children: [] },
    ],
  },

  // Módulo Personas
  {
    title: 'Módulo Personas',
    path: '/modulo-personas',
    children: [
      { title: 'Personas', path: '/modulo-personas/personas', children: [] },
    ],
  },

  // Módulo Familia
  {
    title: 'Módulo Familia',
    path: '/modulo-familia',
    children: [
      { title: 'Dashboard', path: '/modulo-familia/dashboard', children: [] },
    ],
  },
];
