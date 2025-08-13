import { InjectionToken } from '@angular/core';
import { Chart, DataProvider } from 'arcaea-toolbelt-core/models';

export interface AssetsProvider {
  getJacket(chart: Chart): string;
}

export const DATA_PROVIDER = new InjectionToken<DataProvider>(
  'atb.DataProvider'
);
export const ASSETS_PROVIDER = new InjectionToken<AssetsProvider>(
  'atb.AssetsProvider'
);
