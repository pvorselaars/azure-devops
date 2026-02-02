import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { PrTable } from "./components/pr-table";
import { PrService } from '../../services/pr.service';
import { PullRequest } from '../../../model/pr';
import { interval, Observable, shareReplay, startWith, switchMap } from 'rxjs';
import { DeploymentService } from '../../services/deployment.service';

@Component({
  selector: 'app-pr-overview',
  imports: [PrTable, AsyncPipe],
  template: `
    @let openPullRequests = openPullRequests$ | async;
    <input type="search" placeholder="Search pull requests..." (input)="searchTerm = $event.target.value.toLowerCase()" />
    <h2>Open</h2>
    @if (!openPullRequests) {
      <progress></progress>
    } @else if (openPullRequests.length === 0) {
      <p>No open pull requests found.</p>
    } @else {
    <app-pr-table [pullRequests]="openPullRequests" [searchTerm]="searchTerm"></app-pr-table>
    }

    @let completedPullRequests = completedPullRequests$ | async;
    <h2>Completed</h2>
    @if (!completedPullRequests) {
      <progress></progress>
    } @else if (completedPullRequests.length === 0) {
      <p>No completed pull requests found.</p>
    } @else {
    <app-pr-table [pullRequests]="completedPullRequests" [searchTerm]="searchTerm"></app-pr-table>
    }
  `,
  styles: `
    progress,
    h2 {
      margin: 1rem;
    }

  `
})
export class PrOverview {

  protected openPullRequests$: Observable<PullRequest[]>;
  protected completedPullRequests$: Observable<PullRequest[]>;
  protected searchTerm: string = '';

  constructor(private readonly prs: PrService, private readonly deployments: DeploymentService) {
    this.openPullRequests$ = interval(60_000).pipe(
      startWith(0),
      switchMap(() => this.prs.getOpenPullRequests()),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.completedPullRequests$ = interval(60_000).pipe(
      startWith(0),
      switchMap(() => this.prs.getCompletedPullRequests()),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

}
