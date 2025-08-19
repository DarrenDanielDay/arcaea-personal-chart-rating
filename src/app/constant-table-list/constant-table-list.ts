import {
  Component,
  inject,
  model,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import {
  ConstantTableStore,
  CreateParams,
} from '../core/services/constant-table-store';
import { isPersonalConstantTable, PersonalConstantTable } from '../core/models';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  AssetsPreference,
  SettingsService,
} from '../core/services/settings-service';
import { FileDownload, FileDownloadData } from '../file-download/file-download';
import { formatJSON, Nullable } from 'pragmatism/core';

@Component({
  selector: 'app-constant-table-list',
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatCheckboxModule,
    MatTableModule,
    MatButton,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <div>
      <h2>本地存档列表</h2>
      <button class="left" mat-fab (click)="openSettings()">
        <mat-icon>settings</mat-icon>
      </button>
      <button class="right" mat-fab (click)="openCreate()">
        <mat-icon>add</mat-icon>
      </button>
      @if (tables(); as tables) { @if (!tables.length) {
      <p>暂无本地存档。</p>
      } @else {
      <table mat-table [dataSource]="tables" class="mat-elevation-z8">
        <ng-container matColumnDef="title">
          <td mat-cell *matCellDef="let el">{{ el.title }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <td mat-cell *matCellDef="let el">
            <button matIconButton [routerLink]="edit(el)">
              <mat-icon>format_line_spacing</mat-icon>
            </button>
            <button matIconButton [routerLink]="result(el)">
              <mat-icon>dataset</mat-icon>
            </button>
            <button matIconButton [matMenuTriggerFor]="actionMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #actionMenu>
              <button mat-menu-item (click)="export(el)">导出存档</button>
              <button mat-menu-item (click)="openEdit(el)">修改标题</button>
              <button mat-menu-item (click)="remove(el)">删除</button>
            </mat-menu>
          </td>
        </ng-container>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
      } }
    </div>
    <ng-template #createForm let-context>
      <h2 mat-dialog-title>{{ context.title }}</h2>
      <mat-dialog-content>
        <mat-form-field>
          <mat-label>标题</mat-label>
          <input matInput id="title" [(ngModel)]="context.models.title" />
        </mat-form-field>
        @if (context.isCreate) {
        <div>
          <label for="file"> 导入存档文件数据（可选） </label>
          <input
            #importFile
            type="file"
            (input)="context.models.file.set(importFile.files?.item(0))"
          />
        </div>
        }
      </mat-dialog-content>
      <mat-dialog-actions>
        <button matButton (click)="context.close()">取消</button>
        <button
          matButton
          (click)="context.isCreate ? context.create() : context.edit()"
        >
          确认
        </button>
      </mat-dialog-actions>
    </ng-template>
    <ng-template #settingsForm let-context>
      <h2 mat-dialog-title>设置</h2>
      <mat-dialog-content>
        <div>
          <mat-checkbox [(ngModel)]="context.settings.useYurisaki">
            使用Yurisaki资源
          </mat-checkbox>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button matButton (click)="context.close()">取消</button>
        <button matButton (click)="context.save()">确认</button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: `
    label[for='file'] {
      display: inline-block;
      margin: 0 0 0.5em 0;
    }
    input[type='file'] {
      width: 212px;
      cursor: pointer;
      display: block;
      font-size: 1em;
      line-height: 1.5em;
      border: 1px solid #cccccc;
      &::-webkit-file-upload-button {
        padding: 0.375rem 0.75rem;
        background-color: var(--mat-sys-surface-container);
        pointer-events: none;
        border-color: inherit;
        border-style: solid;
        border-width: 0;
        border-radius: 0;
      }
    }
  `,
})
export class ConstantTableList implements OnInit {
  readonly dialog = inject(MatDialog);
  readonly store = inject(ConstantTableStore);
  readonly settings = inject(SettingsService);
  readonly title = model('');
  readonly tables = signal<PersonalConstantTable[] | null>(null);

  readonly displayedColumns = ['title', 'actions'];

  readonly createForm =
    viewChild.required<TemplateRef<{ data: any }>>('createForm');
  readonly settingsForm =
    viewChild.required<TemplateRef<{ data: any }>>('settingsForm');

  ngOnInit(): void {
    this.fetchList();
  }

  async fetchList() {
    const list = await this.store.list();
    this.tables.set(list);
  }

  openEditor(title: string, isCreate?: boolean) {
    const models = {
      title: signal(''),
      file: signal<Nullable<File>>(null),
    };
    const dialogRef = this.dialog.open<any, any, CreateParams>(
      this.createForm(),
      {
        data: {
          isCreate,
          models,
          title,
          close() {
            dialogRef.close();
          },
          edit() {
            dialogRef.close({
              title: models.title(),
            });
          },
          async create() {
            const file = models.file();
            if (!file) {
              dialogRef.close({
                title: models.title(),
              });
              return;
            }
            try {
              const table = JSON.parse(await file.text());
              if (!isPersonalConstantTable(table)) {
                return alert('存档格式不正确。');
              }
              dialogRef.close({
                ...table,
                title: models.title(),
              });
            } catch (error) {
              alert(error);
            }
          },
        },
      }
    );
    return dialogRef.afterClosed();
  }

  openCreate() {
    this.openEditor('创建个人定数表存档', true).subscribe(async (params) => {
      if (!params) return;
      await this.store.create(params);
      await this.fetchList();
    });
  }

  openEdit(table: PersonalConstantTable) {
    this.openEditor('修改标题').subscribe(async (params) => {
      if (!params) return;
      await this.store.edit({
        ...table,
        ...params,
      });
      await this.fetchList();
    });
  }

  openSettings() {
    const settings = {
      useYurisaki: signal(
        this.settings.getAssetsPreference() === AssetsPreference.Yurisaki
      ),
    };
    const dialogRef = this.dialog.open<any, any, CreateParams>(
      this.settingsForm(),
      {
        data: {
          settings,
          close() {
            dialogRef.close();
          },
          save: () => {
            this.settings.setAssetsPreference(
              settings.useYurisaki()
                ? AssetsPreference.Yurisaki
                : AssetsPreference.EnvironmentVendor
            );
            dialogRef.close();
          },
        },
      }
    );
  }

  async remove(table: PersonalConstantTable) {
    if (!confirm(`确认删除 ${table.title} ？`)) {
      return;
    }
    await this.store.delete(table.id);
    await this.fetchList();
  }

  edit(table: PersonalConstantTable) {
    return `edit/${table.id}`;
  }

  export(table: PersonalConstantTable) {
    const blob = new Blob([formatJSON(table)], { type: 'application/json' });
    this.dialog.open<FileDownload, FileDownloadData, void>(FileDownload, {
      data: {
        blob,
        filename: `${table.title}.json`,
        title: `导出存档：${table.title}`,
      },
    });
  }

  result(table: PersonalConstantTable) {
    return `table/${table.id}`;
  }
}
