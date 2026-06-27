import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
 providers: [
  provideRouter(routes),
  importProvidersFrom(FormsModule),
  provideHttpClient(),
  provideCharts(withDefaultRegisterables())  // ✅ HERE
]
};
