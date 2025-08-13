import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface FileDownloadData {
  title: string;
  blob: Blob;
  filename: string;
}

@Component({
  selector: 'app-file-download',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>若下载未自动开始，请点击下方链接。</p>
      <a #anchor [download]="data.filename" [href]="url">{{ data.filename }}</a>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button matButton (click)="dialogRef.close()">完成</button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class FileDownload implements AfterViewInit, OnDestroy {
  data = inject<FileDownloadData>(MAT_DIALOG_DATA);
  dialogRef = inject<MatDialogRef<FileDownload, void>>(MatDialogRef);
  url = URL.createObjectURL(this.data.blob);
  anchor = viewChild.required<ElementRef<HTMLAnchorElement>>('anchor');

  ngAfterViewInit(): void {
    this.anchor().nativeElement.click();  
  }

  ngOnDestroy(): void {
    URL.revokeObjectURL(this.url);
  }
}
