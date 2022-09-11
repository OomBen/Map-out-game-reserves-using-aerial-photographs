import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SafeUrl } from '@angular/platform-browser';
import {
  APIService,
  Images,
  ListImageCollectionsQuery,
} from 'src/app/API.service';
import { ControllerService } from 'src/app/api/controller/controller.service';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipDefaultOptions,
} from '@angular/material/tooltip';
import { number, string } from 'yargs';

/** Custom options the configure the tooltip's default show/hide delays. */
export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 500,
  touchendHideDelay: 1000,
};
interface ImageData {
  image: Images;
  url: SafeUrl;
}

interface CatalogData {
  catalogue: any;
  images: ImageData[];
  thumbnails: string[];
  collectionID?: string;
  completed: boolean | undefined | null;
  error: boolean | undefined | null;
  taskID: string | undefined | null;
}

@Component({
  selector: 'aerial-mapping-image-catalogue',
  templateUrl: './image-catalogue.component.html',
  styleUrls: ['./image-catalogue.component.scss'],
  providers: [
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults },
  ],
})
export class ImageCatalogueComponent implements OnInit {
  selected: string;
  tempCatalogues: Array<any> = [];
  catalogues: CatalogData[] = [];
  selectedCatalogue: any = null;

  sort = {
    date: 'date',
    park: 'park',
  };

  constructor(
    public dialog: MatDialog,
    private api: APIService,
    private controller: ControllerService,
    private snackbar: MatSnackBar
  ) {
    this.selected = 'date';
    this.getAllCatalogues();
    this.controller.websocket.onmessage = (msg: any) => {
      this.snackbar.open(`New map stitching job (${msg}) completed.`, '✔️', {
        verticalPosition: 'top',
        duration: 3000,
      });
      //make 'View Map' button visible
      this.getAllCatalogues();
    };
  }

  ngOnInit() {
    this.controller.websocket.onmessage = (msg: any) => {
      console.log('SNS message received ', msg);
      this.getAllCatalogues();
    };
  }

  getAllCatalogues() {
    this.api
      .ListImageCollections()
      .then((data: ListImageCollectionsQuery) => {
        console.log(data);

        for (const catalog of data.items) {
          this.catalogues.push({
            catalogue: catalog,
            images: [],
            thumbnails: [],
            collectionID: catalog?.collectionID,
            completed: catalog?.completed,
            error: catalog?.error,
            taskID: catalog?.taskID
          });
        }

        for (const catalogData of this.catalogues) {
          //console.log(22,catalogData.catalogue.collectionID);
          this.api
            .ImagesByCollectionId(catalogData.catalogue.collectionID)
            .then((resp: any) => {
              //console.log(resp.items);
              for (const image of resp.items) {
                catalogData.images.push({ image: image, url: '' });
              }

                for (const i of catalogData.images) {
                  this.controller
                    .S3download(
                      i.image.imageID,
                      catalogData.catalogue.collectionID,
                      'images',
                      false
                    )
                    .then((signedURL) => {
                      i.url = signedURL;
                    });
                }

                for(let i = 0;i<3;i++){
                  this.controller
                    .S3download(
                      "thumbnail_"+i,
                      catalogData.catalogue.collectionID,
                      'thumbnails',
                      false
                    )
                    .then((signedURL) => {
                      catalogData.thumbnails.push(signedURL);
                    });
                }
                // this.sortByDate();
                this.tempCatalogues = this.catalogues;
              })
              .catch((e) => console.log(e));
          }
        });
      }

  //             for (var i = 0; i < 3; i++) {
  //               this.controller
  //                 .S3download(
  //                   'thumbnail_' + i,
  //                   catalogData.catalogue.collectionID,
  //                   'thumbnails',
  //                   false
  //                 )
  //                 .then((signedURL) => {
  //                   catalogData.thumbnails.push(signedURL);
  //                 });
  //             }
  //             // this.sortByDate();
  //             this.tempCatalogues = this.catalogues;
  //           })
  //           .catch((e) => console.log(e));
  //       }

  //       return data.items;
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //       if (e.errors[0].message == 'Network Error') {
  //         this.snackbar.open('Network error...', '❌', {
  //           verticalPosition: 'top',
  //         });
  //       }
  //     });
  // }

  orderByDate() {
    // for (let i = 0; i < this.catalogues.length - 1; i++) {
    //   let swapped = false;
    //   for (let j = 0; j < this.catalogues.length - i - 1; j++) {
    //     if (
    //       this.catalogues[j].catalogue.createdAt >
    //       this.catalogues[j + 1].catalogue.createdAt
    //     ) {
    //       let temp = this.catalogues[j];
    //       this.catalogues[j] = this.catalogues[j + 1];
    //       this.catalogues[j + 1] = temp;
    //       swapped = true;
    //     }
    //   }
    //   if (swapped == false) break;
    // }

    this.catalogues.sort(function (a, b) {
      if (a.catalogue.createdAt < b.catalogue.createdAt) {
        return -1;
      }
      if (a.catalogue.createdAt > b.catalogue.createdAt) {
        return 1;
      }
      return 0;
    });
  }

  orderByPark() {
    this.catalogues.sort(function (a, b) {
      if (a.catalogue.GamePark.park_name < b.catalogue.GamePark.park_name) {
        return -1;
      }
      if (a.catalogue.GamePark.park_name > b.catalogue.GamePark.park_name) {
        return 1;
      }
      return 0;
    });
  }

  searchCatalogues() {
    // search for either a matching date string or a collection name
    // or a park name?
    const searchTerm = (<HTMLInputElement>(
      document.getElementById('searchInput')
    )).value.toLowerCase();

    this.catalogues = this.tempCatalogues;
    this.catalogues = this.catalogues.filter((c) => {
      let id = '';
      if (c.collectionID) {
        id = c.collectionID.toLowerCase();
      }
      return id.includes(searchTerm);
    });
  }

  onChangeSort(selectedOption: any) {
    this.selected = selectedOption.target.value;
    if (this.selected == 'date') {
      this.sortByDate();
    } else if (this.selected == 'park') {
      this.sortByPark();
    }
  }

  sortByDate() {
    this.catalogues.sort((a, b) => {
      return (
        new Date(a.catalogue.upload_date_time!).getTime() -
        new Date(b.catalogue.upload_date_time!).getTime()
      );
    });
  }

  sortByPark() {
    this.catalogues.sort((a: any, b: any) => a.parkID - b.parkID!);
  }

  enlarge(catalogue: CatalogData) {
    const doc = document.getElementById('popup');
    if (doc !== null) {
      this.selectedCatalogue = catalogue;
      doc.style.display = 'block';
    }
  }

  openImageDialog(catalogue: CatalogData): void {
    this.selectedCatalogue = catalogue;

    console.log(this.selectedCatalogue);

    const dialogRef = this.dialog.open(ImageDialogComponent, {
      width: '100vw',
      data: { selectedCatalogue: this.selectedCatalogue },
    });
  }

  showmap(taskID: string) {
    console.log(taskID);
  }
}
