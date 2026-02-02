import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  template: `
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
  `,
  styles: ``,
})
export class Settings {
  protected configForm: FormGroup;

  constructor(private readonly fb: FormBuilder, protected readonly configService: ConfigService) {
    this.configForm = this.fb.group({
      org: [this.configService.org || '', Validators.required],
      proj: [this.configService.project || '', Validators.required],
      pat: [this.configService.token || '', Validators.required]
    });
  }
  
  protected save(): void {
    if (this.configForm.invalid) return;
    const { pat, org, proj } = this.configForm.value;
    this.configService.token = pat;
    this.configService.org = org;
    this.configService.project = proj;
    this.configService.configuring = false;
    this.configService.auth = btoa(`:${pat}`);
  }
}
