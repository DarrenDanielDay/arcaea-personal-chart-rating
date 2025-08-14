import {
  Component,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  chartName,
  ChartViewModel,
  ConstantTableViewModel,
  SortingChartViewModel,
} from '../core/models';
import { ConstantTableStore } from '../core/services/constant-table-store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ChartPicker, ChartPickerResult } from '../chart-picker/chart-picker';
import { NavBack } from '../nav-back/nav-back';
import {
  CandidatesPanel,
  CandidatesPanelData,
} from '../candidates-panel/candidates-panel';
import { DataService } from '../core/services/data-service';
import { clone, Nullable } from 'pragmatism/core';
import { ChartCard } from '../chart-card/chart-card';
import { SharedService } from '../core/services/shared-service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-constant-sorting-table',
  imports: [
    FormsModule,
    RouterModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    NavBack,
    ChartCard,
  ],
  template: `
    <app-nav-back>
      <span>
        {{ table()?.table?.title }}
      </span>
      <button
        matIconButton
        [routerLink]="'/table/' + route.snapshot.params['id']"
      >
        <mat-icon>dataset</mat-icon>
      </button>
    </app-nav-back>
    @if (table(); as table) {
    <div class="list" cdkDropList (cdkDropListDropped)="drop($event)">
      @for (vm of table.sorting(); track vm.chart.id) {
      <div class="item" cdkDrag [cdkDragData]="vm">
        <div class="handle" cdkDragHandle>
          <mat-icon>drag_indicator</mat-icon>
        </div>
        <app-chart-card [chart]="vm.chart"></app-chart-card>
        <div class="actions">
          <button matIconButton (click)="remove(vm)">
            <mat-icon>delete</mat-icon>
          </button>
          <button matIconButton (click)="togglePin(vm)">
            <span class="material-symbols-outlined">{{
              vm.isPinned ? 'keep_off' : 'keep'
            }}</span>
            @if (vm.isPinned) {
            <span class="designed">{{ vm.simulatedConstant }}</span>
            }
          </button>
        </div>
      </div>
      }
    </div>
    <button class="right" mat-fab (click)="add()">
      <mat-icon>add</mat-icon>
    </button>
    <button class="left" mat-fab (click)="showList()">
      <mat-icon>list</mat-icon>
    </button>
    } @else if (table() === null) {
    <p>未知的个人定数表id。</p>
    }
    <ng-template #askConstantForm let-context>
      <h2 mat-dialog-title>{{ context.title }}</h2>
      <mat-dialog-content>
        <mat-form-field>
          <mat-label>拟定定数</mat-label>
          <input matInput type="number" [(ngModel)]="context.models.designed" />
          <mat-hint>{{ context.chart }}</mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button matButton (click)="context.close()">取消</button>
        <button matButton (click)="context.confirm()">确认</button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: `
    .designed {
      font-size: 0.5em;
      position: absolute;
      left: 50%;
      top: 100%;
      transform: translateX(-50%);
    }

    .handle {
      cursor: move;
      width: 4em;
      height: 4em;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .list {
      max-width: 100%;
      max-height: calc(100vh - 16em);
      border: solid 1px #ccc;
      min-height: 60px;
      display: block;
      background: white;
      border-radius: 4px;
      overflow: auto;
    }

    .item {
      padding: 1em 1em 1em 0;
      border-bottom: solid 1px #ccc;
      color: rgba(0, 0, 0, 0.87);
      display: flex;
      flex-direction: row;
      align-items: center;
      box-sizing: border-box;
      background: white;
      font-size: 14px;
    }

    app-chart-card {
      flex: 1;
    }

    .cdk-drag-preview {
      border: none;
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
        0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
    }

    .cdk-drag-placeholder {
      opacity: 0;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .item:last-child {
      border: none;
    }

    .list.cdk-drop-list-dragging .item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `,
})
export class ConstantSortingTable {
  protected table = signal<Nullable<ConstantTableViewModel>>(undefined);
  protected data = inject(DataService);
  protected dialog = inject(MatDialog);
  protected sheet = inject(MatBottomSheet);
  protected store = inject(ConstantTableStore);
  protected route = inject(ActivatedRoute);
  protected shared = inject(SharedService);
  protected askConstantForm =
    viewChild.required<TemplateRef<{}>>('askConstantForm');

  constructor() {
    this.route.params.subscribe(async (param) => {
      const id = `${param['id']}`;
      try {
        const tableData = await this.store.get(id);
        const table = await this.shared.tableToVM(tableData);
        this.table.set(table);
      } catch (error) {
        this.table.set(null);
      }
    });
  }

  drop(event: CdkDragDrop<ChartViewModel[]>) {
    this.table()?.ordered.update((ordered) => {
      const newOrdered = structuredClone(ordered);
      moveItemInArray(newOrdered, event.previousIndex, event.currentIndex);
      return newOrdered;
    });
    this.saveTable();
  }

  add() {
    const dialogRef = this.dialog.open<ChartPicker, {}, ChartPickerResult>(
      ChartPicker,
      {
        data: {},
      }
    );
    dialogRef.afterClosed().subscribe(async (res) => {
      if (!res) return;
      const { charts } = res;
      const newCharts = (await this.data.queryChartsByIds(charts)).map((c) =>
        this.shared.chartToVM(c)
      );
      this.table()?.included.update((included) => {
        included = clone(included);
        return [...new Set([...included, ...newCharts])];
      });
      this.saveTable();
    });
  }

  remove(vm: SortingChartViewModel) {
    const table = this.table();
    if (!table) return;
    if (!confirm(`确认将 ${chartName(vm.chart)} 放回候选谱面？`)) return;
    table.ordered.update((ordered) =>
      ordered.filter((id) => id !== vm.chart.id)
    );
    table.pinned.update((pinned) => pinned.filter((c) => c.id !== vm.chart.id));
    this.saveTable();
  }

  togglePin(vm: SortingChartViewModel) {
    const table = this.table();
    if (!table) return;
    if (vm.isPinned) {
      table.pinned.update((pinned) =>
        pinned.filter((it) => it.id !== vm.chart.id)
      );
      this.saveTable();
    } else {
      this.askConstant(vm).subscribe((designed) => {
        if (designed == null) return;
        table.pinned.update((pinned) => [
          ...pinned,
          {
            id: vm.chart.id,
            designed,
          },
        ]);
        this.saveTable();
      });
    }
  }

  async showList() {
    const table = this.table();
    if (!table) return;

    const sheetRef = this.sheet.open<
      CandidatesPanel,
      CandidatesPanelData,
      string | string[]
    >(CandidatesPanel, {
      data: {
        candidates: table.candidates(),
      },
    });
    sheetRef.afterDismissed().subscribe((selected) => {
      if (!selected) return;
      if (!Array.isArray(selected)) {
        // TODO select insert position, now append to head
        table.ordered.update((ordered) => {
          ordered = clone(ordered);
          return [selected, ...ordered];
        });
      } else {
        table.ordered.update((ordered) => [...selected, ...ordered]);
      }
      this.saveTable();
    });
  }

  async saveTable() {
    const table = this.table();
    if (!table) return;
    await this.store.put({
      ...table.table,
      included: table.included().map((c) => c.id),
      ordered: table.ordered(),
      pinned: table.pinned(),
    });
  }

  askConstant(vm: SortingChartViewModel) {
    const designed = signal(NaN);
    const dialogRef = this.dialog.open<any, any, number>(
      this.askConstantForm(),
      {
        data: {
          title: `固定谱面定数`,
          chart: chartName(vm.chart),
          models: {
            designed,
          },
          close() {
            dialogRef.close();
          },
          confirm() {
            const constant = designed();
            if (isNaN(constant)) return;
            dialogRef.close(constant);
          },
        },
      }
    );
    return dialogRef.afterClosed();
  }
}
