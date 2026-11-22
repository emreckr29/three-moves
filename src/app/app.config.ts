import {
  ApplicationConfig,
  InjectionToken,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

export const PRODUCTION_GAME_URL = new InjectionToken<`https://${string}` | null>(
  'Production game URL',
  {
    factory: () => 'https://three-moves-roan.vercel.app/',
  },
);
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
