import { Component, input } from '@angular/core';
import { ChartViewModel } from '../core/models';
import { color } from '../utils/misc';

@Component({
  selector: 'app-chart-card',
  imports: [],
  template: `
    @if (chart(); as chart) {
    <div class="card">
      <img class="jacket" [src]="chart.jacket" />
      <div class="details">
        <div class="rating" [style.background]="color(chart.difficulty)">
          {{ chart.officialConstant.toFixed(1) }}
        </div>
        <div>
          <span class="title"> {{ chart.title }} </span>
        </div>
      </div>
    </div>
    }
  `,
  styles: `
    .card {
      display: flex;
      gap: 0.5em;
      align-items: center;
    }
    .details {

    }
    .rating {
      color: white;
      border-radius: 0.5em;
      width: 4em;
      text-align: center;
    }
    .difficulty {
      font-weight: bold;
    }
  `,
})
export class ChartCard {
  chart = input.required<ChartViewModel>();
  color = color;
}
