import { HttpHandlerFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, Component, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouterOutlet, Routes } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export const routes: Routes = [
  {
    path: '', loadComponent: () => import('./components/pr-overview/pr-overview').then(m => m.PrOverview)
  }
];

const token = btoa(`:${localStorage.getItem('azureDevOpsToken')}`);

function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Basic ${token}`
    }
  });
  return next(authReq);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule],
  template: `
    @if (configuring) {
      <dialog open>
        <form [formGroup]="configForm" (ngSubmit)="save()">
          <h1>Please configure your Azure DevOps settings</h1>
          <fieldset>
            <input type="text" formControlName="org" placeholder="Organization" />
            <input type="text" formControlName="proj" placeholder="Project" />
            <input type="password" formControlName="pat" placeholder="Personal Access Token" />
            <button type="submit" [disabled]="configForm.invalid">Save</button>
          </fieldset>
          <small>You can create a <a href="https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops" target="_blank">PAT</a>. Make sure it has at least "Code (Read)" and "Build (Read)" permissions.</small>
        </form>
      </dialog>
    }
    @if (token){
      <nav>
        <span class="material-symbols-outlined" style="cursor: pointer;" title="Toggle dark mode" (click)="toogleDarkMode()">moon_stars</span>
        <span class="material-symbols-outlined" style="cursor: pointer;" title="Reconfigure" (click)="reset()">settings</span>
      </nav>
      <router-outlet />
    }
  `,
  styles: `
    nav {
      position: fixed;
      top: 1rem;
      left: 0;
      right: 0;
      padding: 0 1rem;
      justify-content: flex-end;
      display: flex;
      align-items: center;
      z-index: 1000;
    }

    span.material-symbols-outlined {
      margin-left: 1rem;
    }

  `
})
export class App {
  protected token = localStorage.getItem('azureDevOpsToken');
  protected configuring = !this.token;
  protected configForm: FormGroup;

  constructor(private fb: FormBuilder) {
    const stored = localStorage.getItem('theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    }

    this.configForm = this.fb.group({
      org: [localStorage.getItem('azureDevOpsOrg') || '', Validators.required],
      proj: [localStorage.getItem('azureDevOpsProject') || '', Validators.required],
      pat: [localStorage.getItem('azureDevOpsToken') || '', Validators.required]
    });
  }

  protected save(): void {
    if (this.configForm.invalid) return;
    const { pat, org, proj } = this.configForm.value;
    localStorage.setItem('azureDevOpsToken', pat);
    localStorage.setItem('azureDevOpsOrg', org);
    localStorage.setItem('azureDevOpsProject', proj);
    location.reload();
  }
  protected reset(): void {
    this.configuring = true;
  }
  protected toogleDarkMode(): void {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }
}
