import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BuildService {
  
  private readonly org = localStorage.getItem('azureDevOpsOrg');
  private readonly project = localStorage.getItem('azureDevOpsProject');

  constructor(private readonly http: HttpClient) {}

  getBuildStatus(pullRequestId: number): Observable<string> {
    const buildsUrl = `https://dev.azure.com/${this.org}/${this.project}/_apis/build/builds?branchName=refs/pull/${pullRequestId}/merge&reasonFilter=pullRequest&api-version=7.1`;
    return this.http.get<{ value: any[] }>(buildsUrl).pipe(
      map(res => res?.value || []),
      map(builds => {
        if (!builds || builds.length === 0) return 'pending';

        const latestByDef = new Map<string, any>();
        for (const b of builds) {
          const defKey = b.definition?.id ? String(b.definition.id) : (b.definition?.name ?? 'unknown');
          const cur = latestByDef.get(defKey);
          if (!cur) {
            latestByDef.set(defKey, b);
            continue;
          }

          const bRev = Number(b.buildNumberRevision);
          const curRev = Number(cur.buildNumberRevision);
          if (bRev > curRev) latestByDef.set(defKey, b);
        }

        const latest = Array.from(latestByDef.values());
        if (latest.some(b => ((b.status || '') as string).toLowerCase() !== 'completed')) return 'pending';
        if (latest.some(b => ((b.result || '') as string).toLowerCase() !== 'succeeded')) return 'failing';
        return 'passing';
      }),
      catchError(err => {
        console.error('Error fetching builds', err);
        return of('unknown');
      })
    );
  }
  
}
