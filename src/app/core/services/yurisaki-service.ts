import { Injectable } from '@angular/core';
import { AssetsProvider } from './providers';
import { Chart } from 'arcaea-toolbelt-core/models';

@Injectable()
export class YurisakiService implements AssetsProvider {
  getJacket(chart: Chart): string {
    return `https://assets.yurisaki.top/arcaea/jacket/${chart.song.id}/${chart.ratingClass}`;
  }
}
