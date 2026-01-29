import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { PrTable } from "./components/pr-table";
import { PrService } from '../../services/pr.service';
import { PullRequest } from '../../../model/pr';
import { Observable } from 'rxjs';

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
  `,
})
export class PrOverview {

  protected openPullRequests$: Observable<PullRequest[]>;

  constructor(private readonly prService: PrService) {
    this.openPullRequests$ = this.prService.getOpenPullRequests();
  }

}
