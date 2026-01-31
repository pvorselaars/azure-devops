import { HttpHandlerFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, Component, provideBrowserGlobalErrorListeners } from '@angular/core';
import { NavigationEnd, provideRouter, Router, RouterOutlet, Routes } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrOverview } from './components/pr-overview/pr-overview';
import { filter } from 'rxjs';

export const routes: Routes = [
  {
    path: 'pull-requests', component: PrOverview, data: { title: 'Open Pull Requests' }
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
          <small>You can create a <a href="https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops" target="_blank">PAT</a>. Make sure it has at least "Code (Read)" and "Build (Read)" permissions.</small>
          <fieldset>
            <input type="text" formControlName="org" placeholder="Organization" />
            <input type="text" formControlName="proj" placeholder="Project" />
            <input type="password" formControlName="pat" placeholder="Personal Access Token" />
            <button type="submit" [disabled]="configForm.invalid">Save</button>
          </fieldset>
        </form>
      </dialog>
    }
    @if (token){
      <nav>
        <span>{{title}}</span>
        <span title="Pull Request" (click)="nav('pull-requests')" style="cursor: pointer;">
          <svg width="24" height="24" viewBox="0 0 20 20" style="vertical-align:middle; color:inherit" stroke-width="2" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" focusable="false">
          <path d="M5.5 7.95852C6.91886 7.72048 8 6.4865 8 5C8 3.34315 6.65685 2 5 2C3.34315 2 2 3.34315 2 5C2 6.4865 3.08114 7.72048 4.5 7.95852L4.5 12.0415C3.08114 12.2795 2 13.5135 2 15C2 16.6569 3.34315 18 5 18C6.65685 18 8 16.6569 8 15C8 13.5135 6.91886 12.2795 5.5 12.0415L5.5 7.95852ZM5 7C3.89543 7 3 6.10457 3 5C3 3.89543 3.89543 3 5 3C6.10457 3 7 3.89543 7 5C7 6.10457 6.10457 7 5 7ZM7 15C7 16.1046 6.10457 17 5 17C3.89543 17 3 16.1046 3 15C3 13.8954 3.89543 13 5 13C6.10457 13 7 13.8954 7 15ZM11.1464 6.85355C11.3417 7.04882 11.6583 7.04882 11.8536 6.85355C12.0488 6.65829 12.0488 6.34171 11.8536 6.14645L10.7071 5H12.5C13.8807 5 15 6.11929 15 7.5V12C13.3431 12 12 13.3431 12 15C12 16.6569 13.3431 18 15 18C16.6569 18 18 16.6569 18 15C18 13.6938 17.1652 12.5825 16 12.1707V7.5C16 5.567 14.433 4 12.5 4H10.7071L11.8536 2.85355C12.0488 2.65829 12.0488 2.34171 11.8536 2.14645C11.6583 1.95118 11.3417 1.95118 11.1464 2.14645L9.14645 4.14645C8.95118 4.34171 8.95118 4.65829 9.14645 4.85355L11.1464 6.85355ZM17 15C17 16.1046 16.1046 17 15 17C13.8954 17 13 16.1046 13 15C13 13.8954 13.8954 13 15 13C16.1046 13 17 13.8954 17 15Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          </svg>
        </span>
        <span class="material-symbols-outlined" style="cursor: pointer;" title="Toggle dark mode" (click)="toggleDarkMode()">moon_stars</span>
        <span class="material-symbols-outlined" style="cursor: pointer;" title="Reconfigure" (click)="reset()">settings</span>
      </nav>
      <router-outlet />
    }
  `,
  styles: `
    nav {
      top: 1rem;
      padding: 1rem;
      justify-content: flex-end;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    nav span:first-child {
      margin-right: auto;
      font-weight: bold;
    }

  `
})
export class App {
  protected token = localStorage.getItem('azureDevOpsToken');
  protected configuring = !this.token;
  protected configForm: FormGroup;

  protected title = '';

  constructor(private readonly fb: FormBuilder, private readonly router: Router) {
    const stored = localStorage.getItem('theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    }

    this.configForm = this.fb.group({
      org: [localStorage.getItem('azureDevOpsOrg') || '', Validators.required],
      proj: [localStorage.getItem('azureDevOpsProject') || '', Validators.required],
      pat: [localStorage.getItem('azureDevOpsToken') || '', Validators.required]
    });

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      let route = this.router.routerState.root;
      while (route.firstChild) route = route.firstChild;
      this.title = route.snapshot.data['title'] || route.snapshot.routeConfig?.path || '';
    });
  }

  protected nav(path: string): void {
    this.router.navigate([path]);
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

  protected toggleDarkMode(): void {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

}
