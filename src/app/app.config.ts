import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { WebDataProvider } from 'arcaea-toolbelt-data/lib/provider.js';
import { ASSETS_PROVIDER, DATA_PROVIDER } from './core/services/providers';
import { YurisakiService } from './core/services/yurisaki-service';
import { ArcaeaToolbeltDataService } from './core/services/arcaea-toolbelt-data-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    {
      provide: DATA_PROVIDER,
      useFactory: () =>
        new WebDataProvider(
          import.meta.env.NG_APP_ARCAEA_TOOLBELT_DATA ?? import.meta.url
        ),
    },
    {
      provide: ASSETS_PROVIDER,
      // useFactory: () => new YurisakiService(),
      useFactory: () => new ArcaeaToolbeltDataService(),
    },
    provideRouter(routes, withHashLocation()),
  ],
};
