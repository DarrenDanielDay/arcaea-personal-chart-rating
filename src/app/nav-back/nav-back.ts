import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-back',
  imports: [MatIconModule, MatButtonModule, RouterModule],
  template: `
    <div>
      <button matIconButton routerLink="/">
        <mat-icon>home</mat-icon>
      </button>
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    div {
      margin: 0.5em;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `,
})
export class NavBack {}
