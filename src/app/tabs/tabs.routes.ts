import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'monitor',
        loadComponent: () =>
          import('../monitor/monitor.page').then((m) => m.MonitorPage),
      },
      {
        path: 'breathing',
        loadComponent: () =>
          import('../breathing/breathing.page').then((m) => m.BreathingPage),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('../history/history.page').then((m) => m.HistoryPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
