import { bootstrapApplication } from '@angular/platform-browser';
import { App, appConfig } from './app/app';

try {
  await bootstrapApplication(App, appConfig);
} catch (err) {
  console.error(err);
}