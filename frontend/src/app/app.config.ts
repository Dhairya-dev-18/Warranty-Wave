import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/jwt.interceptor';
import { mockApiInterceptor } from './core/mock-api.interceptor';

/** The interceptor remains for demo-only routes; implemented API prefixes pass through to Spring Boot. */
export const USE_MOCK_API = true;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors(USE_MOCK_API ? [jwtInterceptor, mockApiInterceptor] : [jwtInterceptor])),
    provideAnimationsAsync(),
  ],
};
