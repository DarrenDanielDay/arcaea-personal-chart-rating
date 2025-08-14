import {
  Component,
  ElementRef,
  inject,
  signal,
  TemplateRef,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { NavBack } from '../nav-back/nav-back';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { ConstantTableStore } from '../core/services/constant-table-store';
import { switchMap } from 'rxjs';
import {
  GroupConstantOptions,
  SharedService,
} from '../core/services/shared-service';
import { DataService } from '../core/services/data-service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConstantTableViewModel, SortingChartViewModel } from '../core/models';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileDownload, FileDownloadData } from '../file-download/file-download';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { border, colorPointInterpolation } from '../utils/misc';

type ToModels<T> = {
  [K in keyof T]-?: WritableSignal<T[K]>;
};

interface ConstantTableSettings extends ToModels<GroupConstantOptions> {
  officialDiff: WritableSignal<boolean>;
  pinned: WritableSignal<boolean>;
  threshold: WritableSignal<number>;
}

const easy = '#55ff55';
const normal = '#ffff55';
const hard = '#ff5555';
const out = '#cccccc';

@Component({
  selector: 'app-constant-table',
  imports: [
    NavBack,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule,
    RouterModule,
    AsyncPipe,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    @if (table | async; as table) {
    <app-nav-back>
      <span>
        {{ table.table.title }}
      </span>
      <button
        matIconButton
        [routerLink]="'/edit/' + route.snapshot.params['id']"
      >
        <mat-icon>format_line_spacing</mat-icon>
      </button>
    </app-nav-back>
    @if (table.simulated(); as simulated) { @if (simulated.message) {
    {{ simulated.message }}
    } @else {
    <button mat-fab class="left" [disabled]="loading()" (click)="export(table)">
      @if(loading()) {
      <mat-spinner diameter="24"></mat-spinner>
      } @else {
      <mat-icon>open_in_new</mat-icon>
      }
    </button>
    <button mat-fab class="right" (click)="openSettings()">
      <mat-icon>settings</mat-icon>
    </button>
    <table #constantTable class="table">
      <tbody>
        @if(shared.grouped(simulated.list, {fixed: settings.fixed(), ascending:
        settings.ascending()}); as groups) { @for (group of groups; track
        group.constant;) {
        <tr class="group">
          <td
            class="constant"
            [style.background-color]="constantColor(groups.length, $index)"
          >
            {{ group.constant }}
          </td>
          <td class="list">
            @for (vm of group.sorted; track vm.chart.id) {
            <div class="chart">
              <img
                class="jacket"
                [src]="vm.chart.jacket"
                [class]="border(vm.chart.difficulty)"
              />
              <span
                [class]="diffClass(vm)"
                [class.simulated]="true"
                [class.pinned]="settings.pinned() && vm.isPinned"
              >
                @if (settings.officialDiff()) {
                {{ diff(vm) }}
                } @else {
                {{ vm.simulatedConstant.toFixed(3) }}
                }
              </span>
            </div>
            }
          </td>
        </tr>
        } }
        <tr class="group">
          <td class="constant out">论外</td>
          <td class="list">
            @for (chart of table.excluded(); track chart.id) {
            <div class="chart">
              <img
                class="jacket"
                [src]="chart.jacket"
                [class]="border(chart.difficulty)"
              />
              <span>
                {{ chart.officialConstant.toFixed(1) }}
              </span>
            </div>
            }
          </td>
        </tr>
      </tbody>
    </table>
    } } }
    <ng-template #settingsPanel let-context>
      <h3 mat-dialog-title>定数表设置</h3>
      <mat-dialog-content>
        <div>
          <mat-checkbox [(ngModel)]="settings.fixed">
            使用四舍五入分配定数
          </mat-checkbox>
        </div>
        <div>
          <mat-checkbox [(ngModel)]="settings.ascending">
            升序排列定数
          </mat-checkbox>
        </div>
        <div>
          <mat-checkbox [(ngModel)]="settings.officialDiff">
            显示与官谱定数差值
          </mat-checkbox>
        </div>
        <div>
          <mat-checkbox [(ngModel)]="settings.pinned">
            标记被固定的定数
          </mat-checkbox>
        </div>
        <mat-form-field>
          <mat-label>定数偏差阈值</mat-label>
          <input type="number" matInput [(ngModel)]="settings.threshold" />
          <mat-hint>
            判定“虚高/虚低”的阈值。拟合的定数与定数组中间值的差超过该阈值会被判定为“虚高/虚低”。定数组中间值：在未使用四舍五入时为定数+0.05，使用四舍五入时为定数本身。
          </mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button matButton (click)="context.close()">完成</button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: `
    mat-spinner {
      height: 2em;
      width: 2em;
    }
    table {
      border-collapse: collapse;
    }
    .group {
      border: 1px grey solid;
    }
    .constant {
      border: 1px grey solid;
      width: 3em;
      text-align: center;
      padding: 0.5em;
    }
    .list {
      padding: 0.5em;
      display: flex;
      gap: 0.25em;
      flex-wrap: wrap;
    }
    .chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25em;
    }
    .out {
      background-color: #cccccc;
    }
    .simulated {
      box-sizing: border-box;
      display: inline-block;
      width: 100%;
      text-align: center;
      border: 2px transparent solid;
      border-radius: 0.5em;
      &.pinned {
        border-color: grey;
      }
    }
    .easy {
      color: green;
    }
    .hard {
      color: red;
    }
    .normal {
      color: grey;
    }
    mat-form-field {
      width: 100%;
    }
  `,
})
export class ConstantTable {
  protected route = inject(ActivatedRoute);
  protected store = inject(ConstantTableStore);
  protected shared = inject(SharedService);
  protected data = inject(DataService);
  protected dialog = inject(MatDialog);
  protected loading = signal(false);
  protected settings: ConstantTableSettings = {
    ascending: signal(false),
    fixed: signal(false),
    officialDiff: signal(true),
    pinned: signal(true),
    threshold: signal(0.075),
  };
  protected table = this.route.params.pipe(
    switchMap((params) => this.store.get(params['id'])),
    switchMap((table) => this.shared.tableToVM(table))
  );
  tableEl = viewChild<ElementRef<HTMLTableElement>>('constantTable');
  settingsPanel = viewChild.required<TemplateRef<void>>('settingsPanel');

  async export(vm: ConstantTableViewModel) {
    const el = this.tableEl();
    if (!el) return;
    try {
      this.loading.set(true);
      const html2canvas = await import("html2canvas");
      const canvas = await html2canvas.default(el.nativeElement, {
        useCORS: true,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject();
          }
        }, 'image/jpeg');
      });
      const filename = `${vm.table.title}.jpg`;
      this.loading.set(false);
      await new Promise<void>((resolve) => {
        const dialogRef = this.dialog.open<
          FileDownload,
          FileDownloadData,
          void
        >(FileDownload, {
          data: { blob, filename, title: '导出图片' },
        });
        dialogRef.afterClosed().subscribe(() => {
          resolve();
        });
      });
    } finally {
      this.loading.set(false);
    }
  }

  async openSettings() {
    const dialogRef = this.dialog.open(this.settingsPanel(), {
      data: {
        close() {
          dialogRef.close();
        },
      },
    });
  }

  border = border;

  classic = (constant: number) =>
    this.settings.fixed() ? constant : constant + 0.05;

  diffClass = (vm: SortingChartViewModel) => {
    const delta = vm.simulatedConstant - vm.chart.officialConstant;
    const threshold = this.settings.threshold();
    return delta < -threshold ? 'easy' : delta > threshold ? 'hard' : 'normal';
  };

  constantColor = (length: number, i: number) => {
    const colors = [easy, normal, hard];
    if (!this.settings.ascending()) {
      colors.reverse();
    }
    return colorPointInterpolation(colors, 0, length - 1, i);
  };

  diff = (vm: SortingChartViewModel) => {
    const delta = vm.simulatedConstant - vm.chart.officialConstant;
    return `${delta > 0 ? '+' : ''}${delta.toFixed(3)}`;
  };
}
