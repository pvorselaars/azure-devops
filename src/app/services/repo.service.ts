import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RepoService {
  private readonly org = localStorage.getItem('azureDevOpsOrg');
  private readonly project = localStorage.getItem('azureDevOpsProject');
  
  public constructor(private readonly http: HttpClient) {}

  public getLatestCommitDate(repoId: string, branchName: string): Observable<string> {
    const url = `https://dev.azure.com/${this.org}/${this.project}/_apis/git/repositories/${repoId}/stats/branches?name=${branchName}&$top=1&api-version=7.1`;
    return this.http.get<{ commit: { committer: { date: string }}}>(url).pipe(
      map(response => {
        return response.commit?.committer?.date ?? '';
      })
    );
  }

}
