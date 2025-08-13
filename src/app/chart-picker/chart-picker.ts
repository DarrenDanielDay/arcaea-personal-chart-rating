import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { difficulties } from 'arcaea-toolbelt-core/constants';
import { DataService } from '../core/services/data-service';
import { color } from '../utils/misc';

export interface ChartPickerResult {
  charts: string[];
}

@Component({
  selector: 'app-chart-picker',
  imports: [
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  template: `
    <h2 mat-dialog-title>选择谱面</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="constant-range">
          <mat-form-field floatLabel="always">
            <mat-label>最小定数</mat-label>
            <input matInput type="number" [formControl]="minConstant" />
          </mat-form-field>
          <mat-form-field floatLabel="always">
            <mat-label>最大定数</mat-label>
            <input matInput type="number" [formControl]="maxConstant" />
          </mat-form-field>
        </div>
        <mat-form-field class="difficulties">
          <mat-label>难度</mat-label>
          <mat-select [formControl]="difficulties" multiple>
            @for (difficulty of Difficulties; track difficulty) {
            <mat-option [value]="difficulty">
              <span class="difficulty" [style.color]="color(difficulty)">
                {{ difficulty.toString().toUpperCase() }}
              </span>
            </mat-option>
            }
          </mat-select>
        </mat-form-field>
        <div class="actions">
          <button matButton (click)="add()">添加至候选谱面</button>
        </div>
      </form>
    </mat-dialog-content>
  `,
  styles: `
    .constant-range {
      display: flex;
      gap: 2em;
      justify-content: space-between;
    }
    .difficulties {
      width: 100%;
    }
    .difficulty {
      font-weight: bold;
    }
    .actions {
      display: flex;
      flex-direction: row-reverse;
    }
  `,
})
export class ChartPicker {
  data = inject(DataService);
  dialogRef = inject<MatDialogRef<ChartPicker, ChartPickerResult>>(
    MatDialogRef,
    { optional: true }
  );
  minConstant = new FormControl<number>(-Infinity);
  maxConstant = new FormControl<number>(Infinity);
  difficulties = new FormControl(difficulties.filter((_, i) => i > 0));
  Difficulties = difficulties;
  form = new FormGroup({
    minConstant: this.minConstant,
    maxConstant: this.maxConstant,
    difficulties: this.difficulties,
  });

  color = color;

  async add() {
    if (!this.dialogRef) {
      return;
    }
    const { difficulties, minConstant, maxConstant } = this.form.value;
    const charts = await this.data.queryCharts({
      constantRange: [minConstant, maxConstant],
      difficultyRange: difficulties ?? [],
    });
    this.dialogRef.close({
      charts: charts.map((c) => c.id),
    });
  }
}
