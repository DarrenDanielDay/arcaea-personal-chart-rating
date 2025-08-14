import { inject, Injectable } from '@angular/core';
import { DATA_PROVIDER } from './providers';
import { Difficulty } from 'arcaea-toolbelt-core/constants';
import { Chart, EntityFactory } from 'arcaea-toolbelt-core/models';
import { Nullable } from 'pragmatism';

export interface ChartsQuery {
  constantRange: [Nullable<number>?, Nullable<number>?];
  difficultyRange: Difficulty[];
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  data = inject(DATA_PROVIDER);
  factory = new EntityFactory(this.data);
  #charts: Nullable<Chart[]>;

  async #getAllCharts() {
    return (this.#charts ??= (await this.factory.getAllSongs()).flatMap(
      (s) => s.charts
    ));
  }

  async queryChartsByIds(ids: string[]) {
    const charts = await this.#getAllCharts();
    const idSet = new Set(ids);
    return charts.filter(c => idSet.has(c.id));
  }

  async queryCharts({ constantRange, difficultyRange }: ChartsQuery) {
    const charts = await this.#getAllCharts();
    let [min, max] = constantRange;
    min ??= -Infinity;
    max ??= Infinity;
    return charts.filter(
      (c) =>
        min <= c.constant &&
        c.constant <= max &&
        difficultyRange.includes(c.difficulty)
    );
  }
}
