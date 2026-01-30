import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PullRequest } from '../../model/pr';
import { catchError, map, Observable, of, switchMap, forkJoin } from 'rxjs';
import { PolicyEvaluationRecord } from '../../model/evaluation';

@Injectable({
  providedIn: 'root',
})
export class PrService {

  private readonly org = localStorage.getItem('azureDevOpsOrg');
  private readonly project = localStorage.getItem('azureDevOpsProject');

  constructor(private readonly http: HttpClient) {}

  getOpenPullRequests(): Observable<PullRequest[]> {
    const url = `https://dev.azure.com/${this.org}/${this.project}/_apis/git/pullrequests?searchCriteria.status=active&api-version=7.1`;
    return this.http.get<{ value: PullRequest[] }>(url).pipe(
      map(response => response.value ?? []),
      switchMap(prs => (prs.length ? this.enrich(prs) : of([]))),
      map(prs => {
        return prs.slice().sort((a, b) => Date.parse(b.creationDate ?? '') - Date.parse(a.creationDate ?? ''));
      }),
      catchError(err => {
        console.error('Error fetching pull requests', err);
        return of([]);
      })
    );
  }

  private enrich(prs: PullRequest[]): Observable<PullRequest[]> {
    const perPrObservables = prs.map(pr =>
      forkJoin({
        policyStatuses: this.getPolicyStatus(pr.repository.project.id, pr.pullRequestId),
        comments: this.getComments(pr)
      })
    );

    return forkJoin(perPrObservables).pipe(
      map(results =>
        prs.map((pr, idx) => {
          const { policyStatuses = [], comments = [] } = results[idx] ?? {};
          const approvals = this.calculateApprovals(pr);
          const policies = (policyStatuses ?? []).filter(ps => ps.configuration?.type?.displayName !== 'Require a merge strategy');
          const commentCount = comments.length;
          const passRate = policies.length ? policies.filter(p => p.status === 'approved').length / policies.length : 0;
          return { ...pr, approvals, policies, comments: commentCount, passRate };
        })
      )
    );
  }

  private calculateApprovals(pr: PullRequest): { received: number; required: number; complete: number } {
    const required = pr.reviewers.filter((r: any) => r.isRequired).length;
    const received = pr.reviewers.filter((r: any) => r.vote > 0 && r.isRequired).length;
    const complete = required ? received / required : 0;
    return { received, required, complete };
  }

  private getPolicyStatus(projectId: string, pullRequestId: number): Observable<PolicyEvaluationRecord[]> {
    const url = `https://dev.azure.com/${this.org}/${this.project}/_apis/policy/evaluations?artifactId=vstfs:///CodeReview/CodeReviewId/${projectId}/${pullRequestId}&api-version=7.1-preview`;
    return this.http.get<{ value: PolicyEvaluationRecord[] }>(url).pipe(
      map(response => response.value || [])
    );
  }

  private getComments(pr: PullRequest): Observable<any[]> {
    const url = `https://dev.azure.com/${this.org}/${this.project}/_apis/git/repositories/${pr.repository.id}/pullRequests/${pr.pullRequestId}/threads?api-version=7.1`;
    return this.http.get<{ value: any[] }>(url).pipe(
      map(response => response.value.filter(thread => thread.pullRequestThreadContext && !thread.isDeleted) || [])
    );
  }
}