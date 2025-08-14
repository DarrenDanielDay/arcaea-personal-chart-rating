import { Injectable } from '@angular/core';
import { AssetsProvider } from './providers';
import { Chart } from 'arcaea-toolbelt-core/models';
import { bundled, songsBase } from 'arcaea-toolbelt-core/assets';

songsBase.set(
  `${new URL(`../${songsBase()}`, _NGX_ENV_.NG_APP_ASSETS_VENDOR)}`
);

@Injectable()
export class ArcaeaToolbeltDataService implements AssetsProvider {
  getJacket(chart: Chart): string {
    return `${bundled.jacket(chart)}`;
  }
}
