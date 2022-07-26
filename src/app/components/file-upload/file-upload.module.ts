import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from './file-upload.component';
import { NavbarModule } from '../shared/navbar/navbar.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@NgModule({
  declarations: [ FileUploadComponent ],
  imports: [
    CommonModule,
    NavbarModule,
    MatProgressBarModule,
    MatSnackBarModule
  ]
})
export class FileUploadModule { }