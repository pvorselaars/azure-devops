import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {

  public token = localStorage.getItem('azureDevOpsToken') || '';
  public auth = btoa(`:${this.token}`);
  public org = localStorage.getItem('azureDevOpsOrg') || ''
  public project = localStorage.getItem('azureDevOpsProject') || ''
  public theme = localStorage.getItem('theme') || 'light';

  public configuring = false;

}
