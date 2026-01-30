import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { PrTable } from "./components/pr-table";
import { PrService } from '../../services/pr.service';
import { PullRequest } from '../../../model/pr';
import { interval, Observable, shareReplay, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-pr-overview',
  imports: [PrTable, AsyncPipe],
  template: `
    <h1>Open Pull Requests</h1>
    @let pullRequests = openPullRequests$ | async;
    @if (!pullRequests) {
      <progress></progress>
    } @else if (pullRequests.length === 0) {
      <p>No open pull requests found.</p>
    } @else {
    <app-pr-table [pullRequests]="pullRequests" />
    }
  `
})
export class PrOverview {

  protected openPullRequests$: Observable<PullRequest[]>;

  constructor(private readonly prService: PrService) {
    this.openPullRequests$ = interval(60_000).pipe(
      startWith(0),
      switchMap(() => this.prService.getOpenPullRequests()),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

}
