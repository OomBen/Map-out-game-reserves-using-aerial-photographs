import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { faXmark as exit, faBars as bars, faAngleLeft as leftArrow } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'aerial-mapping-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit {
  scale = 100;
  top = 0;
  left = 0;
  originalX = 0;
  originalY = 0;
  startX = 0;
  startY = 0;
  d = false;
  exit = exit;
  bars = bars;
  leftArrow = leftArrow;
  isMenuOpen = false;

  @ViewChild('map') map!: ElementRef;
  @ViewChild('menu') menu!: ElementRef;

  scroll = (ev: WheelEvent) => {
    const newScale = this.scale - ev.deltaY * 0.2;
    this.scale = Math.max(newScale, 100);
    // this.left = Math.max(ev.clientX + this.scale / 2, 0);
    // this.top = Math.max(ev.clientY + this.scale / 2, 0);
    this.left = Math.max(this.left - this.scale, 0);
    this.top = Math.max(this.top - this.scale, 0);
  };

  downListener = (ev: MouseEvent) => {
    this.originalX = this.left;
    this.originalY = this.top;
    this.startX = ev.clientX;
    this.startY = ev.clientY;
    this.d = true;
  };

  upListener = (ev: MouseEvent) => {
    this.d = false;
  };

  drag = (ev: MouseEvent) => {
    if (this.d == true) {
      this.left = this.originalX + (this.startX - ev.clientX);
      this.top = this.originalY + (this.startY - ev.clientY);
    }
  };

  menuToggle() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  ngAfterViewInit() {
    if (this.map) {
      this.map.nativeElement.addEventListener('wheel', this.scroll);
      this.map.nativeElement.addEventListener('mousedown', this.downListener);
      this.map.nativeElement.addEventListener('mousemove', this.drag);
      window.addEventListener('mouseup', this.upListener);
    }
  }
}