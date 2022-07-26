import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapcollectionComponent } from './map-collections.component';
import { NavbarModule } from '../shared/navbar/navbar.module';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@NgModule({
  declarations: [ MapcollectionComponent ],
  imports: [
    CommonModule,
    NavbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatCardModule
  ]
})
export class MapCollectionsModule { }