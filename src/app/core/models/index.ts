import { computed, signal } from '@angular/core';
import { Difficulty } from 'arcaea-toolbelt-core/constants';
import {
  isNumber,
  isObjectLike,
  isString,
  notnull,
  Nullable,
} from 'pragmatism/core';

export interface ChartViewModel {
  id: string;
  jacket: string;
  title: string;
  level: string;
  difficulty: Difficulty;
  officialConstant: number;
}

export function chartName(chart: ChartViewModel) {
  return `${chart.title} [${chart.difficulty.toUpperCase()} ${chart.level}]`;
}

export interface SortingChartViewModel {
  chart: ChartViewModel;
  simulatedConstant: number;
  isPinned: boolean;
}

export interface SimulatedResult {
  message?: string;
  list: SortingChartViewModel[];
}

export class ConstantTableViewModel {
  included = signal<ChartViewModel[]>([]);
  ordered = signal<string[]>([]);
  pinned = signal<PinnedChart[]>([]);
  candidates = computed(() => {
    const ordered = new Set(this.ordered());
    return this.included().filter((c) => !ordered.has(c.id));
  });
  sorting = computed(() => {
    const included = new Map(this.included().map((c) => [c.id, c]));
    const pinned = new Map(this.pinned().map((c) => [c.id, c]));
    const ordered = this.ordered();
    return ordered.map<SortingChartViewModel>((id) => ({
      chart: notnull(included.get(id)),
      isPinned: pinned.has(id),
      simulatedConstant: pinned.get(id)?.designed ?? NaN,
    }));
  });
  simulated = computed<SimulatedResult>(() => {
    const included = new Map(this.included().map((c) => [c.id, c]));
    const pinned = new Map(this.pinned().map((c) => [c.id, c]));
    const ordered = this.ordered();
    let upper: Nullable<{
      i: number;
      designed: number;
    }>;
    const simulated: number[] = [];
    for (let i = 0; i < ordered.length; i++) {
      const chartId = ordered[i];
      const pc = pinned.get(chartId);
      if (!pc) continue;
      if (upper == null) {
        if (i !== 0) {
          return {
            message: '排最上面的谱面未指定定数',
            list: [],
          };
        } else {
          simulated.push(pc.designed);
        }
      } else if (pc.designed > upper.designed) {
        const a = notnull(included.get(ordered[i]));
        const b = notnull(included.get(ordered[upper.i]));
        return {
          message: `${chartName(a)} 与 ${chartName(b)} 指定的定数大小关系相反`,
          list: [],
        };
      } else {
        const gap = upper.designed - pc.designed;
        const count = i - upper.i;
        const step = gap / count;
        for (let j = 1; j <= count; j++) {
          simulated.push(upper.designed - step * j);
        }
        // ensure it to be the same value as designed
        simulated[i] = pc.designed;
      }
      upper = { i, designed: pc.designed };
    }

    if (simulated.length !== ordered.length) {
      return {
        message: '排最下面的谱面未指定定数',
        list: [],
      };
    }

    return {
      list: ordered.map<SortingChartViewModel>((id, i) => ({
        chart: notnull(included.get(id)),
        isPinned: pinned.has(id),
        simulatedConstant: notnull(simulated.at(i)),
      })),
    };
  });
  excluded = computed<ChartViewModel[]>(() => {
    const ordered = new Set(this.ordered());
    return this.included().filter((c) => !ordered.has(c.id));
  });
  constructor(public readonly table: PersonalConstantTable) {}
}

export interface PinnedChart {
  id: string;
  designed: number;
}

export interface PersonalConstantTable {
  /** id为创建时的时间戳 */
  id: string;
  title: string;
  /** 已选择谱面id */
  included: string[];
  /** 已降序排列的谱面id */
  ordered: string[];
  pinned: PinnedChart[];
}

export function createPersonalConstantTable(): PersonalConstantTable {
  return {
    id: '',
    included: [],
    ordered: [],
    pinned: [],
    title: '',
  };
}

// TODO describe object shape
export function isPersonalConstantTable(
  value: unknown
): value is PersonalConstantTable {
  return (
    isObjectLike(value) &&
    'id' in value &&
    isString(value.id) &&
    'title' in value &&
    isString(value.title) &&
    'included' in value &&
    Array.isArray(value.included) &&
    value.included.every(isString) &&
    'ordered' in value &&
    Array.isArray(value.ordered) &&
    value.ordered.every(isString) &&
    'pinned' in value &&
    Array.isArray(value.pinned) &&
    value.pinned.every(
      (item): item is PinnedChart =>
        isObjectLike(item) &&
        'id' in item &&
        isString(item.id) &&
        'designed' in item &&
        isNumber(item.designed)
    )
  );
}
