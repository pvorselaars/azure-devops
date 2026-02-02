import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Environment } from '../../model/environment';
import { forkJoin, interval, of, Observable } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DeploymentService {

  public environments$: Observable<Environment[]>;

  constructor(private readonly http: HttpClient
  ) {
    this.environments$ = interval(60_000).pipe(
      startWith(0),
      switchMap(() => this.loadEnvironments()),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  }

  public getDeployedEnvironments(commit: string): Observable<Environment[]> {
    return this.environments$.pipe(
      map(envs => envs.filter(env => env.commit === commit))
    );
  }

  public loadEnvironments(): Observable<Environment[]> {
    const envsUrl = `_apis/pipelines/environments?api-version=7.1`;

    return this.http.get<{ value: Environment[] }>(envsUrl).pipe(
      map(resp => resp.value ?? []),
      switchMap(envs => {
        if (!envs.length) return of([] as Environment[]);

        const envDetail$ = envs.map(env => {
          const recordsUrl = `_apis/pipelines/environments/${env.id}/environmentdeploymentrecords?top=1&api-version=7.1`;

          return this.http.get<{ value: any[] }>(recordsUrl).pipe(
            map(r => r.value?.[0]?.owner?._links?.self?.href ?? null),
            switchMap(href => href ? this.http.get<any>(href) : of(null)),
            map(full => {
              env.commit = full?.sourceVersion ?? null;
              return env;
            }),
            catchError(() => {
              return of(env);
            })
          );
        });

        return forkJoin(envDetail$);
      })
    );
  }

}
