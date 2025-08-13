import { inject, Injectable } from '@angular/core';
import { Chart } from 'arcaea-toolbelt-core/models';
import {
  ChartViewModel,
  ConstantTableViewModel,
  PersonalConstantTable,
  SortingChartViewModel,
} from '../models';
import { ASSETS_PROVIDER } from './providers';
import { DataService } from './data-service';
import { Fixed } from 'pragmatism';

export interface GroupConstantOptions {
  fixed?: boolean;
  ascending?: boolean; // default sorted descending
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private assets = inject(ASSETS_PROVIDER);
  private data = inject(DataService);

  async tableToVM(
    tableData: PersonalConstantTable
  ): Promise<ConstantTableViewModel> {
    const table = new ConstantTableViewModel(tableData);
    const charts = await this.data.queryChartsByIds(tableData.included);
    table.included.set(charts.map((c) => this.chartToVM(c)));
    table.ordered.set(tableData.ordered);
    table.pinned.set(tableData.pinned);
    return table;
  }

  grouped(
    simulated: SortingChartViewModel[],
    { fixed, ascending }: GroupConstantOptions = {}
  ) {
    const groups = new Map<number, SortingChartViewModel[]>();
    for (const item of simulated) {
      let constant = item.simulatedConstant;
      constant = (
        fixed ? Fixed.round(constant, 1) : Fixed.floor(constant, 1)
      ).valueOf();
      const group = groups.get(constant) ?? [];
      groups.set(constant, group);
      group.push(item);
    }
    return [...groups]
      .sort(([a], [b]) => (ascending ? a - b : b - a))
      .map(([constant, group]) => ({
        constant,
        sorted: group.sort((a, b) =>
          ascending
            ? a.simulatedConstant - b.simulatedConstant
            : b.simulatedConstant - a.simulatedConstant
        ),
      }));
  }

  chartToVM(chart: Chart): ChartViewModel {
    return {
      id: chart.id,
      difficulty: chart.difficulty,
      jacket: this.assets.getJacket(chart),
      level: chart.level,
      officialConstant: chart.constant,
      title: chart.title,
    };
  }
}
