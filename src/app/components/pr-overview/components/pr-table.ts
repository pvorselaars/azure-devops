import { Component, Input } from '@angular/core';
import { PullRequest } from '../../../../model/pr';
import { MarkdownPipe } from "../../../pipes/markdown.pipe";
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-pr-table',
  template: `
    <table>
      <thead>
          <th (click)="toggleSort('pullRequestId', 'number')">
            ID
            @if (sortColumn === 'pullRequestId') {
              <span class="material-symbols-outlined">
                {{ sortDirection === 1 ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
              </span>
            }
          </th>
          <th (click)="toggleSort('title', 'string')">
            Title
            @if (sortColumn === 'title') {
              <span class="material-symbols-outlined">
                {{ sortDirection === 1 ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
              </span>
            }
          </th>
          <th (click)="toggleSort('createdBy.displayName', 'string')">
            Author
            @if (sortColumn === 'createdBy.displayName') {
              <span class="material-symbols-outlined">
                {{ sortDirection === 1 ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
              </span>
            }
          </th>
          <th (click)="toggleSort('repository.name', 'string')">
            Repository
            @if (sortColumn === 'repository.name') {
              <span class="material-symbols-outlined">
                {{ sortDirection === 1 ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
              </span>
            }
          </th>
          <th (click)="toggleSort('approvals.complete', 'number')">
            Approvals
              @if (sortColumn === 'approvals.complete') {
                <span class="material-symbols-outlined">
                  {{ sortDirection === 1 ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
                </span>
              }
          </th>
          <th (click)="toggleSort('build', 'string')">Build</th>
      </thead>
      <tbody>
        @for (pr of pullRequests; track pr.pullRequestId) {
        <tr (click)="selected === pr ? selected = undefined : selected = pr"
            [class.selected]="selected === pr"
            [class.success]="pr.build === 'passing' && pr.approvals?.complete === 1 && !pr.isDraft"
            [class.draft]="pr.isDraft"
            style="cursor: pointer;"
            >
          <td>{{ pr.pullRequestId }}</td>
          <td>
            <a (click)="goto(pr.repository, pr.pullRequestId)">
              {{ pr.title }}
              @if (pr.isDraft) {
                <span class="material-symbols-outlined info" title="Draft">design_services</span>
              }
            </a>
          </td>
          <td>
            <img [src]="pr.createdBy._links.avatar.href"
                 alt="{{ pr.createdBy.displayName }}"
                 width="24" height="24"
                 style="vertical-align: middle; border-radius: 50%; margin-right: 4px;"
            />
            {{ pr.createdBy.displayName }}
          </td>
          <td>{{ pr.repository.name }}</td>
            @if (pr.approvals) {
            <td>{{ pr.approvals.received }} / {{ pr.approvals.required }} 
              @if (pr.approvals.received === pr.approvals.required && pr.approvals.required !== 0) {
              <span class="material-symbols-outlined success">thumb_up</span>
              }
            </td>
            }
            @else {
              <td>~</td>
            }
          <td>
            @if (pr.build === 'passing') {
              <span class="material-symbols-outlined success">check_circle</span>
            }
            @else if (pr.build === 'pending') {
              <span class="material-symbols-outlined info">hourglass_top</span>
            }
            @else if (pr.build === 'expired') {
              <span class="material-symbols-outlined warning">schedule</span>
            }
            @else {
              <span class="material-symbols-outlined danger">error</span>
            }
          </td>
        </tr>
          @if (selected?.pullRequestId === pr.pullRequestId) {
          <tr (click)="selected = undefined" style="cursor: pointer;">
            <td colspan="6">
              <div [innerHtml]="selected!.description | markdown | async"></div>
            </td>
          </tr>
          }
        }
      </tbody>
    </table>
  `,
  styles: `
    th { cursor: pointer; vertical-align: middle; text-align: left; }
    .material-symbols-outlined { font-size: 20px; line-height: 1; vertical-align: middle; }

    .draft { filter: brightness(50%); }
    tr.selected { border-bottom: none; }
  `,
  imports: [MarkdownPipe, AsyncPipe],
})
export class PrTable {

  @Input()
  pullRequests: PullRequest[] = [];

  protected sortColumn: string = '';
  protected sortDirection: 1 | -1 = 1;

  protected selected?: PullRequest;

  protected toggleSort(column: string, type: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 1 ? -1 : 1;
    } else {
      this.sortColumn = column;
      this.sortDirection = 1;
    }

    const direction = this.sortDirection;

    const getValue = (obj: any, path: string) => {
      if (!obj || !path) return undefined;
      return path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
    };

    this.pullRequests = [...this.pullRequests].sort((a, b) => {
      const aVal = getValue(a, column);
      const bVal = getValue(b, column);

      if (type === 'string') {
        const av = String(aVal ?? '');
        const bv = String(bVal ?? '');
        const cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
        if (cmp !== 0) return cmp * direction;
      } else if (type === 'number') {
        const av = Number(aVal ?? 0);
        const bv = Number(bVal ?? 0);
        const diff = av - bv;
        if (diff !== 0) return diff * direction;
      }

      return (a.pullRequestId - b.pullRequestId) * direction;
    });
  }

  protected goto(repository: { id: string; name: string, project: { id: string; name: string } }, pullRequestId: number): void {
    const url = `https://dev.azure.com/cito-ivit/${encodeURIComponent(repository.project.name)}/_git/${repository.name}/pullrequest/${pullRequestId}`;
    const w = window.open(url, '_blank');
    if (w) w.opener = null;
  }

}
