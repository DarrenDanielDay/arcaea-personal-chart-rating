import { Component, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { Chart } from 'arcaea-toolbelt-core/models';
import { ASSETS_PROVIDER } from '../core/services/providers';
import { ChartCard } from '../chart-card/chart-card';
import { ChartViewModel } from '../core/models';
import { MatButtonModule } from '@angular/material/button';

export interface CandidatesPanelData {
  candidates: ChartViewModel[];
}

@Component({
  selector: 'app-candidates-panel',
  imports: [MatListModule, MatButtonModule, ChartCard],
  template: `
    <h3>
      <span>候选谱面</span>
      @if (data.candidates.length) {
      <button matButton (click)="pickAll()">全部追加</button>
      }
    </h3>
    <mat-list>
      @if (!data.candidates.length) {
      <p>暂无候选谱面。</p>
      } @for (chart of data.candidates; track chart.id) {
      <mat-list-item (click)="select(chart)">
        <app-chart-card [chart]="chart" />
      </mat-list-item>
      }
    </mat-list>
  `,
  styles: `
  h3 {
    display: flex;
    align-items: center;
    span {
      flex: 1;
    }
  }
    mat-list-item {
      display: inline-flex;
      align-items: center;
      & > * {
        display: inline-block;
      }
    }
    mat-list {
      max-height: 50vh;
      overflow-y: scroll;
    }
  `,
})
export class CandidatesPanel {
  protected data = inject<CandidatesPanelData>(MAT_BOTTOM_SHEET_DATA);
  protected assets = inject(ASSETS_PROVIDER);
  protected sheet = inject<
    MatBottomSheetRef<CandidatesPanel, string | string[]>
  >(MatBottomSheetRef, {
    optional: true,
  });

  color(chart: Chart) {
    return `var(--${chart.difficulty})`;
  }

  select(chart: ChartViewModel) {
    this.sheet?.dismiss(chart.id);
  }

  pickAll() {
    this.sheet?.dismiss(this.data.candidates.map((c) => c.id));
  }
}
