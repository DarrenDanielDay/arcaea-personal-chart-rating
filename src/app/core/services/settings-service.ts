import { Injectable } from '@angular/core';
import { cast } from 'pragmatism/core';

const assetsPreference = 'atb.assets';

export enum AssetsPreference {
  Yurisaki = 'yrsk',
  EnvironmentVendor = 'vendor',
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  getAssetsPreference() {
    const value = localStorage.getItem(assetsPreference);
    if (value == null) return AssetsPreference.Yurisaki;
    if (cast<string[]>(Object.values(AssetsPreference)).includes(value)) {
      return value as AssetsPreference;
    }
    return AssetsPreference.EnvironmentVendor;
  }

  setAssetsPreference(preference: AssetsPreference) {
    localStorage.setItem(assetsPreference, preference);
  }
}
