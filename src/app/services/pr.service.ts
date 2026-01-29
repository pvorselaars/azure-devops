import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PullRequest } from '../../model/pr';
import { catchError, map, Observable, of, switchMap, forkJoin } from 'rxjs';
import { BuildService } from './build.service';

@Injectable({
  providedIn: 'root',
})
export class PrService {

  private readonly org = localStorage.getItem('azureDevOpsOrg');
  private readonly project = localStorage.getItem('azureDevOpsProject');

  constructor(private readonly http: HttpClient, private readonly buildService: BuildService) {}

  getOpenPullRequests(): Observable<PullRequest[]> {
    const url = `https://dev.azure.com/${this.org}/${this.project}/_apis/git/pullrequests?searchCriteria.status=active&api-version=7.1`;
    return this.http.get<{ value: PullRequest[] }>(url).pipe(
      map(response => response.value || []),
      switchMap(prs => {
        if (!prs.length) return of([]);
        const buildStatusObservables = prs.map(pr => this.buildService.getBuildStatus(pr));
        return forkJoin(buildStatusObservables).pipe(
          map(buildStatuses =>
            prs.map((pr, idx) => {
              const approvals = this.calculateApprovals(pr);
              return { ...pr, approvals, build: buildStatuses[idx] };
            })
          )
        );
      }),
      map(prs => prs.toSorted((a, b) => Date.parse(b.creationDate ?? '') - Date.parse(a.creationDate ?? '')) || []),
      catchError(err => {
        console.error('Error fetching pull requests', err);
        return of([]);
      })
    );
  }

  private calculateApprovals(pr: PullRequest): { received: number; required: number; complete: number } {
    const reviewers = (pr as any).reviewers ?? [];
    const required = reviewers.filter((r: any) => r.isRequired).length;
    const received = reviewers.filter((r: any) => r.vote > 0 && r.isRequired).length;
    const complete = required ? received / required : 0;
    return { received, required, complete };
  }
}