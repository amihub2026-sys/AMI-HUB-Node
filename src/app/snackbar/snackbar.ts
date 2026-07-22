import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SnackbarService, SnackbarType } from '../services/snackbar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snackbar.html',
  styleUrls: ['./snackbar.css']
})
export class SnackbarComponent implements OnInit, OnDestroy {
  message = '';
  visible = false;
  type: SnackbarType = 'info';

  private timer: any;
  private sub?: Subscription;

  constructor(
  private snackbarService: SnackbarService,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit(): void {
    this.sub = this.snackbarService.snackbar$.subscribe(data => {
      this.show(data.message, data.type);
    });
  }

  show(message: string, type: SnackbarType = 'info'): void {

  setTimeout(() => {

    this.message = message;

    this.type = type;

    this.visible = true;

    this.cdr.detectChanges();


  });


  clearTimeout(this.timer);


  this.timer = setTimeout(() => {

    this.visible = false;

    this.cdr.detectChanges();

  }, 2500);

}

  hide(): void {
    this.visible = false;
    clearTimeout(this.timer);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearTimeout(this.timer);
  }
}
